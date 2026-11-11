import { createClient } from 'npm:@supabase/supabase-js@2.100.1';
import {sendPush} from './protocol.ts';
const origin='https://pedroyavier-pixel.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 try {
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 const cronToken=req.headers.get('x-fittrack-cron');
 if(!token&&!cronToken)return reply({error:'Unauthorized'},401);
 let userId:string|undefined;
 if(!cronToken){const {data,error}=await admin.auth.getUser(token);if(error||!data.user)return reply({error:'Unauthorized'},401);userId=data.user.id;}
 const {data:config,error:configError}=await admin.from('fittrack_push_config').select('*').eq('id',true).single();
 if(configError||!config)throw new Error('Config unavailable');
 if(cronToken&&cronToken!==config.cron_token)return reply({error:'Unauthorized'},401);
 let subscriptions:any[]=[];
 if(userId){
 const body=await req.json();
 if(typeof body.subscriptionId!=='string')return reply({error:'Missing subscription'},400);
 const {data,error}=await admin.from('fittrack_push_subscriptions').select('id,user_id,endpoint,updated_at').eq('id',body.subscriptionId).eq('user_id',userId).eq('enabled',true).single();
 if(error||!data)return reply({error:'Subscription not found'},404);
 // Per-device test throttle; modifying own subscription can never target another account.
 if(Date.now()-new Date(data.updated_at).getTime()<60000 && body.first!==true)return reply({error:'Espera un minuto antes de repetir la prueba.'},429);
 await admin.from('fittrack_push_subscriptions').update({enabled:true}).eq('id',data.id);
 subscriptions=[data];
 }else{const {data,error}=await admin.rpc('fittrack_claim_push');if(error)throw error;subscriptions=data||[];}
 let sent=0,failed=0;
 for(const sub of subscriptions){
 let status=0;
 try{status=await sendPush(sub.endpoint,config);}catch{status=0;}
 if(status>=200&&status<300)sent++;else failed++;
 if(status===404||status===410)await admin.from('fittrack_push_subscriptions').update({enabled:false}).eq('id',sub.id);
 if(!userId)await admin.from('fittrack_push_deliveries').update({status:status>=200&&status<300?'sent':'failed',response_code:status}).eq('subscription_id',sub.id).eq('pr_date',sub.pr_date).eq('slot',sub.slot);
 }
 return reply({sent,failed},userId&&failed?502:200);
 }catch{console.error('FitTrack push request failed');return reply({error:'No se pudo enviar el aviso. Inténtalo de nuevo.'},500);}
});
