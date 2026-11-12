import { describe,it,expect } from "vitest";
import { foods } from "../src/data/nutrition";
import { allergenOptions,createFoodFilter,foodSubstitutes,mealSuggestions } from "../src/data/mealSuggestions";
import {puertoRicanRecipes,recipeNutrients,findPuertoRicanRecipes,queryFilter,ingredientIdsInText,substituteRecipeIngredient} from "../src/data/puertoRicanRecipes";

describe("recetas PR con ingredientes verificables",()=>{
  it("calcula ingredientes reales, deja referencias y no altera el catálogo",()=>{
    const before=JSON.stringify(foods);
    expect(new Set(puertoRicanRecipes.map(recipe=>recipe.id)).size).toBe(puertoRicanRecipes.length);
    expect(puertoRicanRecipes.length).toBeGreaterThanOrEqual(20);
    for(const recipe of puertoRicanRecipes){
      expect(new Set(recipe.items.map(entry=>entry.foodId)).size).toBe(recipe.items.length);
      for(const entry of recipe.items){const food=foods.find(food=>food.id===entry.foodId);expect(food?.sourceId).toBeTruthy();expect(entry.amount).toBeGreaterThan(0);}
      const total=recipeNutrients(recipe.items);expect(total.kcal).toBeGreaterThan(0);expect(recipe.steps.length).toBeGreaterThan(1);
    }
    expect(recipeNutrients(puertoRicanRecipes[0].items).kcal).toBeCloseTo(621.3,5);
    expect(()=>recipeNutrients([{foodId:"inventado",amount:100}])).toThrow();
    expect(JSON.stringify(foods)).toBe(before);
  });
  it("respeta las 1,536 combinaciones de preferencias y exclusiones al generar recetas y menú",()=>{
    for(const preference of ["omnivore","vegetarian","plant"] as const) for(let mask=0;mask<512;mask++) {
      const excluded=allergenOptions.filter((_,index)=>mask&(1<<index)).map(option=>option.id);
      const options={preference,excluded,dietaryRestrictions:["lactose","no-red-meat","no-caffeine"]};
      const allowed=createFoodFilter(options);
      for(const match of findPuertoRicanRecipes(options)) for(const entry of match.recipe.items) expect(allowed(entry.foodId)).toBe(true);
      for(const day of mealSuggestions(preference,excluded,options)) for(const meal of day.meals) for(const entry of meal.items) expect(allowed(entry.foodId)).toBe(true);
      for(const id of ["milk","yogurt","butter","bread","beef","steak","espresso"]) expect(allowed(id)).toBe(false);
    }
    expect(()=>createFoodFilter({dietaryRestrictions:["dieta renal"]})).toThrow();
  });
  it("distingue lo que está disponible de lo que falta sin inventar alimentos",()=>{
    const pantry=["rice","beans","chicken","tomato","oil"];
    const result=findPuertoRicanRecipes({},pantry);
    expect(result[0].recipe.id).toBe("pr-arroz-habichuelas-pollo");
    expect(result[0].missingIds).toEqual([]);
    expect(findPuertoRicanRecipes({},["chicken"]).every(match=>match.missingIds.length>0)).toBe(true);
    expect(findPuertoRicanRecipes({},["aguacate-inexistente"])).toEqual([]);
    expect(ingredientIdsInText("Tengo arroz, pollo y tomate, sin leche")).toEqual(["rice","chicken","tomato"]);
    expect(ingredientIdsInText("Sustituye pollo por habichuelas")).toEqual(["chicken","beans"]);
    expect(findPuertoRicanRecipes({preference:"plant"},[],"cena").every(match=>match.recipe.meal==="Cena")).toBe(true);
  });
  it("acumula restricciones del perfil y del texto; sustituye y recalcula",()=>{
    const opts=queryFilter("Cena vegetariana sin arroz y sin leche",{excluded:["nuts"],dietaryRestrictions:["lactose"]});
    const allowed=createFoodFilter(opts);
    expect(allowed("rice")).toBe(false);expect(allowed("milk")).toBe(false);expect(allowed("almonds")).toBe(false);expect(allowed("chicken")).toBe(false);
    const original=puertoRicanRecipes[0];
    const adapted=substituteRecipeIngredient(original,"chicken","beans",{preference:"plant"});
    expect(adapted.items.find(entry=>entry.foodId==="beans")?.amount).toBe(250);
    expect(adapted.items.some(entry=>entry.foodId==="chicken")).toBe(false);
    expect(recipeNutrients(adapted.items).kcal).not.toBe(recipeNutrients(original.items).kcal);
    expect(adapted.adaptations?.[0]).toContain("No es una equivalencia nutricional");
    expect(()=>substituteRecipeIngredient(original,"chicken","salmon",{excluded:["fish"]})).toThrow();
    expect(foodSubstitutes("milk",{dietaryRestrictions:["lactose"]})).toHaveLength(0);
    expect(original.items.find(entry=>entry.foodId==="chicken")?.amount).toBe(130);
  });
});
