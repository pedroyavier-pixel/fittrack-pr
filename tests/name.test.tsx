// @vitest-environment jsdom
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {NamePrompt} from '../src/components/NamePrompt';
import {FitStore} from '../src/lib/store';
import {applyGuide,initialAnswers} from '../src/lib/personalization';
vi.mock('../src/lib/client',()=>({supabase:{}}));
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});});
afterEach(cleanup);
it('reemplaza Atleta por el nombre elegido y lo recupera sin modificar planes ni registros',()=>{
 const s=new FitStore('name-owner');s.save('user_profiles',{name:'Atleta',unit:'kg'});s.save('food_logs',{amount:185},{local_date:'2026-11-12'});
 const before=JSON.stringify(s.list('food_logs'));
 const view=render(<NamePrompt store={s}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'  María José  '}});
 fireEvent.submit(screen.getByRole('button',{name:'Guardar mi nombre'}).closest('form')!);
 const restored=new FitStore('name-owner');expect(restored.list('user_profiles')[0].data).toMatchObject({name:'María José',unit:'kg'});expect(JSON.stringify(restored.list('food_logs'))).toBe(before);
 view.rerender(<NamePrompt store={restored}/>);expect(screen.queryByRole('textbox')).toBeNull();
});
it('no borra un nombre existente al reaplicar respuestas anteriores sin nombre',()=>{
 const s=new FitStore('existing-name');s.save('user_profiles',{name:'Pedro'});
 applyGuide(s,{...initialAnswers,age:'under18',professionalSupport:'no',consent:true});
 expect(s.list('user_profiles')[0].data.name).toBe('Pedro');
});
