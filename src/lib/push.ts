export const VAPID_PUBLIC_KEY = "BLeHv2_wvrmSJUQDaj04KD76eSgcAuO9WcnZqdd8TNmh6vFYUSZejog44lpLywOI_CNqS0dY6igchWWAuIT4RSo";
import { supabase } from './client';
export const PUSH_TABLE = 'fittrack_push_subscriptions';
export function pushSupport() {
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const installed=window.matchMedia?.('(display-mode: standalone)').matches||(navigator as Navigator & {standalone?:boolean}).standalone;
 return {supported:'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window,needsInstall:ios&&!installed};
}
export async function currentPush(userId:string) {
 if(!pushSupport().supported)return null;
 const reg=await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
 const sub=await reg?.pushManager.getSubscription();
 if(!sub)return null;
 const {data,error}=await supabase.from(PUSH_TABLE).select('id,enabled').eq('user_id',userId).eq('endpoint',sub.endpoint).maybeSingle();
 if(error)throw error;
 return data?.enabled?data.id as string:null;
}
export async function enablePush(userId:string) {
 // Call permission directly from the tap, before any network/worker awaits (iOS requirement).
 const permission=await Notification.requestPermission();
 if(permission!=='granted')throw new Error('No se concedió el permiso. Puedes habilitarlo en Ajustes del iPhone → Notificaciones → FitTrack.');
 const reg=await navigator.serviceWorker.ready;
 const bytes=Uint8Array.from(atob(VAPID_PUBLIC_KEY.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const sub=(await reg.pushManager.getSubscription())||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 const {data,error}=await supabase.from(PUSH_TABLE).upsert({user_id:userId,endpoint:sub.endpoint,enabled:true},{onConflict:'endpoint'}).select('id').single();
 if(error){await sub.unsubscribe();throw error;}
 return data.id as string;
}
export async function disablePush(userId:string) {
 if(!('serviceWorker' in navigator))return;
 const reg=await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
 const sub=await reg?.pushManager.getSubscription();
 if(!sub)return;
 const {error}=await supabase.from(PUSH_TABLE).update({enabled:false}).eq('user_id',userId).eq('endpoint',sub.endpoint);
 if(error)throw error;
 await sub.unsubscribe();
}
export async function testPush(subscriptionId:string) {
 const {data,error}=await supabase.functions.invoke('fittrack-push',{body:{subscriptionId,first:true}});
 if(error||data?.failed||!data?.sent)throw new Error('No se pudo enviar la prueba. Revisa la conexión y vuelve a activar los avisos.');
}
