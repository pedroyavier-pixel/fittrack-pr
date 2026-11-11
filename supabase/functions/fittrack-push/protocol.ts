const origin='https://pedroyavier-pixel.github.io';
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const encode=(value:unknown)=>b64(new TextEncoder().encode(JSON.stringify(value)));
export function validEndpoint(value:string) {
 try { const u=new URL(value); return u.protocol==='https:' && !u.port && !u.username && !u.password && (u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='push.services.mozilla.com'); } catch { return false; }
}
export async function sendPush(endpoint:string,config:any) {
 if(!validEndpoint(endpoint))return 400;
 const key=await crypto.subtle.importKey('jwk',config.private_jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const jwt=encode({typ:'JWT',alg:'ES256'})+'.'+encode({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:origin+'/fittrack-pr/'});
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(jwt));
 // RFC 8030/8292: payload-free push needs no personal payload or encryption keys.
 const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{Authorization:`vapid t=${jwt}.${b64(new Uint8Array(signature))}, k=${config.public_key}`,TTL:'600',Urgency:'normal'},body:new Uint8Array(),signal:AbortSignal.timeout(10000)});
 return response.status;
}
