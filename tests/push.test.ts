import {afterEach,describe,it,expect,vi} from 'vitest';
import {validEndpoint,sendPush} from '../supabase/functions/fittrack-push/protocol';
afterEach(()=>vi.unstubAllGlobals());
describe('Web Push protocol',()=>{
 it('only permits exact HTTPS push provider hosts',()=>{
  for(const endpoint of ['https://web.push.apple.com/a','https://fcm.googleapis.com/fcm/send/a','https://updates.push.services.mozilla.com/wpush/v2/a'])expect(validEndpoint(endpoint)).toBe(true);
  for(const endpoint of ['https://127.0.0.1/x','http://web.push.apple.com/x','https://web.push.apple.com.evil.test/x','https://user:secret@web.push.apple.com/x','https://web.push.apple.com:8443/x','https://example.com/x'])expect(validEndpoint(endpoint)).toBe(false);
 });
 it('signs a valid ES256 VAPID JWT without sending a personal payload',async()=>{
  const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',keys.privateKey);
  const publicRaw=new Uint8Array(await crypto.subtle.exportKey('raw',keys.publicKey));
  const public_key=Buffer.from(publicRaw).toString('base64url');
  const request=vi.fn(async(_url:string,_options:RequestInit)=>new Response(null,{status:201}));vi.stubGlobal('fetch',request);
  expect(await sendPush('https://web.push.apple.com/example',{private_jwk:jwk,public_key})).toBe(201);
  const options=request.mock.calls[0][1] as RequestInit;
  const authorization=(options.headers as Record<string,string>).Authorization;
  const token=authorization.match(/^vapid t=(.*), k=/)![1];
  const [head,body,sig]=token.split('.');
  const claims=JSON.parse(Buffer.from(body,'base64url').toString());
  expect(claims.aud).toBe('https://web.push.apple.com');
  expect(claims.exp).toBeGreaterThan(Date.now()/1000);
  expect(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},keys.publicKey,Buffer.from(sig,'base64url'),new TextEncoder().encode(head+'.'+body))).toBe(true);
  expect((options.body as Uint8Array).length).toBe(0);expect(options.redirect).toBe('error');
 });
});
