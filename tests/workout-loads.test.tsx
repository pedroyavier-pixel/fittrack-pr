// @vitest-environment jsdom
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {Workout} from '../src/components/Workout';
import {FitStore} from '../src/lib/store';
vi.mock('../src/lib/client',()=>({supabase:{}}));
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});});
afterEach(cleanup);
it('no asigna carga inicial y guarda discos por lado más barra real; recupera la serie',()=>{
 const store=new FitStore('manual-load-qa');
 const view=render(<Workout store={store} date="2026-11-09" unit="lb"/>);
 fireEvent.click(screen.getByRole('button',{name:/Comenzar entrenamiento/}));
 const load=screen.getByRole('spinbutton',{name:'Bench Press serie 1 peso lb'}) as HTMLInputElement;
 expect(load.value).toBe('');expect(screen.queryByText(/SUGERIDO/)).toBeNull();
 fireEvent.change(load,{target:{value:'25'}});
 fireEvent.change(screen.getAllByRole('spinbutton',{name:/Peso real de barra/})[0],{target:{value:'35'}});
 fireEvent.change(screen.getByRole('spinbutton',{name:'Bench Press serie 1 repeticiones'}),{target:{value:'8'}});
 fireEvent.click(screen.getByRole('button',{name:'Completar serie 1 de Bench Press'}));
 expect(store.list('workout_sets')[0].data).toMatchObject({weightLb:85,enteredWeightLb:25,barWeightLb:35,loadBasis:'bar_sides',reps:8});
 view.unmount();
 render(<Workout store={new FitStore('manual-load-qa')} date="2026-11-09" unit="lb"/>);
 expect((screen.getByRole('spinbutton',{name:'Bench Press serie 1 peso lb'}) as HTMLInputElement).value).toBe('25');
});
