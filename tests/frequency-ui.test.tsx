// @vitest-environment jsdom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {FrequencyAdvice} from '../src/components/FrequencyAdvice';
import {Onboarding} from '../src/components/Onboarding';
import {FitStore} from '../src/lib/store';
import {applyGuide,initialAnswers,type GuideAnswers} from '../src/lib/personalization';
vi.mock('../src/lib/client',()=>({supabase:{}}));
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.scrollTo=vi.fn();});
afterEach(cleanup);
it('distingue disponibilidad y orientación sin modificar el calendario',()=>{
 render(<FrequencyAdvice advice={{availableDays:3,recommendedDays:4,minDays:3,maxDays:5,reason:'Separar fuerza, base aeróbica y técnica.',adaptation:'En tus tres días combinamos bloques para conservar recuperación.',extraDayFocus:['Añadir base aeróbica cómoda.'],suggestedDays:[1,2,4,6],canExpand:true}}/>);
 expect(screen.getByText('3 días / semana')).toBeTruthy();expect(screen.getByText('4 días / semana')).toBeTruthy();expect(screen.getByText(/calendario utiliza únicamente/)).toBeTruthy();
 expect(screen.queryByRole('button')).toBeNull();
});
it('permite revisar un programa mejorado con respuestas guardadas sin aplicarlo antes de confirmar',()=>{
 const store=new FitStore('review-design');
 const a:GuideAnswers={...initialAnswers,version:2,sex:'male',allergyReviewed:true,age:'30-49',activity:'sedentary',experience:'regular',goal:'recomp',equipment:'gym',trainingStyle:'cross_training',cardioChoices:['walk','row'],impactTolerance:'any',cardioAccess:true,days:[1,3,5],minutes:45,professionalSupport:'no',dietaryCare:'no',consent:true};
 applyGuide(store,a);
 const before=JSON.stringify(store.list('workout_plans'));
 const onDone=vi.fn();
 render(<Onboarding store={store} onDone={onDone} reviewSaved/>);
 expect(screen.getByRole('heading',{name:'Tu guía, antes de guardarla.'})).toBeTruthy();
 expect(screen.getByRole('region',{name:'Frecuencia y adaptación de tu programa'})).toBeTruthy();
 expect(JSON.stringify(store.list('workout_plans'))).toBe(before);
 fireEvent.click(screen.getByRole('button',{name:'Guardar y usar esta guía'}));
 expect(onDone).toHaveBeenCalledOnce();
 expect(store.list('user_profiles')[0].data.guideDesignVersion).toBe(3);
});
