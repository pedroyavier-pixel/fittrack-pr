import type {FrequencyRecommendation} from '../lib/trainingDesign';
const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
/** Availability remains authoritative. Advice never changes a calendar or promises results. */
export function FrequencyAdvice({advice,compact=false}:{advice?:FrequencyRecommendation|null;compact?:boolean}) {
 if(!advice)return null;
 const content=<>
  <div className="frequency-metrics">
   <div><span className="eyebrow">TU AGENDA ACTUAL</span><strong>{advice.availableDays} días / semana</strong></div>
   <div><span className="eyebrow">ORIENTACIÓN SEGÚN TUS RESPUESTAS</span><strong>{advice.recommendedDays} días / semana</strong><small className="muted">Rango orientativo: {advice.minDays}–{advice.maxDays}</small></div>
  </div>
  <p>{advice.reason}</p>
  <p className="muted">{advice.adaptation}</p>
  {advice.suggestedDays.length>0 && <p className="small"><strong>Distribución orientativa:</strong> {advice.suggestedDays.map(day=>dayNames[day]).join(' · ')}.</p>}
  {advice.canExpand&&advice.extraDayFocus.length>0&&<div><strong>Si más adelante amplías tu disponibilidad</strong><ul>{advice.extraDayFocus.map((focus,i)=><li key={i}>{focus}</li>)}</ul></div>}
  <p className="muted small">Esta orientación organiza las sesiones; no es un mínimo obligatorio ni una evaluación de tu recuperación. El calendario utiliza únicamente los días que elegiste. Más días no implican más intensidad ni resultados garantizados.</p>
 </>;
 return compact?<details className="card frequency-advice"><summary>Tu frecuencia y la lógica de la semana</summary><div className="stack">{content}</div></details>:<section className="card stack frequency-advice" aria-label="Frecuencia y adaptación de tu programa"><h3>Una semana que encaja contigo</h3>{content}</section>;
}
