import { foods, type Food, type MealItem, type Nutrients } from "./nutrition";
import { createFoodFilter, foodSubstitutes, type NutritionFilter } from "./mealSuggestions";

export interface PuertoRicanRecipe {
  id: string;
  name: string;
  description: string;
  meal: "Desayuno" | "Almuerzo" | "Merienda" | "Cena";
  minutes: number;
  items: MealItem[];
  steps: string[];
  tags: string[];
  adaptations?: string[];
}
const item = (foodId: string, amount: number): MealItem => ({ foodId, amount });
/**
 * Ideas caseras inspiradas en sabores habituales de Puerto Rico. Versiones
 * adaptadas al catálogo disponible, no recetas tradicionales completas.
 * Cada cantidad representa una porción ilustrativa editable. No hay nutrientes
 * de platos inventados: los totales suman exclusivamente ingredientes USDA.
 * Carnes, arroz, legumbres y papas se pesan ya cocidos según su entrada.
 * Los tiempos son estimados para montar el plato con esos ingredientes listos.
 * Agua y sal al gusto no aportan energía aquí; no se calcula sodio.
 */
export const puertoRicanRecipes: PuertoRicanRecipe[] = [
  { id:"pr-arroz-habichuelas-pollo", name:"Arroz, habichuelas y pechuga", description:"El plato de casa, con tomate simple y aceite medido; sin sofrito comercial.", meal:"Almuerzo", minutes:15,
    items:[item("rice",150),item("beans",120),item("chicken",130),item("tomato",40),item("oil",5)],
    steps:["Pesa el arroz, las habichuelas y la pechuga ya cocidos.","Calienta las habichuelas con el tomate, el aceite medido y un poco de agua.","Sirve con el arroz y la pechuga. Registra cualquier ingrediente adicional."],tags:["boricua","arroz","habichuelas","pollo"] },
  { id:"pr-arroz-habichuelas-vegetales",name:"Arroz con habichuelas y vegetales",description:"Versión vegetal con habichuelas como fuente de proteína del catálogo.",meal:"Almuerzo",minutes:15,
    items:[item("rice",150),item("beans",170),item("tomato",40),item("carrot",80),item("zucchini",80),item("oil",5)],
    steps:["Pesa el arroz, las habichuelas y los vegetales ya cocidos.","Calienta las habichuelas con tomate, aceite y agua a tu gusto.","Combina con los vegetales y sirve el arroz aparte."],tags:["boricua","vegetal","arroz","habichuelas"] },
  { id:"pr-arroz-huevo-habichuelas",name:"Arroz con huevo y habichuelas",description:"Con huevo hervido; si lo preparas frito, añade el aceite utilizado al registro.",meal:"Almuerzo",minutes:10,
    items:[item("rice",150),item("egg",100),item("beans",100),item("tomato",30)],
    steps:["Pesa el arroz, las habichuelas y el huevo hervido sin cáscara.","Calienta arroz y habichuelas con el tomate.","Añade el huevo en mitades y ajusta tus porciones."],tags:["boricua","vegetariana","huevo","arroz"] },
  { id:"pr-picadillo-papas",name:"Carne molida con papas",description:"Picadillo adaptado sin cebolla, aceitunas ni sofrito comercial.",meal:"Cena",minutes:20,
    items:[item("beef",150),item("bakedPotato",200),item("tomato",60),item("carrot",80),item("oil",5)],
    steps:["Usa carne molida 95 % magra cocida y escurrida; pesa la porción.","Calienta con tomate, zanahoria ya cocida y aceite medido.","Sirve con papas ya cocidas en air fryer. Esta referencia usa papa al horno; pesa después de cocinar."],tags:["boricua","carne","papas","picadillo"] },
  { id:"pr-bistec-majado",name:"Bistec con papa majada",description:"Bistec sin cebolla y majado con leche y mantequilla registradas aparte.",meal:"Cena",minutes:15,
    items:[item("steak",150),item("potato",220),item("milk",40),item("butter",5),item("carrot",100)],
    steps:["Pesa la papa hervida sin piel, el bistec cocido y la zanahoria cocida.","Maja la papa e incorpora la leche y la mantequilla medidas.","Sirve el bistec con el majado y la zanahoria."],tags:["boricua","bistec","majadito","papas"] },
  { id:"pr-pollo-papas",name:"Pollo asado con papas",description:"Caderas sin piel, papas y zanahoria; una versión casera con aceite pesado.",meal:"Cena",minutes:15,
    items:[item("thigh",150),item("bakedPotato",220),item("carrot",100),item("oil",5)],
    steps:["Pesa el pollo ya asado sin piel y las papas ya cocidas.","Calienta con la zanahoria y el aceite medido.","Cuenta aparte cualquier salsa o adobo con calorías."],tags:["boricua","pollo","papas","asado"] },
  { id:"pr-salmon-arroz",name:"Salmón con arroz y calabacín",description:"Plato sencillo con el pescado que sí tiene una referencia verificada en el catálogo.",meal:"Almuerzo",minutes:15,
    items:[item("salmon",140),item("rice",150),item("zucchini",120),item("oil",5)],
    steps:["Pesa el salmón al horno, el arroz y el calabacín ya cocidos.","Sirve con el aceite medido sobre los vegetales.","Si añades salsa, registra sus ingredientes por separado."],tags:["pescado","salmón","arroz"] },
  { id:"pr-atun-papas",name:"Ensalada tibia de papa y atún",description:"Sin mayonesa ni cebolla; atún escurrido y tomate simple.",meal:"Almuerzo",minutes:10,
    items:[item("tuna",120),item("potato",200),item("tomato",40),item("carrot",80),item("oil",5)],
    steps:["Pesa el atún escurrido y las papas y zanahorias ya hervidas.","Mezcla con tomate y aceite medido.","Ajusta la textura con un poco de agua; no se incluye mayonesa."],tags:["boricua","atún","pescado","papas"] },
  { id:"pr-habichuelas-guisadas",name:"Habichuelas guisadas sin sofrito",description:"Habichuelas, tomate y papa, con ingredientes separados en el registro.",meal:"Cena",minutes:15,
    items:[item("beans",180),item("potato",150),item("tomato",60),item("carrot",80),item("oil",5)],
    steps:["Pesa las habichuelas, papa y zanahoria ya cocidas.","Calienta todo con tomate, aceite y agua hasta lograr la consistencia que prefieras.","Estas cantidades no incluyen cubitos, sofrito ni salsas preparadas."],tags:["boricua","vegetal","habichuelas","guiso"] },
  { id:"pr-sopa-pollo-papa",name:"Sopa casera de pollo y papa",description:"Inspiración boricua adaptada: sin fideos, apio ni cebolla.",meal:"Cena",minutes:15,
    items:[item("chicken",130),item("potato",180),item("carrot",100),item("tomato",30),item("oil",5)],
    steps:["Corta la pechuga, papa y zanahoria ya cocidas y pesa cada porción.","Calienta con agua, tomate y aceite medido.","Si usas caldo comercial, registra sus nutrientes y revisa sus ingredientes."],tags:["boricua","sopa","pollo","papas"] },
  { id:"pr-papas-habichuelas",name:"Papas con habichuelas salteadas",description:"Alternativa vegetal de sartén con tomate y calabacín.",meal:"Cena",minutes:15,
    items:[item("bakedPotato",200),item("beans",160),item("zucchini",100),item("tomato",40),item("oil",5)],
    steps:["Usa papas, habichuelas y calabacín ya cocidos; pesa cada uno.","Calienta en sartén con tomate y el aceite medido.","Sirve y ajusta las cantidades antes de registrar."],tags:["vegetal","boricua","papas","habichuelas"] },
  { id:"pr-crema-maiz-agua",name:"Crema de maíz con guineo",description:"Harina de maíz cocida con agua; sin leche ni azúcar añadida.",meal:"Desayuno",minutes:15,
    items:[item("cornmeal",45),item("banana",100)],
    steps:["Pesa la harina de maíz seca.","Cocina con agua, removiendo hasta que esté bien cocida y tenga la textura deseada.","Añade el guineo pesado sin cáscara. La canela opcional no está incluida en el cálculo."],tags:["boricua","vegetal","desayuno","maíz"] },
  { id:"pr-crema-maiz-leche",name:"Crema de maíz con leche",description:"Una versión de desayuno con leche genérica editable y guineo.",meal:"Desayuno",minutes:15,
    items:[item("cornmeal",40),item("milk",150),item("banana",80)],
    steps:["Pesa la harina seca y mide la leche.","Cocina removiendo; añade agua si necesitas ajustar la consistencia.","Sirve con el guineo. Sustituye la referencia de leche por la etiqueta real de tu producto."],tags:["boricua","desayuno","maíz","leche"] },
  { id:"pr-avena-guineo",name:"Avena con guineo y almendras",description:"Avena preparada con agua y cada añadido medido por separado.",meal:"Desayuno",minutes:10,
    items:[item("oats",45),item("banana",100),item("almonds",15)],
    steps:["Pesa la avena seca y cocínala con agua.","Añade guineo sin cáscara y almendras pesadas.","No se incluye azúcar, miel ni leche; añade sus registros si los consumes."],tags:["vegetal","desayuno","avena","fruta"] },
  { id:"pr-farina-fruta",name:"Farina con manzana",description:"Preparada con agua; incluye trigo y no sirve para una exclusión de gluten.",meal:"Desayuno",minutes:10,
    items:[item("farina",45),item("apple",120)],
    steps:["Pesa la farina seca y cocínala con agua siguiendo su preparación.","Añade la manzana sin corazón en trozos.","Registra por separado cualquier leche, mantequilla o azúcar adicional."],tags:["boricua","desayuno","farina","fruta"] },
  { id:"pr-maicena-fruta",name:"Maicena con leche y fresas",description:"Crema de maicena sin azúcar añadida, con una referencia genérica de leche.",meal:"Desayuno",minutes:10,
    items:[item("cornstarch",30),item("milk",180),item("strawberry",100)],
    steps:["Pesa la maicena seca y disuélvela en parte de la leche fría medida.","Calienta con el resto de la leche, removiendo hasta que espese y quede cocida.","Sirve con las fresas. La etiqueta real de la leche reemplaza a la referencia genérica."],tags:["boricua","desayuno","maicena","leche"] },
  { id:"pr-yogur-frutas",name:"Yogur con frutas y almendras",description:"Merienda con yogur griego natural sin grasa; ajusta a tu marca real.",meal:"Merienda",minutes:5,
    items:[item("yogurt",170),item("strawberry",100),item("blueberry",60),item("almonds",15)],
    steps:["Pesa el yogur natural y las frutas.","Añade las almendras medidas.","Si el yogur es endulzado o tiene otra grasa, edita su etiqueta antes de registrar."],tags:["merienda","fruta","yogur"] },
  { id:"pr-fruta-almendras",name:"Guineo, manzana y almendras",description:"Una merienda que no requiere cocinar.",meal:"Merienda",minutes:5,
    items:[item("banana",80),item("apple",100),item("almonds",20)],
    steps:["Pesa la fruta comestible sin cáscara de guineo ni corazón de manzana.","Añade las almendras pesadas.","Ajusta las cantidades a lo que realmente comas."],tags:["vegetal","merienda","fruta"] },
  { id:"pr-frutas-mixtas",name:"Frutas mixtas",description:"Guineo y fresas, sin salsas ni añadidos.",meal:"Merienda",minutes:5,
    items:[item("banana",100),item("strawberry",120)],
    steps:["Lava y prepara la fruta.","Pesa la porción comestible de cada ingrediente y mezcla."],tags:["vegetal","merienda","fruta"] },
  { id:"pr-papa-huevo",name:"Papa con huevo hervido",description:"Desayuno salado con huevo ya cocido y tomate simple.",meal:"Desayuno",minutes:10,
    items:[item("potato",180),item("egg",100),item("tomato",30),item("oil",5)],
    steps:["Pesa papa hervida sin piel y huevo hervido sin cáscara.","Calienta la papa con tomate y aceite medido.","Añade el huevo cortado al servir."],tags:["vegetariana","desayuno","huevo","papas"] },
];

/** Totals reflect the current verified/user-edited labels, never invented dish macros. */
export function recipeNutrients(items: MealItem[], library: Food[] = foods): Nutrients {
  return items.reduce((total, entry) => {
    const food = library.find(value => value.id === entry.foodId);
    if (!food || !Number.isFinite(entry.amount) || entry.amount <= 0)
      throw new Error("Revisa los ingredientes y cantidades antes de calcular.");
    for (const key of ["kcal","protein","carbs","fat"] as const)
      total[key] += food[key] * entry.amount / 100;
    return total;
  }, {kcal:0,protein:0,carbs:0,fat:0});
}

const aliases: Record<string,string[]> = {
  rice:["arroz"],beans:["habichuelas","frijoles","frijol","beans"],tomato:["tomate","salsa de tomate"],
  chicken:["pollo","pechuga"],thigh:["caderas","muslo","muslos"],beef:["carne molida","picadillo"],steak:["bistec","steak","sirloin"],
  salmon:["salmon"],tuna:["atun"],potato:["papa","papas","patata","patatas","majadito","majado"],
  bakedPotato:["papas en air fryer","papa al horno","papas al horno"],oats:["avena"],farina:["farina"],cornmeal:["harina de maiz","crema de maiz","maiz"],
  yogurt:["yogur","yogurt"],banana:["guineo","banana","banano"],strawberry:["fresa","fresas"],blueberry:["arandanos","blueberries"],
  apple:["manzana","manzanas"],egg:["huevo","huevos"],milk:["leche"],espresso:["cafe","espresso"],oil:["aceite"],butter:["mantequilla"],almonds:["almendras","almendra"],
  carrot:["zanahoria","zanahorias"],zucchini:["calabacin","zucchini"],bread:["pan","tostadas"],cornstarch:["maicena","fecula de maiz"],
};
export function normalizedRecipeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
const phrasePresent = (text: string, phrase: string) => new RegExp(`(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}($|[^a-z0-9])`).test(text);
export function ingredientIdsInText(text: string): string[] {
  const normalized = normalizedRecipeText(text);
  const withoutNegation = normalized.replace(/\b(?:sin|no tengo|no quiero|no me gusta|evitar)\s+[^,;.]+/g, " ");
  const found = Object.entries(aliases).map(([id,names]) => ({id,index:Math.min(...names.filter(name => phrasePresent(withoutNegation,name)).map(name=>withoutNegation.indexOf(name)))})).filter(entry=>Number.isFinite(entry.index)).sort((a,b)=>a.index-b.index).map(entry=>entry.id);
  // A specific preparation wins over the generic mention of the same ingredient.
  return found.includes("bakedPotato") ? found.filter(id=>id!=="potato") : found;
}
export function queryFilter(text: string, options: NutritionFilter): NutritionFilter {
  const normalized = normalizedRecipeText(text);
  const excluded = new Set(options.excluded || []);
  const dietaryRestrictions = new Set(options.dietaryRestrictions || []);
  const phrases: Record<string,string[]> = {
    dairy:["sin leche","sin lacteos","alergia a la leche"],egg:["sin huevo","sin huevos"],fish:["sin pescado","sin atun","sin salmon"],
    nuts:["sin frutos secos","sin almendras"],gluten:["sin gluten","sin trigo"],soy:["sin soya","sin soja"],sesame:["sin sesamo","sin ajonjoli"],
    shellfish:["sin mariscos"],peanut:["sin mani","sin cacahuate"],
  };
  for (const [key,values] of Object.entries(phrases)) if(values.some(phrase=>phrasePresent(normalized,phrase))) excluded.add(key);
  const avoidedIngredients=new Set(options.avoidedIngredients || []);
  for (const match of normalized.matchAll(/\bsin\s+(.+?)(?=\s+(?:con|pero|para)\b|[,;.!?]|$)/g))
    for (const id of ingredientIdsInText(match[1])) avoidedIngredients.add(id);
  if (normalized.includes("celiac")) excluded.add("gluten");
  if (normalized.includes("intoleran") && normalized.includes("lactosa")) dietaryRestrictions.add("lactose");
  if (normalized.includes("sin lactosa")) dietaryRestrictions.add("lactose");
  if (normalized.includes("sin carne roja")) dietaryRestrictions.add("no-red-meat");
  if (normalized.includes("sin cafeina")) dietaryRestrictions.add("no-caffeine");
  const preference = /\b(vegano|vegana|vegetal)\b/.test(normalized) ? "plant" : /\b(vegetariano|vegetariana)\b/.test(normalized) && options.preference!=="plant" ? "vegetarian" : options.preference;
  return {...options,preference,excluded:[...excluded],dietaryRestrictions:[...dietaryRestrictions],avoidedIngredients:[...avoidedIngredients]};
}

export interface RecipeMatch { recipe: PuertoRicanRecipe; missingIds: string[]; availableCount: number; score: number }
/** Return only compatible originals; missing ingredients are disclosed, not invented. */
export function findPuertoRicanRecipes(options: NutritionFilter, pantry: string[] = [], text = ""): RecipeMatch[] {
  const allowed = createFoodFilter(options);
  const available = new Set(pantry.filter(allowed));
  const favorites = new Set(options.favoriteIngredients || []);
  const query = normalizedRecipeText(text);
  const requestedMeal = ["Desayuno","Almuerzo","Merienda","Cena"].find(meal=>query.includes(normalizedRecipeText(meal)));
  return puertoRicanRecipes.filter(recipe=>recipe.items.every(entry=>allowed(entry.foodId)))
    .filter(recipe=>!requestedMeal || recipe.meal===requestedMeal)
    .map(recipe=>{
      const ids=recipe.items.map(entry=>entry.foodId);
      const missingIds = pantry.length ? ids.filter(id=>!available.has(id)) : [];
      const availableCount = ids.filter(id=>available.has(id)).length;
      const score=(pantry.length && !missingIds.length ? 1000 : 0)+availableCount*20-missingIds.length*10+ids.filter(id=>favorites.has(id)).length*3;
      return {recipe:{...recipe,items:recipe.items.map(entry=>({...entry})),steps:[...recipe.steps],tags:[...recipe.tags]},missingIds,availableCount,score};
    }).filter(match=>!pantry.length || match.availableCount>0)
    .sort((a,b)=>b.score-a.score || a.recipe.name.localeCompare(b.recipe.name,"es"));
}

export function substituteRecipeIngredient(recipe: PuertoRicanRecipe, foodId: string, replacementId: string, options: NutritionFilter): PuertoRicanRecipe {
  if (!recipe.items.some(entry=>entry.foodId===foodId)) throw new Error("Ese ingrediente no forma parte de la receta.");
  if (!foodSubstitutes(foodId,options).some(food=>food.id===replacementId)) throw new Error("Sustitución no disponible para tus filtros.");
  const original=foods.find(food=>food.id===foodId)!,replacement=foods.find(food=>food.id===replacementId)!;
  const combined=new Map<string,number>();
  for(const entry of recipe.items){const id=entry.foodId===foodId?replacementId:entry.foodId;combined.set(id,(combined.get(id)||0)+entry.amount);}
  const items=[...combined].map(([id,amount])=>item(id,amount));
  const allowed=createFoodFilter(options);
  if(items.some(entry=>!allowed(entry.foodId))) throw new Error("La receta todavía contiene ingredientes excluidos.");
  return {...recipe,name:`${recipe.name} · adaptada`,items,adaptations:[...(recipe.adaptations||[]),`${original.name} → ${replacement.name}. Se conservan gramos como ejemplo; ajusta la porción. No es una equivalencia nutricional.`],
    steps:["Usa los ingredientes de esta lista adaptada, pesados en el estado indicado por su catálogo.","Combina y calienta los componentes cocidos según corresponda; los tiempos y la preparación cambian al sustituir ingredientes.","Registra cualquier añadido por separado. Esta adaptación no reproduce la receta original."]};
}
