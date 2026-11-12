// @vitest-environment jsdom
import {describe,expect,it,vi} from 'vitest';
import {buildGuide,initialAnswers,type GuideAnswers} from '../src/lib/personalization';
import {recommendFrequency,spacedDays} from '../src/lib/trainingDesign';
import {trainingStyles} from '../src/data/conditioning';
import {exercises} from '../src/data/training';

vi.mock('../src/lib/client',()=>({supabase:{from:vi.fn(()=>{throw new Error('Unexpected network access');})}}));
const answers=(patch:Partial<GuideAnswers>={}):GuideAnswers=>({
 ...initialAnswers,version:2,sex:'male',allergyReviewed:true,age:'30-49',activity:'sedentary',
 experience:'returning',goal:'recomp',equipment:'gym',trainingStyle:'classic',
 cardioChoices:['walk'],impactTolerance:'any',cardioAccess:true,days:[1,3,5],minutes:30,
 professionalSupport:'no',dietaryCare:'no',consent:true,...patch,
});
const main=(guide:ReturnType<typeof buildGuide>)=>guide.plans.filter(plan=>plan.type!=='rest'&&!plan.optional);
const signature=(plan:ReturnType<typeof buildGuide>['plans'][number])=>[...plan.exerciseIds,...(plan.conditioning?.exerciseIds||[])].join(',');

describe('Diseño semanal 3: variedad que conserva referencias',()=>{
 it('gimnasio A/B/C usa selecciones y prioridades distintas, incluso con solo 20 minutos',()=>{
  const guide=buildGuide(answers({minutes:20}));
  const sessions=main(guide);
  expect(sessions).toHaveLength(3);
  expect(new Set(sessions.map(signature)).size).toBe(3);
  expect(sessions[0].exerciseIds).toEqual(['leg-press','incline-dumbbell-press','seated-cable-row']);
  expect(sessions[1].exerciseIds).toEqual(['dumbbell-rdl','lat-pulldown','machine-shoulder-press']);
  expect(sessions[2].exerciseIds).toEqual(['goblet-squat','flat-dumbbell-press','chest-supported-row']);
  expect(sessions.every(plan=>plan.focus&&plan.rationale&&plan.effort)).toBe(true);
 });
 it('conserva los mismos movimientos entre semanas y no introduce cambios aleatorios',()=>{
  const input=answers({experience:'regular',goal:'strength',minutes:60});
  const first=buildGuide(input),second=buildGuide(input);
  expect(second).toEqual(first);
  expect(first.plans.flatMap(plan=>plan.exerciseIds)).toContain('bench-press');
  expect(first.plans.flatMap(plan=>plan.exerciseIds)).toContain('romanian-deadlift');
  expect(first.designVersion).toBe(3);
 });
 it('meta y experiencia cambian selección, series y distribución real',()=>{
  const experienced=buildGuide(answers({experience:'regular',goal:'strength',minutes:60,days:[1,2,4,5]}));
  const health=buildGuide(answers({experience:'new',goal:'health',minutes:60,days:[1,2,4,5]}));
  expect(main(experienced)).toHaveLength(4);
  expect(main(health)).toHaveLength(2);
  expect(experienced.catalog.every(exercise=>exercise.sets===3)).toBe(true);
  expect(health.catalog.every(exercise=>exercise.sets===2)).toBe(true);
  expect(experienced.plans.flatMap(plan=>plan.exerciseIds)).not.toEqual(health.plans.flatMap(plan=>plan.exerciseIds));
  expect(health.plans.filter(plan=>plan.optional)).toHaveLength(2);
 });
 it('cuatro días de gimnasio distinguen superior A/B e inferior A/B',()=>{
  const sessions=main(buildGuide(answers({experience:'regular',days:[1,2,4,5],minutes:60})));
  expect(sessions).toHaveLength(4);
  expect(sessions.map(plan=>plan.focus)).toEqual(expect.arrayContaining([
   expect.stringContaining('superior A'),expect.stringContaining('inferior A'),expect.stringContaining('superior B'),expect.stringContaining('inferior B'),
  ]));
  expect(new Set(sessions.map(signature)).size).toBe(4);
  expect(sessions[1].exerciseIds[0]).toBe('leg-press');
  expect(sessions[3].exerciseIds[0]).toBe('hip-thrust');
 });
 it('cross training con tres días separa fuerza, circuito técnico y base aeróbica',()=>{
  const sessions=main(buildGuide(answers({trainingStyle:'cross_training',experience:'regular'})));
  expect(sessions).toHaveLength(3);
  expect(sessions[0].exerciseIds.length).toBeGreaterThan(0);
  expect(sessions[0].conditioning).toBeUndefined();
  expect(sessions[1].conditioning?.format).toBe('circuit');
  expect(sessions[1].exerciseIds).toEqual([]);
  expect(sessions[2].type).toBe('cardio');
  expect(sessions[2].focus).toMatch(/Base aeróbica/);
 });
 it('el cuarto día de entrenamiento cruzado aporta otra fuerza de cadera',()=>{
  const sessions=main(buildGuide(answers({trainingStyle:'cross_training',experience:'regular',minutes:45,days:[1,2,4,5],cardioChoices:['walk','cycle']})));
  expect(sessions).toHaveLength(4);
  expect(sessions[3].exerciseIds[0]).toBe('dumbbell-rdl');
  expect(sessions[3].exerciseIds).not.toEqual(sessions[0].exerciseIds);
  expect(sessions[3].focus).toMatch(/cadera/);
 });
 it('los circuitos alternan estaciones reales entre A/B/C sin duplicar series tradicionales',()=>{
  const sessions=main(buildGuide(answers({trainingStyle:'circuit',experience:'regular'})));
  expect(sessions).toHaveLength(3);
  expect(new Set(sessions.map(signature)).size).toBe(3);
  for(const session of sessions){expect(session.exerciseIds).toEqual([]);expect(session.conditioning?.format).toBe('circuit');}
 });
 it('CrossFit básico alterna EMOM/circuito y movimientos; principiantes se mantienen en circuitos',()=>{
  const regular=main(buildGuide(answers({trainingStyle:'crossfit',experience:'regular',minutes:45})));
  expect(regular.map(plan=>plan.conditioning?.format)).toEqual(['emom','circuit','emom']);
  expect(new Set(regular.map(signature)).size).toBe(3);
  const beginner=main(buildGuide(answers({trainingStyle:'crossfit',experience:'new',minutes:45})));
  expect(beginner).toHaveLength(2);
  expect(beginner.every(plan=>plan.conditioning?.format==='circuit')).toBe(true);
 });
 it('resistencia con cinco días combina dos fuerzas, intervalos controlados, una base mayor y recuperación fácil',()=>{
  const guide=buildGuide(answers({trainingStyle:'endurance',experience:'regular',goal:'endurance',minutes:20,days:[1,2,3,4,5]}));
  const sessions=main(guide),cardio=sessions.filter(plan=>plan.type==='cardio');
  expect(sessions).toHaveLength(5);
  expect(sessions.filter(plan=>plan.type==='strength')).toHaveLength(2);
  expect(cardio).toHaveLength(3);
  const interval=cardio.find(plan=>plan.focus?.includes('Intervalos'))!;
  const longer=cardio.find(plan=>plan.focus?.includes('sostenida'))!;
  const easy=cardio.find(plan=>plan.focus?.includes('Recuperación'))!;
  expect(interval.cardio?.[0].rounds).toBeGreaterThan(0);
  expect(interval.cardio?.[0].intensity).not.toMatch(/esfuerzo máximo como objetivo/);
  expect(longer.cardio!.reduce((sum,item)=>sum+item.minutes,0)).toBeGreaterThan(easy.cardio!.reduce((sum,item)=>sum+item.minutes,0));
 });
 it('una persona nueva recibe esfuerzo cómodo sin añadir intervalos exigentes para ocupar su agenda',()=>{
  const guide=buildGuide(answers({trainingStyle:'endurance',experience:'new',goal:'health',days:[1,2,3,4,5],equipment:'walking'}));
  expect(main(guide)).toHaveLength(2);
  expect(guide.plans.filter(plan=>plan.optional)).toHaveLength(3);
  expect(guide.plans.flatMap(plan=>plan.cardio||[]).every(item=>!item.rounds&&item.intensity.includes('cómodo'))).toBe(true);
 });
 it('en casa varía entre movimientos disponibles sin inventar un tirón sin resistencia',()=>{
  const body=buildGuide(answers({equipment:'bodyweight',experience:'regular',minutes:45}));
  const allowed=new Set(['chair-squat','wall-push-up','push-ups','glute-bridge','single-leg-glute-bridge','bodyweight-reverse-lunge']);
  expect(body.catalog.every(exercise=>allowed.has(exercise.id)&&exercise.bodyweight)).toBe(true);
  expect(new Set(main(body).map(signature)).size).toBe(3);
  expect(body.warnings.join(' ')).toMatch(/tirón sin resistencia/);
  const dumbbell=main(buildGuide(answers({equipment:'dumbbells',experience:'regular',minutes:20})));
  expect(dumbbell[1].exerciseIds.slice(0,3)).toEqual(['dumbbell-rdl','dumbbell-row','wall-push-up']);
 });
});

describe('Frecuencia orientativa y agenda activada son independientes',()=>{
 it('puede recomendar cinco con tres disponibles, sin activar días nuevos ni aumentar la intensidad para compensar',()=>{
  const input=answers({trainingStyle:'cross_training',experience:'regular',minutes:20,cardioChoices:['walk','cycle','row']});
  const guide=buildGuide(input),frequency=guide.frequencyRecommendation!;
  expect(frequency.availableDays).toBe(3);
  expect(frequency.recommendedDays).toBe(5);
  expect(frequency.canExpand).toBe(true);
  expect(frequency.suggestedDays).toHaveLength(5);
  expect(input.days.every(day=>frequency.suggestedDays.includes(day))).toBe(true);
  expect(main(guide).map(plan=>plan.day)).toEqual(input.days);
  expect(guide.plans.filter(plan=>plan.type!=='rest')).toHaveLength(3);
  expect(frequency.reason).toMatch(/No serían cinco sesiones intensas/);
  expect(frequency.adaptation).toMatch(/no se añaden automáticamente/);
 });
 it('no convierte cinco días de disponibilidad de un principiante en cinco obligaciones',()=>{
  const guide=buildGuide(answers({experience:'new',goal:'health',days:[1,2,3,4,5]}));
  expect(guide.frequencyRecommendation).toMatchObject({availableDays:5,recommendedDays:2,minDays:2,maxDays:3,canExpand:false});
  expect(main(guide)).toHaveLength(2);
  expect(guide.plans.filter(plan=>plan.optional).every(plan=>plan.type==='recovery')).toBe(true);
 });
 it('separa lunes/miércoles/viernes cuando existen esos huecos, considerando también domingo/lunes',()=>{
  expect(spacedDays([1,2,3,4,5],3)).toEqual([1,3,5]);
  const selected=spacedDays([0,1,2,4,6],3);
  expect(selected.some(day=>selected.includes((day+1)%7))).toBe(false);
 });
 it('el trabajo físico modera una recomendación ampliada sin usar sexo o peso como capacidad',()=>{
  const base=answers({trainingStyle:'endurance',goal:'endurance',experience:'regular',minutes:20});
  expect(recommendFrequency(base).recommendedDays).toBe(5);
  const physical=recommendFrequency({...base,activity:'physical'});
  expect(physical.recommendedDays).toBe(3);
  expect(physical.reason).toMatch(/trabajo físico/);
  expect(physical.reason).not.toMatch(/Cinco bloques/);
  const female=buildGuide({...base,sex:'female',weight:'120'}),male=buildGuide({...base,sex:'male',weight:'250'});
  expect(female.plans).toEqual(male.plans);
  expect(female.frequencyRecommendation).toEqual(male.frequencyRecommendation);
 });
 it('no muestra una frecuencia automática en una guía pendiente de valoración profesional',()=>{
  const guide=buildGuide(answers({professionalSupport:'yes'}));
  expect(guide.blocked).toBe(true);
  expect(guide.frequencyRecommendation).toBeUndefined();
  expect(guide.plans.every(plan=>plan.type==='rest')).toBe(true);
 });
 it('mantiene tiempo, catálogo, modalidades y ausencia de duplicaciones en una matriz de 1,440 agendas',()=>{
  const available=[[1,4],[1,3,5],[1,2,4,5],[1,2,3,4,5]];
  const ids=new Set(exercises.map(exercise=>exercise.id));
  for(const style of trainingStyles)for(const equipment of ['gym','hybrid','dumbbells','bodyweight','walking'])for(const minutes of [20,30,45,60])for(const experience of ['new','returning','regular'])for(const days of available){
   const input=answers({trainingStyle:style.id,equipment,minutes,experience,days,cardioChoices:['walk','cycle']});
   const guide=buildGuide(input);
   for(const plan of guide.plans){
    expect((plan.sessionPhases||[]).reduce((sum,phase)=>sum+phase.minutes,0)).toBeLessThanOrEqual(minutes+0.001);
    if(!days.includes(plan.day))expect(plan.type).toBe('rest');
    expect((plan.cardio||[]).every(item=>input.cardioChoices!.includes(item.kind))).toBe(true);
    expect([...plan.exerciseIds,...(plan.conditioning?.exerciseIds||[])].every(id=>ids.has(id))).toBe(true);
    if(plan.conditioning){expect(plan.exerciseIds).toEqual([]);expect(plan.conditioning.workSeconds+plan.conditioning.restSeconds).toBe(60);}
   }
  }
 });
});
