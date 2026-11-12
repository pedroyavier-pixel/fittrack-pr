/** Explicit load conventions. Historical rows without metadata are never reinterpreted. */
export type LoadBasis = 'total' | 'per_hand' | 'per_side' | 'bar_sides';
export const loadLabels: Record<LoadBasis,string> = {
  total:'Total indicado por el equipo', per_hand:'Por mancuerna / mano',
  per_side:'Discos por cada lado (sin resistencia base)', bar_sides:'Discos por cada lado + barra',
};
export function normalizeLoad(enteredLb:number,loadBasis:LoadBasis,barWeightLb?:number) {
  if(!Number.isFinite(enteredLb)||enteredLb<0||enteredLb>3000||!Object.hasOwn(loadLabels,loadBasis)) throw new Error('Introduce una carga válida y su convención.');
  if(loadBasis==='bar_sides'&&(!Number.isFinite(barWeightLb)||barWeightLb!<0||barWeightLb!>300)) throw new Error('Indica el peso real de la barra o resistencia inicial de la Smith.');
  const total=loadBasis==='bar_sides'?2*enteredLb+barWeightLb!:loadBasis==='per_side'||loadBasis==='per_hand'?2*enteredLb:enteredLb;
  return {weightLb:loadBasis==='per_hand'?enteredLb:total,enteredWeightLb:enteredLb,loadBasis,barWeightLb:loadBasis==='bar_sides'?barWeightLb:null,totalLoadLb:total};
}
export function defaultLoadBasis(id:string):LoadBasis {
  if(['bench-press','incline-bench-press','romanian-deadlift','hip-thrust','ez-bar-curl','single-leg-barbell-rdl'].includes(id)) return 'bar_sides';
  if(/dumbbell|hammer-curl|lateral-raises|bulgarian|seated-arnold-press/.test(id)) return 'per_hand';
  return 'total';
}
