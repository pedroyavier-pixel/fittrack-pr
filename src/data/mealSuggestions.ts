import { foods, type DayMenu, type MealItem } from "./nutrition";

export type MealPreference = "omnivore" | "vegetarian" | "plant";
export type MealExclusion = "dairy" | "egg" | "fish" | "nuts" | "gluten" | "soy" | "sesame" | "shellfish" | "peanut";
export type DietaryRestriction = "lactose" | "no-red-meat" | "no-caffeine";
export interface NutritionFilter {
  preference?: MealPreference;
  excluded?: readonly string[];
  dietaryRestrictions?: readonly string[];
  favoriteIngredients?: readonly string[];
  avoidedIngredients?: readonly string[];
}
export const allergenOptions: {id: MealExclusion; label: string}[] = [
  {id:"dairy",label:"Leche y lácteos"}, {id:"egg",label:"Huevo"},
  {id:"fish",label:"Pescado"}, {id:"nuts",label:"Frutos secos"},
  {id:"gluten",label:"Trigo / gluten"}, {id:"soy",label:"Soya"},
  {id:"sesame",label:"Ajonjolí / sésamo"}, {id:"shellfish",label:"Mariscos"},
  {id:"peanut",label:"Maní"},
];
export const restrictionOptions: {id: DietaryRestriction; label: string}[] = [
  {id:"lactose",label:"Evitar lactosa"}, {id:"no-red-meat",label:"Evitar carne roja"},
  {id:"no-caffeine",label:"Evitar cafeína"},
];

/** Display alongside these ideas, including after saving them as an editable plan. */
export const mealSuggestionGuidance = {
  title: "Ideas de comidas para editar",
  description:
    "Las cantidades son ejemplos para comenzar a registrar ingredientes; no son una dieta personalizada ni un objetivo de calorías o nutrientes. Ajústalas a tus necesidades y a lo que realmente consumes.",
  preparation:
    "Respeta el estado crudo, seco o cocido indicado en cada alimento. Prepara los cereales con agua y registra por separado cualquier leche, aceite, mantequilla o salsa que añadas.",
  limitations:
    "La variedad depende del catálogo disponible. La opción vegetal repite habichuelas porque este catálogo no incluye otras legumbres ni productos de soya; estas ideas no garantizan cubrir tus necesidades nutricionales.",
  exclusions:
    "El filtro omite ingredientes identificados en el catálogo; no certifica que un producto o preparación sea apto para alergias o libre de gluten. Revisa las etiquetas, ingredientes y contacto cruzado con orientación profesional cuando corresponda.",
  rules: [
    "Alternar frutas, vegetales, cereales o papas y fuentes de proteína disponibles.",
    "Vegetariana: omitir carnes, pollo y pescado; permitir huevo y lácteos si no están excluidos.",
    "Vegetal: omitir todos los ingredientes animales, incluidos huevo, leche, yogur y mantequilla.",
    "Si excluyes gluten, omitir también la avena del catálogo porque no está verificada como libre de gluten.",
    "Mantener los ingredientes separados y registrar el consumo únicamente al confirmarlo.",
  ],
  sources: [
    {
      title: "CDC — Healthy Eating Tips",
      url: "https://www.cdc.gov/nutrition/features/healthy-eating-tips.html",
    },
    {
      title: "MedlinePlus — Vegetarian diet",
      url: "https://medlineplus.gov/ency/article/002465.htm",
    },
    {
      title: "FDA — Have Food Allergies? Read the Label",
      url: "https://www.fda.gov/consumers/consumer-updates/have-food-allergies-read-label",
    },
  ],
} as const;

/**
 * Classification only: all quantities and nutrients remain in nutrition.ts.
 * This is a closed allowlist. New catalog foods require review before use here.
 * The generic bread may represent a homemade recipe, so it is conservatively
 * excluded for dairy or egg too, rather than assuming its recipe is known.
 */
const foodRules = {
  rice: { animal: "none", exclusions: [] },
  beans: { animal: "none", exclusions: [] },
  tomato: { animal: "none", exclusions: [] },
  chicken: { animal: "meat", exclusions: [] },
  thigh: { animal: "meat", exclusions: [] },
  beef: { animal: "meat", exclusions: [] },
  steak: { animal: "meat", exclusions: [] },
  salmon: { animal: "fish", exclusions: ["fish"] },
  tuna: { animal: "fish", exclusions: ["fish"] },
  potato: { animal: "none", exclusions: [] },
  bakedPotato: { animal: "none", exclusions: [] },
  oats: { animal: "none", exclusions: ["gluten"] },
  farina: { animal: "none", exclusions: ["gluten"] },
  cornmeal: { animal: "none", exclusions: [] },
  yogurt: { animal: "dairy", exclusions: ["dairy"] },
  banana: { animal: "none", exclusions: [] },
  strawberry: { animal: "none", exclusions: [] },
  blueberry: { animal: "none", exclusions: [] },
  apple: { animal: "none", exclusions: [] },
  egg: { animal: "egg", exclusions: ["egg"] },
  milk: { animal: "dairy", exclusions: ["dairy"] },
  espresso: { animal: "none", exclusions: [] },
  oil: { animal: "none", exclusions: [] },
  butter: { animal: "dairy", exclusions: ["dairy"] },
  almonds: { animal: "none", exclusions: ["nuts"] },
  carrot: { animal: "none", exclusions: [] },
  zucchini: { animal: "none", exclusions: [] },
  bread: { animal: "none", exclusions: ["gluten", "dairy", "egg", "soy", "sesame", "shellfish", "peanut", "nuts", "fish"] },
  cornstarch: { animal: "none", exclusions: [] },
} as const;

export type SuggestedFoodId = keyof typeof foodRules;
type FoodId = SuggestedFoodId;
type Candidate = readonly [FoodId, number];

const knownExclusions: readonly string[] = allergenOptions.map(option => option.id);
const knownRestrictions: readonly string[] = restrictionOptions.map(option => option.id);
const preferences: readonly string[] = ["omnivore", "vegetarian", "plant"];

/** Strict ingredient-level rules; product labels and cross-contact remain unverified. */
export function createFoodFilter(options: NutritionFilter = {}) {
  const preference = options.preference || "omnivore";
  if (!preferences.includes(preference)) throw new Error("Selecciona una preferencia alimentaria válida.");
  const normalize = (values: readonly string[] = []) => values.map(value => value.trim().toLowerCase());
  const excluded = normalize(options.excluded);
  const restrictions = normalize(options.dietaryRestrictions);
  if (excluded.some(value => !knownExclusions.includes(value)))
    throw new Error("Hay una exclusión no admitida. Revisa las opciones de alergias e ingredientes.");
  if (restrictions.some(value => !knownRestrictions.includes(value)))
    throw new Error("Hay una restricción que este catálogo no puede evaluar. Revisa las opciones o consulta con un profesional.");
  const omitted = new Set(excluded);
  if (preference === "plant" || restrictions.includes("lactose")) {
    omitted.add("dairy");
  }
  if (preference === "plant") { omitted.add("egg"); omitted.add("fish"); }
  const available = new Set(foods.map(food => food.id));
  return (id: string): boolean => {
    if (!available.has(id) || !(id in foodRules) || options.avoidedIngredients?.includes(id)) return false;
    const rule = foodRules[id as FoodId];
    if (rule.exclusions.some(exclusion => omitted.has(exclusion))) return false;
    if (restrictions.includes("no-red-meat") && ["beef", "steak"].includes(id)) return false;
    if (restrictions.includes("no-caffeine") && id === "espresso") return false;
    if (preference === "plant" && rule.animal !== "none") return false;
    return preference !== "vegetarian" || (rule.animal !== "meat" && rule.animal !== "fish");
  };
}

export function foodAllowed(foodId: string, options: NutritionFilter = {}): boolean {
  return createFoodFilter(options)(foodId);
}

/** Ingredient alternatives, never claims of equivalent nutrition or allergen safety. */
export function foodSubstitutes(foodId: string, options: NutritionFilter = {}) {
  const allowed = createFoodFilter(options);
  const groups: readonly (readonly string[])[] = [
    ["chicken", "thigh", "beef", "steak", "salmon", "tuna", "egg", "beans"],
    ["rice", "potato", "bakedPotato", "bread"],
    ["oats", "cornmeal", "farina", "cornstarch"],
    ["yogurt", "milk"], ["banana", "strawberry", "blueberry", "apple"],
    ["carrot", "zucchini", "tomato"], ["oil", "butter"], ["almonds"],
  ];
  const candidates = groups.find(group => group.includes(foodId)) || [];
  const favorites = options.favoriteIngredients || [];
  return foods.filter(food => candidates.includes(food.id) && food.id !== foodId && allowed(food.id))
    .sort((a,b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
}

/**
 * Seven independent, editable ideas (JS weekdays 0 = Sunday … 6 = Saturday).
 * No target, demographic value or Pedro-specific menu is used to choose amounts.
 * No milk/espresso or coffee flag is inserted automatically.
 *
 * Unsupported exclusion strings fail closed instead of silently ignoring them.
 * Filtering is at ingredient level, not a product/allergy safety assessment.
 */
export function mealSuggestions(
  preference: MealPreference,
  excluded: string[],
  extra: Pick<NutritionFilter, "dietaryRestrictions" | "favoriteIngredients"> = {},
): DayMenu[] {
  const options: NutritionFilter = { ...extra, preference, excluded };
  const allowed = createFoodFilter(options);
  const favorites = new Set(extra.favoriteIngredients || []);

  // Rotate only through reviewed, existing, permitted foods. A blocked choice
  // never returns as a fallback, even if all choices in a group are blocked.
  const choose = (
    candidates: readonly Candidate[],
    offset: number,
  ): Candidate | undefined => {
    const favorite = candidates.find(candidate => favorites.has(candidate[0]) && allowed(candidate[0]));
    if (favorite) return favorite;
    for (let step = 0; step < candidates.length; step += 1) {
      const candidate = candidates[(offset + step) % candidates.length];
      if (allowed(candidate[0])) return candidate;
    }
    return undefined;
  };

  const meal = (
    name: string,
    candidates: (Candidate | undefined)[],
  ): DayMenu["meals"][number] => {
    const seen = new Set<FoodId>();
    const items: MealItem[] = [];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const [foodId, amount] = candidate;
      if (!allowed(foodId) || seen.has(foodId)) continue;
      seen.add(foodId);
      items.push({ foodId, amount });
    }
    return { name, items };
  };

  const fruit: readonly Candidate[] = [
    ["banana", 100],
    ["strawberry", 120],
    ["apple", 120],
    ["blueberry", 100],
  ];
  const cereal: readonly Candidate[] = [
    ["oats", 40],
    ["cornmeal", 40],
    ["farina", 40],
    ["bread", 50],
  ];
  const starch: readonly Candidate[] = [
    ["rice", 150],
    ["potato", 200],
    ["bakedPotato", 200],
    ["bread", 60],
  ];
  const protein: readonly Candidate[] = [
    ["chicken", 130],
    ["beans", 150],
    ["salmon", 130],
    ["egg", 100],
    ["steak", 130],
    ["thigh", 130],
    ["tuna", 100],
  ];
  const breakfastProtein: readonly Candidate[] = [
    ["yogurt", 170],
    ["egg", 100],
    ["beans", 100],
  ];
  const snack: readonly Candidate[] = [
    ["yogurt", 170],
    ["almonds", 20],
    ["bread", 40],
    ["cornmeal", 30],
  ];
  const vegetables: readonly Candidate[] = [
    ["carrot", 100],
    ["zucchini", 100],
    ["tomato", 50],
  ];

  return Array.from(
    { length: 7 },
    (_, day): DayMenu => ({
      day,
      meals: [
        meal("Desayuno", [
          choose(cereal, day),
          choose(fruit, day),
          choose(breakfastProtein, day),
        ]),
        meal("Almuerzo", [
          choose(starch, day),
          choose(protein, day),
          choose(vegetables, day),
          ["oil", 5],
        ]),
        meal("Merienda", [choose(fruit, day + 2), choose(snack, day)]),
        meal("Cena", [
          choose(starch, day + 2),
          choose(protein, day + 3),
          choose(vegetables, day + 1),
          ["oil", 5],
        ]),
      ],
    }),
  );
}
