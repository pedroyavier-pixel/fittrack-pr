import type {TrainingStyle} from '../data/conditioning';

/** Editorial planning rules; these are adjustable ranges, not a clinical prescription. */
export interface FrequencyRecommendation {
  availableDays:number;
  recommendedDays:number;
  minDays:number;
  maxDays:number;
  reason:string;
  adaptation:string;
  extraDayFocus:string[];
  suggestedDays:number[];
  canExpand:boolean;
}
export interface DesignInput {
  days:number[]; minutes:number; experience:string; goal:string; equipment:string;
  activity:string; trainingStyle?:TrainingStyle['id']; cardioChoices?:string[];
}
export const mondayOrder=(day:number)=>(day+6)%7;
const ordered=(days:number[])=>[...days].sort((a,b)=>mondayOrder(a)-mondayOrder(b));

/** Seven weekdays permit exhaustive subsets; avoid greedy Monday/Tuesday picks. */
export function spacedDays(pool:number[],count:number,required:number[]=[]):number[]{
  const sorted=ordered([...new Set(pool)]),limit=Math.min(count,sorted.length);
  let best:number[]=[];let bestScore=Infinity;
  const visit=(index:number,current:number[])=>{
    if(current.length===limit){
      if(required.some(day=>!current.includes(day)))return;
      const gaps=current.map((day,i)=>(current[(i+1)%current.length]-day+7)%7||7);
      const adjacent=gaps.filter(gap=>gap===1).length;
      const variance=gaps.reduce((sum,gap)=>sum+(gap-7/current.length)**2,0);
      const score=adjacent*1000+variance;
      if(score<bestScore){bestScore=score;best=[...current];}
      return;
    }
    for(let i=index;i<sorted.length;i++)visit(i+1,[...current,sorted[i]]);
  };
  if(limit)visit(0,[]);
  return best;
}

export function recommendFrequency(a:DesignInput):FrequencyRecommendation{
  const regular=a.experience==='regular',beginning=a.experience==='new';
  const style=a.trainingStyle||'classic',endurance=style==='endurance'||a.goal==='endurance';
  const variety=new Set(a.cardioChoices||[]).size;
  let minDays=2,maxDays=3,target=2,reason='';
  if(!regular){
    target=beginning||a.activity==='physical'?2:3;
    if(endurance&&!beginning&&a.activity!=='physical')target=3;
    reason=beginning?'Comenzar con dos sesiones principales facilita aprender los movimientos y observar la recuperación. Una tercera sesión suave puede añadirse cuando el hábito sea estable.':'Al retomar, dos o tres sesiones principales permiten recuperar constancia sin concentrar demasiado esfuerzo en cada día.';
    if(a.activity==='physical')reason+=' Tu trabajo físico añade fatiga; esta pauta inicial es conservadora y se puede revisar.';
  }else if(a.goal==='health'){
    target=3;reason='Para salud general, tres sesiones variadas reparten fuerza y actividad aeróbica sin exigir entrenar todos los días disponibles.';
  }else if(endurance&&!['cross_training','circuit','crossfit'].includes(style)){
    minDays=3;maxDays=5;target=a.minutes<=30?5:4;
    reason=target===5?'Cinco bloques cortos permitirían separar dos exposiciones de fuerza y tres aeróbicas de distinto esfuerzo, en lugar de acumular todo en sesiones muy breves.':'Cuatro sesiones permiten combinar dos exposiciones de fuerza con trabajo aeróbico de base y una sesión de mayor duración, según recuperación.';
  }else if(style==='cross_training'){
    minDays=3;maxDays=5;
    target=a.minutes<=30&&(variety>=3||a.goal==='endurance'&&variety>=2)&&a.activity!=='physical'?5:a.minutes<=30||variety>=2?4:3;
    reason=target===5?'Con experiencia, sesiones cortas y varias modalidades, cinco bloques podrían separar dos sesiones de fuerza, un circuito técnico y dos momentos aeróbicos o de recuperación. No serían cinco sesiones intensas.':target===4?'Cuatro sesiones permitirían separar dos bloques de fuerza, un circuito técnico y una base aeróbica, conservando recuperación.':'Tres sesiones distintas cubren fuerza de base, circuito técnico y actividad aeróbica; el entrenamiento cruzado no exige cinco días.';
  }else if(style==='crossfit'){
    minDays=3;maxDays=5;target=a.minutes<=30||variety>=2?4:3;
    reason='Tres o cuatro sesiones escaladas permiten alternar práctica de movimientos, EMOM controlado, circuitos y base aeróbica. Una frecuencia mayor se revisa con el entrenador y la recuperación.';
  }else if(style==='circuit'){
    minDays=2;maxDays=4;target=a.minutes<=30&&variety>=2?4:3;
    reason='Dos o tres circuitos con patrones alternados y una sesión aeróbica opcional permiten variar el estímulo. Más días sirven para distribuir el trabajo, no para repetir el mismo circuito completo.';
  }else{
    minDays=3;maxDays=4;target=a.minutes>=30?4:3;
    reason='Con experiencia y una meta de fuerza o músculo, tres sesiones completas o cuatro de tren superior/inferior permiten repetir los patrones y registrar progreso con recuperación.';
  }
  if(regular&&a.activity==='physical'&&target>3){target=3;minDays=Math.min(minDays,3);maxDays=Math.min(maxDays,4);reason='Tu trabajo físico suma demanda de recuperación. Una orientación inicial de tres sesiones principales permite alternar estímulos; una cuarta se puede valorar según cansancio y recuperación, sin recortar tu experiencia ni imponer un mínimo universal.';}
  if(a.equipment==='walking')reason+=' El entorno de solo cardio mantiene esa elección; para cubrir fuerza haría falta incorporar resistencia apropiada.';
  const availableDays=a.days.length;
  const suggestedDays=target>availableDays?spacedDays([1,2,3,4,5,6,0],target,a.days):spacedDays(a.days,target);
  const adaptation=target>availableDays
    ?`Tu plan usa únicamente tus ${availableDays} días actuales y conserva sus límites de tiempo. Los ${target} días son una orientación para repartir bloques si más adelante amplías tu agenda; no se añaden automáticamente ni se exige compensar con mayor intensidad.`
    :availableDays>target
      ?`De tus ${availableDays} días disponibles, ${target} se proponen como sesiones principales. Los demás quedan como recuperación o movimiento opcional, sin obligación de completarlos.`
      :`La distribución propuesta cabe en tus ${availableDays} días actuales. Revisa esta frecuencia según adherencia, cansancio y recuperación; no es un mínimo obligatorio universal.`;
  const extraDayFocus=endurance?['Base aeróbica cómoda','Intervalos controlados solo con experiencia y buena recuperación','Sesión aeróbica algo más larga, dentro del tiempo elegido']
    :style==='cross_training'||style==='crossfit'?['Separar fuerza y circuito técnico','Añadir otra modalidad a ritmo cómodo','Conservar un día de recuperación entre bloques exigentes']
      :['Recuperación o movilidad opcional','Actividad aeróbica cómoda','Distribuir el volumen de fuerza existente'];
  return {availableDays,recommendedDays:target,minDays,maxDays,reason,adaptation,extraDayFocus,suggestedDays,canExpand:target>availableDays};
}

type Variant='A'|'B'|'C'|'upperA'|'lowerA'|'upperB'|'lowerB';
export interface DayDesign {
  mode:'strength'|'conditioning'|'cardio'|'recovery'; variant:Variant;
  format?:'circuit'|'emom'; aerobic:'easy'|'base'|'intervals'|'long';
  focus:string; rationale:string; effort:string; optional?:boolean;
}
const strength=(variant:Variant,focus:string,rationale:string,aerobic:DayDesign['aerobic']='easy'):DayDesign=>({mode:'strength',variant,aerobic,focus,rationale,effort:'Series controladas con unas 2–3 repeticiones en reserva; descanso suficiente para conservar la técnica.'});
const aerobic=(kind:DayDesign['aerobic'],focus:string,regular:boolean):DayDesign=>({mode:'cardio',variant:'A',aerobic:regular?kind:'easy',focus,rationale:kind==='intervals'&&regular?'Alternar tramos moderados y recuperación cambia el estímulo sin requerir sprints ni esfuerzo máximo.':kind==='long'&&regular?'Una sesión algo más sostenida desarrolla la base aeróbica sin superar el tiempo disponible.':'Practicar un ritmo cómodo y constante ayuda a sostener el hábito y recuperarte.',effort:kind==='intervals'&&regular?'Tramos moderados alrededor de RPE 5–6, alternados con recuperación cómoda.':'Ritmo fácil a moderado que permita conversar; reduce duración si lo necesitas.'});
const circuit=(variant:Variant,format:'circuit'|'emom',focus:string):DayDesign=>({mode:'conditioning',variant,format,aerobic:'easy',focus,rationale:'Alterna patrones y conserva pausas. Estas estaciones sustituyen las series tradicionales de este día; no se suma una segunda rutina para los mismos movimientos.',effort:'Técnica estable y esfuerzo controlado; completa menos repeticiones si necesitas más descanso.'});

export function designDays(a:DesignInput,primaryDays:number[]):Map<number,DayDesign>{
  const style=a.trainingStyle||'classic',regular=a.experience==='regular';
  const count=primaryDays.length,endurance=style==='endurance'||a.goal==='endurance';
  let sequence:DayDesign[];
  if(a.equipment==='walking'){
    sequence=regular?[aerobic('base','Base aeróbica cómoda',true),aerobic('intervals','Cambios de ritmo controlados',true),aerobic('long','Base aeróbica más sostenida',true),aerobic('easy','Otra modalidad a ritmo fácil',true),aerobic('base','Consolidar la base sin intensidad extra',true)]
      :[aerobic('easy','Empezar a ritmo cómodo',false),aerobic('easy','Consolidar el ritmo y la técnica',false),aerobic('easy','Continuidad sin exigencia extra',false)];
  }else if(style==='cross_training'){
    sequence=[strength('A','Fuerza A · fundamentos','Prioriza rodilla, empuje y tirón. Conserva estas referencias en semanas sucesivas para comparar tus series.'),circuit('B','circuit','Circuito B · control y coordinación'),aerobic('base','Base aeróbica · ritmo sostenible',regular),strength('B','Fuerza B · cadera y equilibrio','Complementa la primera sesión con otra selección estable de movimientos y observa la recuperación.'),aerobic('easy','Otra modalidad · recuperación aeróbica',regular)];
  }else if(style==='crossfit'){
    sequence=[circuit('A',regular?'emom':'circuit','Bloque A · técnica y ritmo'),circuit('B','circuit','Bloque B · patrones complementarios'),...(count===3?[circuit('C',regular?'emom':'circuit','Bloque C · control unilateral')]:[aerobic('base','Base aeróbica · recuperación entre bloques',regular),circuit('C',regular?'emom':'circuit','Bloque C · control unilateral'),aerobic('easy','Práctica aeróbica suave',regular)])];
  }else if(style==='circuit'){
    sequence=[circuit('A','circuit','Circuito A · rodilla, empuje y tirón'),circuit('B','circuit','Circuito B · cadera y estabilidad'),...(count===3?[circuit('C','circuit','Circuito C · patrones alternados')]:[aerobic('base','Base aeróbica · descanso de la resistencia',regular),circuit('C','circuit','Circuito C · patrones alternados')])];
  }else if(endurance){
    sequence=count<=3?[strength('A','Fuerza A + cardio cómodo','La fuerza complementa la resistencia con movimientos básicos, sin agotar la sesión.'),aerobic(regular?'intervals':'base',regular?'Intervalos controlados':'Base aeróbica cómoda',regular),strength('B','Fuerza B + base sostenida','Complementa la rodilla y el empuje del primer día con cadera y tirón, manteniendo margen.',regular?'long':'easy')]
      :[strength('A','Fuerza A · apoyo a la resistencia','Mantén fuerza de los grandes grupos sin buscar fatiga máxima.'),aerobic(regular?'intervals':'base',regular?'Intervalos controlados':'Base aeróbica cómoda',regular),strength('B','Fuerza B · patrones complementarios','Otra selección estable complementa el trabajo de fuerza de la semana.'),aerobic(regular?'long':'base',regular?'Base aeróbica más sostenida':'Continuidad a ritmo cómodo',regular),aerobic('easy','Recuperación aeróbica · esfuerzo fácil',regular)];
    if(count===2)sequence=[sequence[0],strength('B','Fuerza B + cardio cómodo','La agenda se adapta a dos sesiones; no se intenta compensar con esfuerzos máximos.')];
  }else if(count>=4&&['gym','hybrid'].includes(a.equipment)&&style==='classic'){
    sequence=[strength('upperA','Tren superior A · empuje horizontal y tirón','Mantén los ejercicios principales para comparar carga, repeticiones y técnica.'),strength('lowerA','Tren inferior A · rodilla y cadera','Combina un movimiento dominante de rodilla y una bisagra, con descansos incluidos.'),strength('upperB','Tren superior B · otro ángulo y control escapular','Complementa el primer día de torso con ángulos y agarres diferentes.'),strength('lowerB','Tren inferior B · cadera y trabajo unilateral','Complementa el primer día de piernas sin repetir su selección completa.')];
  }else{
    sequence=[strength('A',style==='mixed'?'Mixto A · fuerza de rodilla + cardio':'Fuerza A · rodilla, empuje y tirón','Conserva estos ejercicios principales varias semanas para poder evaluar tu progreso.'),strength('B',style==='mixed'?'Mixto B · cadera + cardio':'Fuerza B · cadera y otro ángulo','Cambia los patrones prioritarios y los ejercicios, manteniendo trabajo de empuje y tirón.'),strength('C',style==='mixed'?'Mixto C · control + base aeróbica':'Fuerza C · unilateral y estabilidad','Complementa las sesiones A y B con una selección estable, sin cambiar ejercicios al azar.',style==='mixed'&&regular?'base':'easy'),aerobic('base','Base aeróbica · apoyo a la fuerza',regular)];
  }
  const result=new Map<number,DayDesign>();
  ordered(primaryDays).forEach((day,index)=>result.set(day,sequence[index]||aerobic('easy','Recuperación aeróbica opcional',regular)));
  for(const day of a.days)if(!result.has(day))result.set(day,{...aerobic('easy','Recuperación opcional',false),mode:'recovery',optional:true,rationale:'Este día está disponible, pero no se añade otra sesión exigente. Puedes descansar o hacer movimiento suave si te apetece.'});
  return result;
}

/** Stable A/B/C patterns; variety is between days, never randomly between weeks. */
export function strengthCandidates(a:DesignInput,variant:Variant):string[]{
  const regular=a.experience==='regular',push=regular?'push-ups':'wall-push-up';
  const loaded=regular&&a.goal==='strength';
  const knee=loaded?'hack-squat':'leg-press',hinge=loaded?'romanian-deadlift':'dumbbell-rdl';
  const horizontal=loaded?'bench-press':'incline-dumbbell-press';
  const gym:Record<Variant,string[]>={
    A:[knee,horizontal,'seated-cable-row',hinge,'cable-crunch','standing-calf-raises'],
    B:[hinge,'lat-pulldown','machine-shoulder-press','leg-press','pallof-press','seated-leg-curl'],
    C:['goblet-squat','flat-dumbbell-press','chest-supported-row','hip-thrust','leg-extension','rear-delt-fly'],
    upperA:[horizontal,'seated-cable-row','lat-pulldown','lateral-raises','rope-triceps-pushdown','dumbbell-biceps-curl'],
    lowerA:[knee,hinge,'seated-leg-curl','standing-calf-raises','cable-crunch','glute-bridge'],
    upperB:['machine-shoulder-press','chest-supported-row','flat-dumbbell-press','neutral-grip-lat-pulldown','rear-delt-fly','hammer-curl'],
    lowerB:['hip-thrust','goblet-split-squat','lying-leg-curl','leg-extension','seated-calf-raises','pallof-press'],
  };
  const hybrid:Record<Variant,string[]>={
    A:['chair-squat',push,'lat-pulldown','dumbbell-rdl','cable-crunch','seated-cable-row'],
    B:['glute-bridge','dumbbell-row','incline-dumbbell-press',regular?'bodyweight-reverse-lunge':'chair-squat','pallof-press','lateral-raises'],
    C:[regular?'bodyweight-reverse-lunge':'chair-squat','machine-shoulder-press','chest-supported-row','hip-thrust',push,'standing-calf-raises'],
    upperA:[push,'lat-pulldown','incline-dumbbell-press','seated-cable-row','lateral-raises'],
    lowerA:['chair-squat','dumbbell-rdl','seated-leg-curl','standing-calf-raises','cable-crunch'],
    upperB:['machine-shoulder-press','dumbbell-row',push,'neutral-grip-lat-pulldown','rear-delt-fly'],
    lowerB:['glute-bridge','goblet-split-squat','lying-leg-curl','leg-extension','seated-calf-raises'],
  };
  const home:Record<'A'|'B'|'C',string[]>={
    A:['chair-squat',push,'dumbbell-row','dumbbell-rdl','lateral-raises','hammer-curl'],
    B:['dumbbell-rdl','dumbbell-row','wall-push-up',regular?'goblet-squat':'chair-squat','glute-bridge','dumbbell-biceps-curl'],
    C:[regular?'goblet-split-squat':'chair-squat','dumbbell-row',push,'glute-bridge','hammer-curl','lateral-raises'],
  };
  const body:Record<'A'|'B'|'C',string[]>={
    A:['chair-squat',push,'glute-bridge'],
    B:[regular?'bodyweight-reverse-lunge':'chair-squat','wall-push-up',regular?'single-leg-glute-bridge':'glute-bridge'],
    C:['glute-bridge',push,regular?'bodyweight-reverse-lunge':'chair-squat'],
  };
  const simple=variant==='B'||variant==='upperB'||variant==='lowerB'?'B':variant==='C'?'C':'A';
  return a.equipment==='gym'?gym[variant]:a.equipment==='hybrid'?hybrid[variant]:a.equipment==='dumbbells'?home[simple]:body[simple];
}
