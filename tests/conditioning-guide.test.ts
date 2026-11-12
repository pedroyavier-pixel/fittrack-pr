// @vitest-environment jsdom
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {buildGuide,applyGuide,initialAnswers,validateAnswers,type GuideAnswers} from '../src/lib/personalization';
import {cardioActivities,trainingStyles} from '../src/data/conditioning';
import {FitStore} from '../src/lib/store';

vi.mock('../src/lib/client',()=>({supabase:{from:vi.fn(()=>{throw new Error('Unexpected network access');})}}));
const answers=(patch:Partial<GuideAnswers>={}):GuideAnswers=>({
 ...initialAnswers,version:2,sex:'male',allergyReviewed:true,age:'30-49',activity:'sedentary',
 experience:'returning',goal:'recomp',equipment:'gym',trainingStyle:'classic',
 cardioChoices:['walk'],impactTolerance:'any',cardioAccess:true,days:[1,3,5],minutes:30,
 professionalSupport:'no',dietaryCare:'no',consent:true,...patch,
});

beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});});

describe('Guía ampliada: modalidades, estilos y presupuesto de sesión',()=>{
 it('respeta el presupuesto y las selecciones en 1,440 combinaciones de estilo, equipo, tiempo y modalidad',()=>{
  for(const style of trainingStyles)for(const equipment of ['gym','hybrid','dumbbells','bodyweight','walking'])for(const minutes of [20,30,45,60])for(const activity of cardioActivities){
   const a=answers({trainingStyle:style.id,equipment,minutes,cardioChoices:[activity.id]});
   const guide=buildGuide(a);
   const context=`${style.id}/${equipment}/${minutes}/${activity.id}`;
   if(activity.id==='adaptive'){
    expect(guide.blocked,context).toBe(true);
    expect(guide.plans.every(p=>p.type==='rest'&&p.exerciseIds.length===0&&!p.conditioning&&p.cardio?.length===0),context).toBe(true);
    continue;
   }
   expect(guide.blocked,context).toBe(false);
   const active=guide.plans.filter(p=>p.type!=='rest');
   expect(active.map(p=>p.day).sort(),context).toEqual([...a.days].sort());
   expect(active.flatMap(p=>p.cardio||[]).every(p=>p.kind===activity.id),context).toBe(true);
   expect(active.flatMap(p=>p.cardio||[]).length,context).toBeGreaterThan(0);
   for(const plan of guide.plans){
    const duration=(plan.sessionPhases||[]).reduce((sum,phase)=>sum+phase.minutes,0);
    expect(duration,context).toBeLessThanOrEqual(minutes+0.001);
    expect((plan.sessionPhases||[]).every(phase=>Number.isFinite(phase.minutes)&&phase.minutes>=0),context).toBe(true);
    // Modern prescriptions are authoritative; legacy mirrors cannot add cardio twice.
    expect(plan.walkMinutes,context).toBe(0);
    expect(plan.rope,context).toBeUndefined();
    const conditioning=plan.conditioning;
    if(conditioning){
     expect(plan.exerciseIds.some(id=>conditioning.exerciseIds.includes(id)),context).toBe(false);
     expect(conditioning.durationMinutes,context).toBe(conditioning.rounds*conditioning.exerciseIds.length);
     expect(conditioning.workSeconds+conditioning.restSeconds,context).toBe(60);
     expect(conditioning.rounds,context).toBeGreaterThan(0);
    }
    for(const id of [...plan.exerciseIds,...(conditioning?.exerciseIds||[])])expect(guide.catalog.some(exercise=>exercise.id===id),context).toBe(true);
   }
  }
 });

 it('genera EMOM real con una estación por minuto y conserva descanso al completar las repeticiones',()=>{
  const guide=buildGuide(answers({trainingStyle:'crossfit',experience:'regular',minutes:45}));
  const blocks=guide.plans.flatMap(p=>p.conditioning?[p.conditioning]:[]);
  expect(blocks.length).toBeGreaterThan(0);
  expect(new Set(blocks.map(block=>block.format))).toEqual(new Set(['emom','circuit']));
  for(const block of blocks){expect(block.workSeconds).toBeLessThan(60);expect(block.restSeconds).toBeGreaterThan(0);if(block.format==='emom')expect(block.instruction).toMatch(/descansa el tiempo restante/);}
  expect(guide.warnings.join(' ')).toMatch(/no genera WOD avanzados/);
 });

 it('mantiene circuitos en su propio bloque, sin sumar otra rutina completa de series',()=>{
  const guide=buildGuide(answers({trainingStyle:'circuit',experience:'new'}));
  const strength=guide.plans.filter(p=>p.type==='strength');
  expect(strength.length).toBeGreaterThan(0);
  expect(strength.every(p=>p.exerciseIds.length===0&&p.conditioning?.format==='circuit')).toBe(true);
  const store=new FitStore('circuit-owner');
  applyGuide(store,answers({trainingStyle:'circuit',experience:'new'}));
  expect(store.list('workout_plan_exercises')).toHaveLength(0);
  expect(store.list('workout_plans').some(row=>row.data.conditioning?.exerciseIds.length)).toBe(true);
  expect(store.list('user_profiles')[0].data.personalization.version).toBe(2);
 });

 it('mezcla gimnasio y calistenia en el entorno híbrido',()=>{
  const guide=buildGuide(answers({equipment:'hybrid',experience:'regular',days:[1,2,4,5],minutes:60}));
  const ids=guide.plans.flatMap(p=>p.exerciseIds);
  expect(ids).toContain('push-ups');
  expect(ids).toContain('lat-pulldown');
  expect(ids).toContain('chair-squat');
  expect(ids).toContain('seated-leg-curl');
 });

 it('no introduce equipo de resistencia ni tirones ficticios en un entorno de peso corporal',()=>{
  const allowed=new Set(['chair-squat','wall-push-up','push-ups','glute-bridge','bodyweight-reverse-lunge','single-leg-glute-bridge']);
  for(const style of trainingStyles){
   const guide=buildGuide(answers({equipment:'bodyweight',trainingStyle:style.id,experience:'regular',minutes:60}));
   expect(guide.catalog.length).toBeGreaterThan(0);
   expect(guide.catalog.every(exercise=>allowed.has(exercise.id)&&exercise.bodyweight)).toBe(true);
   expect(guide.warnings.join(' ')).toMatch(/tirón/);
  }
 });

 it('filtra impacto y equipo sin sustituir la preferencia por un cardio no seleccionado',()=>{
  const guide=buildGuide(answers({equipment:'walking',cardioChoices:cardioActivities.map(activity=>activity.id),impactTolerance:'low',cardioAccess:false}));
  const prescriptions=guide.plans.flatMap(p=>p.cardio||[]);
  expect(prescriptions.length).toBeGreaterThan(0);
  expect(prescriptions.every(item=>item.kind==='walk')).toBe(true);
  expect(guide.warnings.join(' ')).toMatch(/Se omiten por impacto o acceso/);
  expect(()=>buildGuide(answers({cardioChoices:['run'],impactTolerance:'low'}))).toThrow(/compatible/);
  expect(()=>buildGuide(answers({cardioChoices:['cycle'],cardioAccess:false}))).toThrow(/compatible/);
 });

 it('no añade tiempo extra para encajar demasiadas modalidades y explica las que quedan pendientes',()=>{
  const selected=cardioActivities.filter(activity=>activity.id!=='adaptive').map(activity=>activity.id);
  const guide=buildGuide(answers({equipment:'walking',cardioChoices:selected,days:[1,4],minutes:20}));
  expect(guide.warnings.join(' ')).toMatch(/no incluye todavía todas las opciones/);
  expect(guide.plans.flatMap(p=>p.cardio||[]).every(item=>selected.includes(item.kind))).toBe(true);
 });
});

describe('Cuestionario nuevo y compatibilidad',()=>{
 it('exige sexo y revisión explícita de exclusiones en la versión 2',()=>{
  expect(()=>validateAnswers(answers({sex:undefined}))).toThrow(/sexo/);
  expect(()=>validateAnswers(answers({allergyReviewed:false}))).toThrow(/exclusiones/);
  expect(()=>validateAnswers(answers({cardioChoices:[]}))).toThrow(/cardio/);
  expect(()=>validateAnswers(answers({trainingStyle:undefined}))).toThrow(/estilo/);
 });
 it('respeta la salida temprana para menores o personas que requieren orientación',()=>{
  const guide=buildGuide(answers({age:'under18',sex:undefined,allergyReviewed:undefined,trainingStyle:undefined,cardioChoices:[],impactTolerance:undefined,cardioAccess:undefined}));
  expect(guide.blocked).toBe(true);
  expect(guide.catalog).toHaveLength(0);
  expect(guide.plans.every(p=>p.type==='rest')).toBe(true);
 });
 it('mantiene las respuestas antiguas sin imponer nuevos campos',()=>{
  const legacy:GuideAnswers={...initialAnswers,age:'30-49',activity:'sedentary',experience:'returning',goal:'recomp',equipment:'gym',professionalSupport:'no',consent:true};
  expect(()=>validateAnswers(legacy)).not.toThrow();
  expect(buildGuide(legacy).plans.some(p=>p.type==='strength')).toBe(true);
 });
 it('no calcula metas energéticas o cargas a partir de sexo o peso',()=>{
  const male=buildGuide(answers({sex:'male',weight:'120'}));
  const female=buildGuide(answers({sex:'female',weight:'250'}));
  expect(female.plans).toEqual(male.plans);
  expect(female.catalog).toEqual(male.catalog);
  expect(female.menus).toEqual(male.menus);
  expect(male).not.toHaveProperty('calorieTarget');
 });
});
