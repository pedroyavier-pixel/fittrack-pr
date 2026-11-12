import { useState, type FormEvent } from "react";
import { Bookmark, ChefHat, Check, MessageCircle, Plus, Send, SlidersHorizontal } from "lucide-react";
import { FitStore, seedId } from "../lib/store";
import { foodLibrary } from "../lib/model";
import { foods, type MealItem } from "../data/nutrition";
import {
  allergenOptions, restrictionOptions, createFoodFilter, foodSubstitutes,
  mealSuggestionGuidance, type MealPreference, type NutritionFilter,
} from "../data/mealSuggestions";
import {
  findPuertoRicanRecipes, ingredientIdsInText, normalizedRecipeText, queryFilter,
  recipeNutrients, substituteRecipeIngredient, type PuertoRicanRecipe, type RecipeMatch,
} from "../data/puertoRicanRecipes";

const stringList = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
export function nutritionFilterFor(store: FitStore): NutritionFilter {
  const profile=store.list("user_profiles")[0]?.data || {};
  const source=profile.personalization || profile.nutritionPreferences || {};
  return {
    preference:source.preference || "omnivore", excluded:stringList(source.excluded),
    dietaryRestrictions:stringList(source.dietaryRestrictions),
    favoriteIngredients:[...new Set([...stringList(source.favoriteIngredients),...stringList(profile.favorites)])],
  };
}
export function safeNutritionFilterFor(store: FitStore) {
  try { return createFoodFilter(nutritionFilterFor(store)); }
  catch { return () => false; }
}

function Preferences({store,onSaved}:{store:FitStore;onSaved:()=>void}) {
  const saved=nutritionFilterFor(store);
  const [preference,setPreference]=useState<MealPreference>(saved.preference || "omnivore");
  const [excluded,setExcluded]=useState<string[]>([...(saved.excluded || [])]);
  const [restrictions,setRestrictions]=useState<string[]>([...(saved.dietaryRestrictions || [])]);
  const [favorites,setFavorites]=useState<string[]>([...(saved.favoriteIngredients || [])]);
  const [message,setMessage]=useState("");
  const toggle=(values:string[],value:string)=>values.includes(value)?values.filter(entry=>entry!==value):[...values,value];
  function save(e:FormEvent) {
    e.preventDefault();
    try {
      const next={preference,excluded,dietaryRestrictions:restrictions,favoriteIngredients:favorites};
      createFoodFilter(next);
      const row=store.list("user_profiles")[0];
      const data=row?.data || {};
      store.save("user_profiles",{...data,...(data.personalization ? {personalization:{...data.personalization,...next}} : {nutritionPreferences:next}),favorites}, {id:row?.id || seedId(store.userId,"profile")});
      setMessage("Preferencias guardadas. Las sugerencias se filtran desde ahora; tus consumos anteriores se conservan.");
      onSaved();
    } catch(error) {setMessage(error instanceof Error?error.message:"No se pudieron guardar tus preferencias.");}
  }
  return <details className="card"><summary className="row"><SlidersHorizontal size={18}/><strong>Preferencias, alergias e ingredientes favoritos</strong></summary>
    <form className="stack" onSubmit={save}>
      <p className="muted small">Estos filtros omiten ingredientes del catálogo. No certifican productos ni contacto cruzado. Para alergias o necesidades clínicas, revisa etiquetas y adapta con un profesional. No se calculan dietas terapéuticas ni sodio.</p>
      <label className="field">Forma de alimentarte<select value={preference} onChange={e=>setPreference(e.target.value as MealPreference)}>
        <option value="omnivore">Variada / omnívora</option><option value="vegetarian">Vegetariana con huevo y lácteos</option><option value="plant">Solo vegetal</option>
      </select></label>
      <fieldset><legend>Ingredientes a excluir por alergia o preferencia</legend><div className="grid2">{allergenOptions.map(option=><label className="row" key={option.id}><input type="checkbox" checked={excluded.includes(option.id)} onChange={()=>setExcluded(toggle(excluded,option.id))}/>{option.label}</label>)}</div></fieldset>
      <fieldset><legend>Intolerancias y restricciones</legend><div className="grid2">{restrictionOptions.map(option=><label className="row" key={option.id}><input type="checkbox" checked={restrictions.includes(option.id)} onChange={()=>setRestrictions(toggle(restrictions,option.id))}/>{option.label}</label>)}</div></fieldset>
      <p className="muted small">Evitar lactosa elimina leche, yogur y mantequilla genéricos. Este catálogo no presume que una marca sea libre de lactosa. La avena se omite al excluir gluten. Soya, ajonjolí, mariscos y maní no tienen ingredientes propios en el catálogo inicial; revisa los productos reales.</p>
      <fieldset><legend>Ingredientes favoritos para priorizar ideas</legend><div className="grid2">{foods.map(food=><label className="row" key={food.id}><input type="checkbox" checked={favorites.includes(food.id)} onChange={()=>setFavorites(toggle(favorites,food.id))}/>{food.name}</label>)}</div></fieldset>
      <button className="btn primary" type="submit">Guardar preferencias</button>
      {message&&<p className="notice" role="status">{message}</p>}
    </form>
  </details>;
}

function combinedFilter(current:NutritionFilter, earlier:NutritionFilter = {}): NutritionFilter {
  const preference = current.preference === "plant" || earlier.preference === "plant" ? "plant" : current.preference === "vegetarian" || earlier.preference === "vegetarian" ? "vegetarian" : "omnivore";
  return {...earlier,...current,preference,
    excluded:[...new Set([...(current.excluded||[]),...(earlier.excluded||[])])],
    dietaryRestrictions:[...new Set([...(current.dietaryRestrictions||[]),...(earlier.dietaryRestrictions||[])])],
    avoidedIngredients:[...new Set([...(current.avoidedIngredients||[]),...(earlier.avoidedIngredients||[])])],
  };
}
type LogRecipe = (recipe:PuertoRicanRecipe,date:string,batchId:string)=>void;
function RecipeCard({store,match,options,date,onLog,pantry}:{store:FitStore;match:RecipeMatch;options:NutritionFilter;date:string;onLog:LogRecipe;pantry:string[]}) {
  const [recipe,setRecipe]=useState<PuertoRicanRecipe>(match.recipe);
  const [recordDate,setRecordDate]=useState(date);
  const [meal,setMeal]=useState(recipe.meal);
  const [message,setMessage]=useState("");
  const [logged,setLogged]=useState(false);
  const [batchId]=useState(()=>crypto.randomUUID());
  const lib=foodLibrary(store);
  const allowed=createFoodFilter(options);
  const valid=recipe.items.length>0 && recipe.items.every(entry=>Number.isFinite(entry.amount)&&entry.amount>0&&entry.amount<=10000&&allowed(entry.foodId));
  const total=valid ? recipeNutrients(recipe.items,lib) : null;
  function changeAmount(index:number,amount:number) {setRecipe({...recipe,items:recipe.items.map((entry,i)=>i===index?{...entry,amount}:entry)});setMessage("");}
  function replace(foodId:string,replacement:string) {
    if(!replacement)return;
    try {setRecipe(substituteRecipeIngredient(recipe,foodId,replacement,options));setMessage("Ingrediente sustituido y nutrientes recalculados. Ajusta los gramos: no son equivalencias nutricionales.");}
    catch(error){setMessage(error instanceof Error?error.message:"No se pudo sustituir ese ingrediente.");}
  }
  function save() {
    if(!valid)return;
    try {
      const id=seedId(store.userId,`assistant-recipe:${recipe.id}:${JSON.stringify(recipe.items)}`);
      store.transaction(()=>{
        store.save("recipes",{name:recipe.name,items:recipe.items,instructions:recipe.steps,origin:"local-pr-assistant",sourceRecipe:recipe.id,adaptations:recipe.adaptations || []},{id});
        recipe.items.forEach((entry,position)=>store.save("recipe_ingredients",{...entry,position},{id:seedId(store.userId,`${id}:${position}`),recipe_id:id}));
      });
      setMessage("Receta guardada en Recetas y frecuentes.");
    }catch(error){setMessage(error instanceof Error?error.message:"No se pudo guardar la receta.");}
  }
  const missing=pantry.length?recipe.items.map(entry=>entry.foodId).filter(id=>!pantry.includes(id)):[];
  return <article className="card stack">
    <div className="section-title"><h3>{recipe.name}</h3><span className="badge">~{recipe.minutes} min</span></div>
    <p className="muted small">{recipe.description}</p>
    {!!missing.length&&<p className="notice">Te faltan según la despensa indicada: {missing.map(id=>lib.find(food=>food.id===id)?.name || id).join(", ")}. No se presupone que los tengas.</p>}
    <p className="muted small">Cantidades ilustrativas para una porción editable. Los ingredientes cocidos se pesan después de cocinar; cereales y féculas, en seco.</p>
    {recipe.items.map((entry,index)=>{
      const food=lib.find(value=>value.id===entry.foodId)!;
      const swaps=foodSubstitutes(entry.foodId,options);
      return <div className="food-row" key={`${index}:${entry.foodId}`}>
        <div className="food-name"><strong>{food.name}</strong><span>{food.state}</span><a className="source-link" href={food.source.startsWith("https://")?food.source:undefined} target="_blank" rel="noreferrer">{food.source.startsWith("https://")?"Fuente nutricional":"Etiqueta personal"}</a>
          {swaps.length>0&&<label className="field"><span>Sustituir {food.name}</span><select aria-label={`Sustituir ${food.name}`} value="" disabled={logged} onChange={e=>replace(entry.foodId,e.target.value)}><option value="">Elegir alternativa…</option>{swaps.map(swap=><option key={swap.id} value={swap.id}>{swap.name}</option>)}</select></label>}
        </div>
        <label className="field">{food.unit}<input aria-label={`Cantidad de receta ${food.name}`} type="number" min="0.1" max="10000" step="0.1" value={entry.amount} disabled={logged} onChange={e=>changeAmount(index,Number(e.target.value))}/></label>
      </div>;
    })}
    {recipe.adaptations?.map((note,index)=><p className="notice" key={index}>{note}</p>)}
    {total?<p><strong>{Math.round(total.kcal)} kcal</strong> · P {total.protein.toFixed(1)} g · C {total.carbs.toFixed(1)} g · G {total.fat.toFixed(1)} g</p>:<p className="notice">Revisa cantidades o filtros para calcular.</p>}
    <ol>{recipe.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
    <div className="grid2"><label className="field">Registrar en<select aria-label={`Momento para ${recipe.id}`} value={meal} disabled={logged} onChange={e=>setMeal(e.target.value as PuertoRicanRecipe["meal"])}>{["Desayuno","Almuerzo","Merienda","Cena"].map(value=><option key={value}>{value}</option>)}</select></label>
      <label className="field">Fecha de consumo<input aria-label={`Fecha para ${recipe.id}`} type="date" required value={recordDate} disabled={logged} onChange={e=>setRecordDate(e.target.value)}/></label></div>
    {recordDate!==date&&<p className="notice">Se guardará en {recordDate}, la fecha indicada arriba.</p>}
    <div className="row"><button className="btn ghost" onClick={save} disabled={!valid}><Bookmark size={16}/>Guardar receta</button>
      <button className="btn primary" disabled={!valid||logged||!/^\d{4}-\d{2}-\d{2}$/.test(recordDate)} onClick={()=>{try{onLog({...recipe,meal},recordDate,batchId);setLogged(true);setMessage("Ingredientes registrados una vez en la fecha elegida.");}catch(error){setMessage(error instanceof Error?error.message:"No se pudieron registrar los ingredientes.");}}}>{logged?<Check size={16}/>:<Plus size={16}/>} {logged?"Registrado":"Consumí esta porción"}</button></div>
    {message&&<p className="notice" role="status">{message}</p>}
  </article>;
}

type ConversationMessage={id:string;role:"user"|"assistant";text:string;matches?:RecipeMatch[];options?:NutritionFilter};
export function RecipeAssistant({store,date,onLog,onPreferencesSaved}:{store:FitStore;date:string;onLog:LogRecipe;onPreferencesSaved?:()=>void}) {
  const profile=store.list("user_profiles")[0]?.data || {};
  const [pantry,setPantry]=useState<string[]>(stringList(profile.recipePantry));
  const [input,setInput]=useState("");
  const [version,setVersion]=useState(0);
  const [messages,setMessages]=useState<ConversationMessage[]>([{id:"welcome",role:"assistant",text:"Soy un asistente local de recetas por reglas. Puedo buscar ideas del catálogo, reconocer ingredientes y ofrecer sustituciones. No utilizo un modelo de IA ni evalúo necesidades clínicas. Escribe «Tengo arroz, pollo y tomate» o «Cena vegetal sin leche»."}]);
  const options=nutritionFilterFor(store);
  let filterError="";
  let allowed:(id:string)=>boolean;
  try{allowed=createFoodFilter(options);}catch(error){filterError=error instanceof Error?error.message:"Revisa tus preferencias.";allowed=()=>false;}
  const lib=foodLibrary(store);
  const availableFoods=foods.filter(food=>allowed(food.id));
  const professionalReview=profile.guideBlocked===true || profile.personalization?.dietaryCare==="yes";
  function savePantry(values:string[]) {
    setPantry(values);
    const row=store.list("user_profiles")[0];
    store.save("user_profiles",{...row?.data,recipePantry:values},{id:row?.id||seedId(store.userId,"profile")});
  }
  function answer(request:string) {
    const userMessage:ConversationMessage={id:crypto.randomUUID(),role:"user",text:request};
    const response:ConversationMessage={id:crypto.randomUUID(),role:"assistant",text:""};
    try {
      const requestedOptions=queryFilter(request,options);
      const allowedRequest=createFoodFilter(requestedOptions);
      const normalized=normalizedRecipeText(request);
      if(/alerg|anafilax|renal|diabet|embaraz|trastorno aliment|hipertens/.test(normalized)) {
        response.text="No puedo evaluar esa condición ni crear una dieta terapéutica. Configura las exclusiones conocidas en el panel y revisa etiquetas y preparaciones con un profesional. Puedo ayudarte después a organizar ingredientes que tú hayas validado.";
      } else if(/sustit|reemplaz|cambiar|en vez/.test(normalized)) {
        const ids=ingredientIdsInText(request);
        const target=ids[0];
        const swaps=target?foodSubstitutes(target,requestedOptions):[];
        const last=messages.slice().reverse().find(message=>message.matches?.some(match=>match.recipe.items.some(entry=>entry.foodId===target)));
        const match=last?.matches?.find(candidate=>candidate.recipe.items.some(entry=>entry.foodId===target));
        if(target&&ids[1]&&match) {
          const recipe=substituteRecipeIngredient(match.recipe,target,ids[1],requestedOptions);
          response.matches=[{recipe,missingIds:pantry.length?recipe.items.map(entry=>entry.foodId).filter(id=>!pantry.includes(id)):[],availableCount:recipe.items.filter(entry=>pantry.includes(entry.foodId)).length,score:0}];
          response.options=requestedOptions;response.text="Aquí está la adaptación con nutrientes recalculados. Revisa cantidades y preparación: la sustitución no es una equivalencia nutricional.";
        } else response.text=target?(swaps.length?`Alternativas del catálogo para ${lib.find(food=>food.id===target)?.name}: ${swaps.map(food=>food.name).join(", ")}. Abre una receta y usa su selector «Sustituir» para recalcular. No son equivalencias de porción.`:"No tengo una alternativa compatible y verificada en este catálogo. Puedes añadir tu alimento con su etiqueta en Alimentos."):"Indica el ingrediente, por ejemplo: «Sustituir pollo». Solo reconozco los alimentos del catálogo.";
      } else {
        const mentioned=ingredientIdsInText(request).filter(allowedRequest);
        let nextPantry=normalized.includes("solo tengo")?mentioned:[...new Set([...pantry,...mentioned])];
        for(const match of normalized.matchAll(/no tengo\s+(.+?)(?=[,;.!?]|$)/g)) {
          const removed=ingredientIdsInText(match[1]);nextPantry=nextPantry.filter(id=>!removed.includes(id));
        }
        if(mentioned.length||normalized.includes("no tengo")) savePantry(nextPantry);
        const unknownPantryRequest=/\btengo\b/.test(normalized) && !normalized.includes("no tengo") && !mentioned.length;
        const matches=unknownPantryRequest ? [] : findPuertoRicanRecipes(requestedOptions,nextPantry,request).slice(0,3);
        response.options=requestedOptions;response.matches=matches;
        const ready=nextPantry.length?matches.filter(match=>!match.missingIds.length).length:0;
        response.text=unknownPantryRequest?"No reconocí un ingrediente disponible del catálogo. Selecciónalo en Mi despensa o añade el alimento y su etiqueta en Alimentos. No presupongo sustitutos ni nutrientes de alimentos desconocidos.":!matches.length?"No encontré una receta compatible con esos ingredientes y filtros. No voy a inventar alimentos o nutrientes. Amplía tu despensa o crea una receta propia con etiquetas verificadas.":nextPantry.length?`Encontré ${matches.length} ideas compatibles con tus filtros; ${ready} tienen todos los ingredientes que indicaste. Las demás muestran lo que falta. Puedes editar gramos, sustituir, guardar y registrar lo consumido.`:"Aquí tienes ideas compatibles del catálogo. Aún no has indicado qué tienes: verifica todos los ingredientes antes de prepararlas. Son ejemplos editables, no una dieta.";
      }
    }catch(error){response.text=error instanceof Error?error.message:"No se pudo buscar esa receta. Revisa los filtros.";}
    setMessages(current=>[...current,userMessage,response]);setInput("");
  }
  if(professionalReview) return <div className="stack">
    <Preferences store={store} onSaved={()=>{setVersion(value=>value+1);onPreferencesSaved?.();}}/>
    <section className="card stack"><h3>Recetas pendientes de orientación</h3><p>Tu perfil indica que necesitas revisar la alimentación o la actividad con un profesional. El asistente no genera recetas ni sustituciones automáticas en este caso. Puedes registrar tus alimentos y guardar las recetas que tú y tu profesional hayan validado en Recetas y frecuentes.</p>
    <p className="muted small">Los filtros guardados son herramientas para organizar ingredientes; no evalúan tu condición ni sustituyen esa orientación.</p>
    {mealSuggestionGuidance.sources.map(source=><a className="source-link" href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title}</a>)}</section>
  </div>;
  return <div className="stack" key={version}>
    <div className="section-title"><h3><ChefHat size={20}/> Cocina de casa, a tu manera</h3><span className="badge">Local · por reglas</span></div>
    <p className="muted">Platos inspirados en Puerto Rico y adaptados al catálogo verificado. {mealSuggestionGuidance.description}</p>
    <Preferences key={`preferences:${version}`} store={store} onSaved={()=>{setVersion(value=>value+1);setMessages([{id:crypto.randomUUID(),role:"assistant",text:"Preferencias actualizadas. Limpié las sugerencias anteriores para volver a filtrar con tus elecciones. Indica tus ingredientes o pide nuevas ideas."}]);onPreferencesSaved?.();}}/>
    <details className="card"><summary><strong>Mi despensa · {pantry.filter(allowed).length} ingredientes indicados</strong></summary>
      <p className="muted small">Marca solo lo que tienes, incluido el aceite. No se presupone que dispongas de ingredientes ocultos. Las cantidades disponibles no se evalúan.</p>
      <div className="grid2">{availableFoods.map(food=><label className="row" key={food.id}><input type="checkbox" checked={pantry.includes(food.id)} onChange={()=>savePantry(pantry.includes(food.id)?pantry.filter(id=>id!==food.id):[...pantry,food.id])}/>{food.name}</label>)}</div>
      <button className="btn ghost" onClick={()=>savePantry([])}>Vaciar despensa indicada</button>
    </details>
    {filterError&&<p className="notice" role="alert">{filterError}</p>}
    <section className="stack" aria-label="Conversación de recetas" aria-live="polite">
      {messages.map(message=><div className="stack" key={message.id}><div className="card"><span className="eyebrow">{message.role==="user"?"TÚ":"ASISTENTE LOCAL"}</span><p>{message.text}</p></div>
        {!!message.matches?.length&&!filterError&&<div className="stack">{message.matches.filter(match=>match.recipe.items.every(entry=>createFoodFilter(combinedFilter(options,message.options))(entry.foodId))).map(match=><RecipeCard key={`${message.id}:${match.recipe.id}`} store={store} match={match} options={combinedFilter(options,message.options)} date={date} pantry={pantry} onLog={onLog}/>)}</div>}
      </div>)}
    </section>
    <form className="card stack" onSubmit={e=>{e.preventDefault();if(input.trim())answer(input.trim());}}>
      <label className="field"><span><MessageCircle size={16}/> ¿Qué tienes o qué quieres preparar?</span><textarea aria-label="Mensaje para asistente de recetas" rows={3} maxLength={600} required placeholder="Tengo arroz, pollo y tomate. ¿Qué puedo cocinar?" value={input} onChange={e=>setInput(e.target.value)}/></label>
      <div className="row"><button className="btn primary" type="submit" disabled={!input.trim()||!!filterError}><Send size={16}/> Buscar ideas</button><button className="btn ghost" type="button" disabled={!!filterError} onClick={()=>answer("Dame ideas con mi despensa")}>Ver ideas</button></div>
    </form>
    <p className="muted small">{mealSuggestionGuidance.exclusions} Las marcas y alimentos personalizados sin clasificación no se recomiendan automáticamente. Puedes registrarlos manualmente con su etiqueta.</p>
  </div>;
}
