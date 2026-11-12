// @vitest-environment jsdom
import {act} from 'react';
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {CardioCard,ConditioningBlock} from '../src/components/Workout';
import {FitStore} from '../src/lib/store';
import {exercises} from '../src/data/training';
import {type ConditioningPrescription} from '../src/data/conditioning';
vi.mock('../src/lib/client',()=>({supabase:{}}));
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});vi.stubGlobal('confirm',()=>true);});
afterEach(()=>{cleanup();vi.useRealTimers();});
const date='2026-11-12';
const cyclePlan={type:'cardio',cardio:[{kind:'cycle',minutes:30,intensity:'Ritmo cómodo'}]};
const input=(name:string)=>screen.getByLabelText(name) as HTMLInputElement;

describe('Cardio real, variado y separado del plan',()=>{
 it('precarga bicicleta, mantiene cero registros hasta confirmar y guarda RPE real',()=>{
  const store=new FitStore('cardio-user');render(<CardioCard store={store} date={date} plan={cyclePlan}/>);
  expect((screen.getByLabelText('Actividad') as HTMLSelectElement).value).toBe('cycle');
  expect(input('Tiempo realizado (minutos)').value).toBe('30');
  expect(screen.queryByLabelText('Pasos (opcional)')).toBeNull();
  expect(store.list('cardio_logs')).toHaveLength(0);
  fireEvent.change(input('Distancia (km, opcional)'),{target:{value:'12.5'}});
  fireEvent.change(input('Esfuerzo percibido RPE (1–10, opcional)'),{target:{value:'7.5'}});
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs')[0].data).toMatchObject({kind:'cycle',title:'Bicicleta',minutes:30,distanceKm:12.5,steps:null,rpe:7.5,lowImpact:true,plannedCardio:{kind:'cycle',minutes:30}});
 });
 it('cambiar actividad borra distancia y pasos anteriores, incluso entre dos modalidades con distancia',()=>{
  const store=new FitStore('cardio-user');render(<CardioCard store={store} date={date} plan={{type:'cardio',walkMinutes:20}}/>);
  fireEvent.change(input('Distancia (km, opcional)'),{target:{value:'5'}});
  fireEvent.change(input('Pasos (opcional)'),{target:{value:'5000'}});
  fireEvent.change(screen.getByLabelText('Actividad'),{target:{value:'row'}});
  expect(input('Distancia (km, opcional)').value).toBe('');
  expect(screen.queryByLabelText('Pasos (opcional)')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs')[0].data).toMatchObject({kind:'row',distanceKm:null,steps:null});
 });
 it('permite intervalos de carrera y rechaza fracciones y valores no finitos',()=>{
  const store=new FitStore('cardio-user');render(<CardioCard store={store} date={date} plan={{type:'cardio',cardio:[{kind:'run',minutes:20,rounds:5,workSeconds:20,restSeconds:60,intensity:'Moderado'}]}}/>);
  fireEvent.change(input('Trabajo (segundos)'),{target:{value:'1.5'}});
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs')).toHaveLength(0);
  expect(screen.getByRole('alert').textContent).toContain('enteros');
  fireEvent.change(input('Trabajo (segundos)'),{target:{value:'Infinity'}});
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs')).toHaveLength(0);
  fireEvent.change(input('Trabajo (segundos)'),{target:{value:'20'}});
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  const log=store.list('cardio_logs')[0];
  expect(log.data).toMatchObject({kind:'run',intervals:true,rounds:5,workSeconds:20,restSeconds:60,lowImpact:false});
  expect(log.data.minutes).toBeCloseTo((5*20+4*60)/60);
 });
 it('conserva actividad, minutos, fecha y plan del borrador al pasar medianoche',()=>{
  const store=new FitStore('cardio-user');const view=render(<CardioCard store={store} date={date} plan={cyclePlan}/>);
  fireEvent.change(input('Tiempo realizado (minutos)'),{target:{value:'12'}});
  view.rerender(<CardioCard store={store} date="2026-11-13" plan={{type:'cardio',cardio:[{kind:'walk',minutes:60,intensity:'Suave'}]}}/>);
  expect(input('Tiempo realizado (minutos)').value).toBe('12');
  expect(input('Fecha del registro (Puerto Rico)').value).toBe(date);
  expect((screen.getByLabelText('Actividad') as HTMLSelectElement).value).toBe('cycle');
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs',date)[0].data).toMatchObject({kind:'cycle',minutes:12,plannedCardio:{kind:'cycle',minutes:30}});
  expect(store.list('cardio_logs','2026-11-13')).toHaveLength(0);
 });
 it('edita movilidad antigua sin convertirla en cuica ni mover su fecha por medianoche',()=>{
  const store=new FitStore('cardio-user');const old=store.save('cardio_logs',{kind:'mobility',title:'Movilidad general',minutes:10},{local_date:date});
  const view=render(<CardioCard store={store} date={date} plan={cyclePlan}/>);
  fireEvent.click(screen.getByRole('button',{name:'Editar'}));
  fireEvent.change(input('Tiempo realizado (minutos)'),{target:{value:'14'}});
  view.rerender(<CardioCard store={store} date="2026-11-13" plan={cyclePlan}/>);
  fireEvent.click(screen.getByRole('button',{name:'Actualizar actividad'}));
  expect(store.list('cardio_logs')).toHaveLength(1);
  expect(store.list('cardio_logs')[0]).toMatchObject({id:old.id,local_date:date,data:{kind:'mobility',title:'Movilidad',minutes:14}});
 });
 it('permite elegir una segunda actividad planificada sin registrar la primera',()=>{
  const store=new FitStore('cardio-user');render(<CardioCard store={store} date={date} plan={{type:'strength',cardio:[...cyclePlan.cardio,{kind:'rope',minutes:6,rounds:5,workSeconds:20,restSeconds:60,intensity:'Controlado'}]}}/>);
  fireEvent.change(screen.getByLabelText('Preparar una actividad del plan'),{target:{value:'1'}});
  expect((screen.getByLabelText('Actividad') as HTMLSelectElement).value).toBe('rope');
  expect(input('Intervalos').value).toBe('5');
  fireEvent.click(screen.getByRole('button',{name:'Registrar actividad'}));
  expect(store.list('cardio_logs')).toHaveLength(1);
  expect(store.list('cardio_logs')[0].data.kind).toBe('rope');
 });
});

const circuit:ConditioningPrescription={format:'circuit',rounds:3,workSeconds:20,restSeconds:20,durationMinutes:6,exerciseIds:['bench-press','lat-pulldown'],targetReps:10,intensity:'Moderado',instruction:'Alterna estaciones con técnica controlada.'};
const circuitPlan={title:'Fuerza en circuito',type:'strength',exerciseIds:circuit.exerciseIds,conditioning:circuit};
describe('Circuito con temporizador persistente y un único registro',()=>{
 it('pausa, recupera el tiempo tras reabrir y guarda vueltas/minutos sin crear series duplicadas',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-12T14:00:00-04:00'));
  const store=new FitStore('circuit-user');const view=render(<ConditioningBlock store={store} date={date} plan={circuitPlan} catalog={exercises}/>);
  fireEvent.click(screen.getByRole('button',{name:'Comenzar bloque'}));
  act(()=>vi.advanceTimersByTime(125000));
  fireEvent.click(screen.getByRole('button',{name:'Pausar bloque'}));
  expect(store.list('workout_sessions')[0].data.conditioningState.accumulatedSeconds).toBe(125);
  expect(store.list('workout_sets')).toHaveLength(0);
  expect(store.list('cardio_logs')).toHaveLength(0);
  view.unmount();
  const restored=new FitStore('circuit-user');
  render(<ConditioningBlock store={restored} date="2026-11-13" plan={circuitPlan} catalog={exercises} session={restored.list('workout_sessions')[0]}/>);
  expect(screen.getByText('02:05')).toBeTruthy();
  fireEvent.change(input('Vueltas completas realizadas'),{target:{value:'2'}});
  fireEvent.change(input('Minutos reales (opcional con temporizador)'),{target:{value:'3.5'}});
  fireEvent.change(input('RPE del bloque (1–10, opcional)'),{target:{value:'7'}});
  fireEvent.click(screen.getByRole('button',{name:'Finalizar y registrar bloque'}));
  expect(restored.list('cardio_logs')).toHaveLength(1);
  expect(restored.list('cardio_logs')[0]).toMatchObject({local_date:date,data:{kind:'circuit',conditioning:true,rounds:2,minutes:3.5,rpe:7}});
  fireEvent.click(screen.getByRole('button',{name:'Actualizar bloque realizado'}));
  expect(restored.list('cardio_logs')).toHaveLength(1);
  expect(restored.list('workout_sets')).toHaveLength(0);
 });
 it('EMOM usa el resto del minuto como descanso y permite registrar un bloque parcial',()=>{
  const store=new FitStore('emom-user');render(<ConditioningBlock store={store} date={date} plan={{...circuitPlan,conditioning:{...circuit,format:'emom',workSeconds:35,restSeconds:25}}} catalog={exercises}/>);
  fireEvent.change(input('Vueltas completas realizadas'),{target:{value:'0'}});
  fireEvent.change(input('Minutos reales (opcional con temporizador)'),{target:{value:'2'}});
  fireEvent.click(screen.getByRole('button',{name:'Finalizar y registrar bloque'}));
  expect(store.list('cardio_logs')[0].data).toMatchObject({kind:'emom',minutes:2,rounds:0,restSeconds:25});
 });
});
