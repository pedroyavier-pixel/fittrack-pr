import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { currentPush, disablePush, enablePush, pushSupport, testPush } from '../lib/push';
export function PushSettings({userId}:{userId:string}) {
 const [subscription,setSubscription]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const {supported,needsInstall}=pushSupport();
 useEffect(()=>{let active=true;currentPush(userId).then(id=>{if(active)setSubscription(id);}).catch(()=>{if(active)setError('No se pudo comprobar el estado. Revisa tu conexión.');});return()=>{active=false;};},[userId]);
 async function run(action:()=>Promise<void>){setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(e instanceof Error?e.message:'No se pudieron actualizar las notificaciones.');}finally{setBusy(false);}}
 return <section className="card stack">
  <div className="section-title"><h2><Bell size={20}/> Recordatorios de entrenamiento</h2><span className="badge">{subscription?'Activados en este dispositivo':'Sin activar'}</span></div>
  <p>FitTrack te avisa a las <strong>5:00 p. m.</strong> y, si todavía no registraste actividad, a las <strong>8:00 p. m.</strong>: «Aún estás a tiempo».</p>
  <p className="muted">Horario de Puerto Rico · Lunes, martes, jueves y viernes, según tus días de fuerza. Una serie completada, cardio o una sesión finalizada y sincronizada detienen los avisos de ese día. Funcionan aunque la app esté cerrada.</p>
  {needsInstall&&<p className="notice">En Safari, pulsa Compartir → Añadir a pantalla de inicio. Abre FitTrack desde ese icono y vuelve aquí para activar los avisos.</p>}
  {!supported&&!needsInstall&&<p className="notice">Este navegador no admite notificaciones push. Prueba desde Safari en iPhone con FitTrack añadida a la pantalla de inicio.</p>}
  <div className="row">
  {!subscription?<button type="button" className="btn" disabled={busy||!supported||needsInstall} onClick={()=>run(async()=>{const id=await enablePush(userId);setSubscription(id);setMessage('Notificaciones activadas. Puedes enviar una prueba a este dispositivo.');})}><Bell size={18}/> Activar notificaciones</button>:<>
   <button type="button" className="btn" disabled={busy} onClick={()=>run(async()=>{await testPush(subscription);setMessage('Aviso de prueba enviado. Revisa las notificaciones de FitTrack en este dispositivo.');})}>Enviar aviso de prueba</button>
   <button type="button" className="btn ghost" disabled={busy} onClick={()=>run(async()=>{await disablePush(userId);setSubscription(null);setMessage('Avisos desactivados en este dispositivo.');})}><BellOff size={18}/> Desactivar</button>
  </>}
  </div>
  <p className="muted small">Actívalos en cada dispositivo donde quieras recibirlos. No se puede comprobar actividad pendiente sin conexión. El modo Concentración y los permisos del sistema pueden silenciar los avisos.</p>
  {busy&&<p role="status">Actualizando notificaciones…</p>}{message&&<p className="notice" role="status">{message}</p>}{error&&<p className="danger" role="alert">{error}</p>}
 </section>;
}
