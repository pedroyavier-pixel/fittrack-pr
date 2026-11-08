/**
 * Source: USDA FoodData Central, SR Legacy (April 2018), downloaded 2026-11-08.
 * Official dataset: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip
 * Nutrients are per 100 g, or per 100 ml when unit === 'ml'.
 * Generic references are editable and must not be presented as a brand's label.
 * Cooked and dry weights are deliberately different catalog entries.
 */
export type Nutrients = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type Food = Nutrients & {
  id: string;
  name: string;
  state: string;
  unit: "g" | "ml";
  source: string;
  sourceId?: string;
};
export type MealItem = { foodId: string; amount: number; coffee?: boolean };
/** JavaScript weekdays: 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
export type DayMenu = {
  day: number;
  meals: { name: string; items: MealItem[] }[];
};

export const foods: Food[] = [
  {
    id: "rice",
    name: "Arroz blanco",
    state: "Cocido",
    unit: "g",
    kcal: 130,
    protein: 2.69,
    carbs: 28.2,
    fat: 0.28,
    source: "https://fdc.nal.usda.gov/food-details/168878/nutrients",
    sourceId: "168878",
  },
  {
    id: "beans",
    name: "Habichuelas rojas",
    state: "Cocidas sin sal",
    unit: "g",
    kcal: 127,
    protein: 8.67,
    carbs: 22.8,
    fat: 0.5,
    source: "https://fdc.nal.usda.gov/food-details/173740/nutrients",
    sourceId: "173740",
  },
  {
    id: "tomato",
    name: "Tomate triturado sin cebolla",
    state: "Puré enlatado sin sal añadida; comprobar ingredientes",
    unit: "g",
    kcal: 38.0,
    protein: 1.65,
    carbs: 8.98,
    fat: 0.21,
    source: "https://fdc.nal.usda.gov/food-details/170460/nutrients",
    sourceId: "170460",
  },
  {
    id: "chicken",
    name: "Pechuga de pollo sin piel",
    state: "Cocida/asada",
    unit: "g",
    kcal: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.57,
    source: "https://fdc.nal.usda.gov/food-details/171477/nutrients",
    sourceId: "171477",
  },
  {
    id: "thigh",
    name: "Caderas de pollo sin piel",
    state: "Cocidas/asadas",
    unit: "g",
    kcal: 179,
    protein: 24.8,
    carbs: 0.0,
    fat: 8.15,
    source: "https://fdc.nal.usda.gov/food-details/172388/nutrients",
    sourceId: "172388",
  },
  {
    id: "beef",
    name: "Carne molida 95 % magra",
    state: "Cocida y escurrida",
    unit: "g",
    kcal: 193,
    protein: 29.2,
    carbs: 0.0,
    fat: 7.58,
    source: "https://fdc.nal.usda.gov/food-details/174028/nutrients",
    sourceId: "174028",
  },
  {
    id: "steak",
    name: "Bistec de sirloin magro",
    state: "Cocido sin grasa visible",
    unit: "g",
    kcal: 183,
    protein: 30.6,
    carbs: 0.0,
    fat: 5.79,
    source: "https://fdc.nal.usda.gov/food-details/168634/nutrients",
    sourceId: "168634",
  },
  {
    id: "salmon",
    name: "Salmón atlántico",
    state: "Cocido al horno",
    unit: "g",
    kcal: 206,
    protein: 22.1,
    carbs: 0.0,
    fat: 12.4,
    source: "https://fdc.nal.usda.gov/food-details/175168/nutrients",
    sourceId: "175168",
  },
  {
    id: "tuna",
    name: "Atún claro en agua",
    state: "Escurrido",
    unit: "g",
    kcal: 86.0,
    protein: 19.4,
    carbs: 0.0,
    fat: 0.96,
    source: "https://fdc.nal.usda.gov/food-details/173709/nutrients",
    sourceId: "173709",
  },
  {
    id: "potato",
    name: "Papa para majado",
    state: "Hervida, sin piel ni sal",
    unit: "g",
    kcal: 86.0,
    protein: 1.71,
    carbs: 20.0,
    fat: 0.1,
    source: "https://fdc.nal.usda.gov/food-details/170440/nutrients",
    sourceId: "170440",
  },
  {
    id: "bakedPotato",
    name: "Papa para air fryer",
    state: "Referencia cocida al horno con piel; aceite aparte",
    unit: "g",
    kcal: 93.0,
    protein: 2.5,
    carbs: 21.2,
    fat: 0.13,
    source: "https://fdc.nal.usda.gov/food-details/170093/nutrients",
    sourceId: "170093",
  },
  {
    id: "oats",
    name: "Avena",
    state: "Seca; preparar con agua",
    unit: "g",
    kcal: 379,
    protein: 13.2,
    carbs: 67.7,
    fat: 6.52,
    source: "https://fdc.nal.usda.gov/food-details/173904/nutrients",
    sourceId: "173904",
  },
  {
    id: "farina",
    name: "Farina",
    state: "Seca; preparar con agua",
    unit: "g",
    kcal: 369,
    protein: 10.6,
    carbs: 78.0,
    fat: 0.5,
    source: "https://fdc.nal.usda.gov/food-details/173916/nutrients",
    sourceId: "173916",
  },
  {
    id: "cornmeal",
    name: "Harina de maíz integral amarilla",
    state: "Seca; preparar con agua",
    unit: "g",
    kcal: 362,
    protein: 8.12,
    carbs: 76.9,
    fat: 3.59,
    source: "https://fdc.nal.usda.gov/food-details/169697/nutrients",
    sourceId: "169697",
  },
  {
    id: "yogurt",
    name: "Yogur griego natural sin grasa",
    state: "Listo para consumir, referencia genérica",
    unit: "g",
    kcal: 59.0,
    protein: 10.2,
    carbs: 3.6,
    fat: 0.39,
    source: "https://fdc.nal.usda.gov/food-details/170894/nutrients",
    sourceId: "170894",
  },
  {
    id: "banana",
    name: "Guineo",
    state: "Crudo, sin cáscara",
    unit: "g",
    kcal: 89.0,
    protein: 1.09,
    carbs: 22.8,
    fat: 0.33,
    source: "https://fdc.nal.usda.gov/food-details/173944/nutrients",
    sourceId: "173944",
  },
  {
    id: "strawberry",
    name: "Fresas",
    state: "Crudas",
    unit: "g",
    kcal: 32.0,
    protein: 0.67,
    carbs: 7.68,
    fat: 0.3,
    source: "https://fdc.nal.usda.gov/food-details/167762/nutrients",
    sourceId: "167762",
  },
  {
    id: "blueberry",
    name: "Arándanos",
    state: "Crudos",
    unit: "g",
    kcal: 57.0,
    protein: 0.74,
    carbs: 14.5,
    fat: 0.33,
    source: "https://fdc.nal.usda.gov/food-details/171711/nutrients",
    sourceId: "171711",
  },
  {
    id: "apple",
    name: "Manzana con piel",
    state: "Cruda, sin corazón",
    unit: "g",
    kcal: 52.0,
    protein: 0.26,
    carbs: 13.8,
    fat: 0.17,
    source: "https://fdc.nal.usda.gov/food-details/171688/nutrients",
    sourceId: "171688",
  },
  {
    id: "egg",
    name: "Huevos",
    state: "Hervidos; 50 g por huevo grande",
    unit: "g",
    kcal: 155,
    protein: 12.6,
    carbs: 1.12,
    fat: 10.6,
    source: "https://fdc.nal.usda.gov/food-details/173424/nutrients",
    sourceId: "173424",
  },
  {
    id: "milk",
    name: "Leche entera (genérica provisional)",
    state: "3.25 % grasa; reemplazar con etiqueta Tres Monjitas",
    unit: "ml",
    kcal: 62.91099,
    protein: 3.24868,
    carbs: 4.95037,
    fat: 3.35182,
    source: "https://fdc.nal.usda.gov/food-details/171265/nutrients",
    sourceId: "171265",
  },
  {
    id: "espresso",
    name: "Espresso sin azúcar",
    state: "Preparado",
    unit: "ml",
    kcal: 9.00806,
    protein: 0.12011,
    carbs: 1.67149,
    fat: 0.18016,
    source: "https://fdc.nal.usda.gov/food-details/171891/nutrients",
    sourceId: "171891",
  },
  {
    id: "oil",
    name: "Aceite de canola",
    state: "Aceite añadido pesado",
    unit: "g",
    kcal: 884,
    protein: 0.0,
    carbs: 0.0,
    fat: 100,
    source: "https://fdc.nal.usda.gov/food-details/172336/nutrients",
    sourceId: "172336",
  },
  {
    id: "butter",
    name: "Mantequilla sin sal",
    state: "Lista para consumir",
    unit: "g",
    kcal: 717,
    protein: 0.85,
    carbs: 0.06,
    fat: 81.1,
    source: "https://fdc.nal.usda.gov/food-details/173430/nutrients",
    sourceId: "173430",
  },
  {
    id: "almonds",
    name: "Almendras",
    state: "Crudas",
    unit: "g",
    kcal: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
    source: "https://fdc.nal.usda.gov/food-details/170567/nutrients",
    sourceId: "170567",
  },
  {
    id: "carrot",
    name: "Zanahoria",
    state: "Hervida sin sal",
    unit: "g",
    kcal: 35.0,
    protein: 0.76,
    carbs: 8.22,
    fat: 0.18,
    source: "https://fdc.nal.usda.gov/food-details/170394/nutrients",
    sourceId: "170394",
  },
  {
    id: "zucchini",
    name: "Calabacín",
    state: "Hervido sin sal",
    unit: "g",
    kcal: 15.0,
    protein: 1.14,
    carbs: 2.69,
    fat: 0.36,
    source: "https://fdc.nal.usda.gov/food-details/169292/nutrients",
    sourceId: "169292",
  },
  {
    id: "bread",
    name: "Pan francés (referencia para pan casero)",
    state: "Listo para consumir; usar receta real del pan casero",
    unit: "g",
    kcal: 272,
    protein: 10.8,
    carbs: 51.9,
    fat: 2.42,
    source: "https://fdc.nal.usda.gov/food-details/172675/nutrients",
    sourceId: "172675",
  },
  {
    id: "cornstarch",
    name: "Maicena",
    state: "Seca",
    unit: "g",
    kcal: 381,
    protein: 0.26,
    carbs: 91.3,
    fat: 0.05,
    source: "https://fdc.nal.usda.gov/food-details/169698/nutrients",
    sourceId: "169698",
  },
];

/** Planned amounts only: nothing is consumed until the user confirms a log. */
export const weeklyMenu: DayMenu[] = [
  {
    day: 1,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "oats",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "yogurt",
            amount: 140,
          },
          {
            foodId: "banana",
            amount: 100,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "rice",
            amount: 125,
          },
          {
            foodId: "beans",
            amount: 100,
          },
          {
            foodId: "tomato",
            amount: 30,
          },
          {
            foodId: "oil",
            amount: 12,
          },
          {
            foodId: "chicken",
            amount: 140,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 240,
          },
          {
            foodId: "strawberry",
            amount: 150,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "beef",
            amount: 150,
          },
          {
            foodId: "bakedPotato",
            amount: 280,
          },
          {
            foodId: "oil",
            amount: 15,
          },
          {
            foodId: "carrot",
            amount: 100,
          },
        ],
      },
    ],
  },
  {
    day: 2,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "farina",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "banana",
            amount: 100,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "steak",
            amount: 155,
          },
          {
            foodId: "potato",
            amount: 220,
          },
          {
            foodId: "milk",
            amount: 50,
          },
          {
            foodId: "butter",
            amount: 10,
          },
          {
            foodId: "carrot",
            amount: 100,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 280,
          },
          {
            foodId: "apple",
            amount: 150,
          },
          {
            foodId: "almonds",
            amount: 15,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "chicken",
            amount: 155,
          },
          {
            foodId: "rice",
            amount: 120,
          },
          {
            foodId: "beans",
            amount: 100,
          },
          {
            foodId: "tomato",
            amount: 30,
          },
          {
            foodId: "oil",
            amount: 14,
          },
          {
            foodId: "zucchini",
            amount: 100,
          },
        ],
      },
    ],
  },
  {
    day: 3,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "cornmeal",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "banana",
            amount: 100,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "salmon",
            amount: 205,
          },
          {
            foodId: "rice",
            amount: 155,
          },
          {
            foodId: "carrot",
            amount: 100,
          },
          {
            foodId: "oil",
            amount: 3,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 300,
          },
          {
            foodId: "apple",
            amount: 150,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "beef",
            amount: 200,
          },
          {
            foodId: "bakedPotato",
            amount: 275,
          },
          {
            foodId: "oil",
            amount: 3,
          },
          {
            foodId: "zucchini",
            amount: 150,
          },
        ],
      },
    ],
  },
  {
    day: 4,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "oats",
            amount: 40,
          },
          {
            foodId: "strawberry",
            amount: 150,
          },
          {
            foodId: "yogurt",
            amount: 230,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "chicken",
            amount: 140,
          },
          {
            foodId: "rice",
            amount: 130,
          },
          {
            foodId: "beans",
            amount: 100,
          },
          {
            foodId: "tomato",
            amount: 30,
          },
          {
            foodId: "oil",
            amount: 15,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 230,
          },
          {
            foodId: "banana",
            amount: 120,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "steak",
            amount: 160,
          },
          {
            foodId: "potato",
            amount: 250,
          },
          {
            foodId: "butter",
            amount: 10,
          },
          {
            foodId: "milk",
            amount: 50,
          },
          {
            foodId: "carrot",
            amount: 100,
          },
          {
            foodId: "oil",
            amount: 14,
          },
        ],
      },
    ],
  },
  {
    day: 5,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "farina",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "yogurt",
            amount: 135,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "beef",
            amount: 140,
          },
          {
            foodId: "bakedPotato",
            amount: 265,
          },
          {
            foodId: "oil",
            amount: 15,
          },
          {
            foodId: "carrot",
            amount: 150,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 285,
          },
          {
            foodId: "apple",
            amount: 150,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "chicken",
            amount: 140,
          },
          {
            foodId: "rice",
            amount: 145,
          },
          {
            foodId: "beans",
            amount: 100,
          },
          {
            foodId: "tomato",
            amount: 30,
          },
          {
            foodId: "oil",
            amount: 15,
          },
        ],
      },
    ],
  },
  {
    day: 6,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "cornmeal",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "banana",
            amount: 100,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "salmon",
            amount: 170,
          },
          {
            foodId: "rice",
            amount: 180,
          },
          {
            foodId: "carrot",
            amount: 150,
          },
          {
            foodId: "oil",
            amount: 3,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 300,
          },
          {
            foodId: "strawberry",
            amount: 150,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "steak",
            amount: 220,
          },
          {
            foodId: "potato",
            amount: 290,
          },
          {
            foodId: "butter",
            amount: 5,
          },
          {
            foodId: "milk",
            amount: 50,
          },
          {
            foodId: "oil",
            amount: 3,
          },
        ],
      },
    ],
  },
  {
    day: 0,
    meals: [
      {
        name: "Desayuno",
        items: [
          {
            foodId: "oats",
            amount: 40,
          },
          {
            foodId: "egg",
            amount: 100,
          },
          {
            foodId: "banana",
            amount: 100,
          },
          {
            foodId: "milk",
            amount: 118,
            coffee: true,
          },
          {
            foodId: "espresso",
            amount: 30,
            coffee: true,
          },
        ],
      },
      {
        name: "Almuerzo",
        items: [
          {
            foodId: "thigh",
            amount: 190,
          },
          {
            foodId: "rice",
            amount: 140,
          },
          {
            foodId: "beans",
            amount: 100,
          },
          {
            foodId: "tomato",
            amount: 30,
          },
          {
            foodId: "oil",
            amount: 8,
          },
        ],
      },
      {
        name: "Merienda",
        items: [
          {
            foodId: "yogurt",
            amount: 290,
          },
          {
            foodId: "strawberry",
            amount: 150,
          },
        ],
      },
      {
        name: "Cena",
        items: [
          {
            foodId: "beef",
            amount: 170,
          },
          {
            foodId: "bakedPotato",
            amount: 265,
          },
          {
            foodId: "oil",
            amount: 8,
          },
          {
            foodId: "carrot",
            amount: 100,
          },
        ],
      },
    ],
  },
];

export const foodById = Object.fromEntries(
  foods.map((food) => [food.id, food]),
) as Record<string, Food>;

export function nutrientsFor(food: Food, amount: number): Nutrients {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error(
      "La cantidad debe ser un número válido mayor o igual a cero.",
    );
  return {
    kcal: (food.kcal * amount) / 100,
    protein: (food.protein * amount) / 100,
    carbs: (food.carbs * amount) / 100,
    fat: (food.fat * amount) / 100,
  };
}

export function menuNutrients(day: DayMenu): Nutrients {
  return day.meals
    .flatMap((meal) => meal.items)
    .reduce(
      (total, item) => {
        const part = nutrientsFor(foodById[item.foodId], item.amount);
        return {
          kcal: total.kcal + part.kcal,
          protein: total.protein + part.protein,
          carbs: total.carbs + part.carbs,
          fat: total.fat + part.fat,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

/** Every recipe remains an ingredient list, so oil, milk and butter are counted. */
export const starterRecipes: {
  id: string;
  name: string;
  items: MealItem[];
  instructions: string;
}[] = [
  {
    id: "coffee",
    name: "Café con leche sin azúcar",
    items: [
      { foodId: "milk", amount: 118, coffee: true },
      { foodId: "espresso", amount: 30, coffee: true },
    ],
    instructions:
      "Añade 118 ml de leche entera al espresso. Referencia genérica provisional: sustituye los nutrientes por la etiqueta de Tres Monjitas.",
  },
  {
    id: "beans-stew",
    name: "Habichuelas con tomate sin sofrito",
    items: [
      { foodId: "beans", amount: 100 },
      { foodId: "tomato", amount: 30 },
      { foodId: "oil", amount: 3 },
    ],
    instructions:
      "Combina las habichuelas cocidas con puré de tomate simple, agua y aceite pesado. Sin cebolla, apio, aceitunas ni sofrito comercial. Ajusta el agua y el peso final de tu receta; registra cada ingrediente.",
  },
  {
    id: "mashed-potato",
    name: "Papa majada con leche y mantequilla",
    items: [
      { foodId: "potato", amount: 250 },
      { foodId: "milk", amount: 50 },
      { foodId: "butter", amount: 10 },
    ],
    instructions:
      "Pesa la papa ya hervida y majada; incorpora por separado la leche y la mantequilla medidas.",
  },
  {
    id: "air-fryer-potato",
    name: "Papas en air fryer con aceite medido",
    items: [
      { foodId: "bakedPotato", amount: 250 },
      { foodId: "oil", amount: 5 },
    ],
    instructions:
      "La papa se pesa cocida y se aproxima con papa al horno USDA. Cuenta todo el aceite añadido que se consume; cambia la referencia si usas peso crudo.",
  },
];
