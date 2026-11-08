# Datos nutricionales y menú inicial

Los valores provienen de registros reales del archivo oficial USDA FoodData Central SR Legacy, edición final de abril de 2018, descargado y leído el 8 de noviembre de 2026. No se inventaron calorías para alcanzar una suma predeterminada. Cada alimento conserva su identificador FDC y enlace de origen; todos los totales se obtienen multiplicando sus nutrientes por la cantidad / 100.

Fuentes primarias:

- [USDA FoodData Central: descargas](https://fdc.nal.usda.gov/download-datasets/).
- [Archivo JSON SR Legacy utilizado](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip).
- [Documentación USDA SR Legacy](https://www.ars.usda.gov/arsuserfiles/80400525/data/sr-legacy/sr-legacy_doc.pdf).

## Totales del menú precargado

Incluyen un café diario, todo el aceite, la leche adicional y la mantequilla descritos. Son totales planificados, nunca consumo automático. Las porciones se ajustaron respecto a las referencias originales para aproximar 2,100 kcal y 170 g de proteína. Es un punto de partida configurable y no una estimación confirmada del mantenimiento del usuario.

| Día | kcal | Proteína, g | Carbohidratos, g | Grasas, g |
| --- | ---: | ---: | ---: | ---: |
| Lunes | 2100.2 | 170.1 | 210.9 | 64.3 |
| Martes | 2098.5 | 169.2 | 212.2 | 63.9 |
| Miércoles | 2096.8 | 169.0 | 206.8 | 65.9 |
| Jueves | 2095.5 | 170.1 | 211.7 | 63.7 |
| Viernes | 2097.6 | 169.0 | 209.4 | 63.9 |
| Sábado | 2099.8 | 169.9 | 206.9 | 64.6 |
| Domingo | 2103.1 | 170.5 | 208.7 | 65.0 |

Las diferencias respecto a 2,100 kcal son intencionales: se preservan los nutrientes reales y cantidades prácticas. Las calorías publicadas por USDA no siempre equivalen exactamente a 4 × proteína + 4 × carbohidratos + 9 × grasas por sus métodos de cálculo, fibra y redondeo; la aplicación utiliza la energía publicada, sin forzar equivalencias.

## Pesos y preparación

- Arroz, carnes, pescado, habichuelas y papas: peso de la parte comestible ya cocida según la entrada seleccionada.
- Avena, farina, harina de maíz y maicena: peso seco. Preparar con agua. Si se usa leche o se añade azúcar, registrarlos por separado.
- Huevos: referencia hervida, aproximadamente 50 g comestibles por huevo grande. Los huevos fritos requieren el registro adicional del aceite; esta referencia no incluye aceite.
- Yogur: natural, sin grasa y sin azúcar añadido. Si el yogur real tiene otros valores, editar la etiqueta antes de utilizarlo.
- La carne molida es 95 % magra / 5 % grasa, pesada cocida y escurrida. No representa una carne 80/20 o 90/10.
- Papas en air fryer: referencia USDA de papa cocida al horno con piel; se pesa después de cocinar. Es una aproximación declarada por la variación de agua entre preparaciones. El aceite se registra aparte.
- El majado desglosa papa hervida, leche y mantequilla, cada una con su cantidad real.
- Las habichuelas se desglosan en habichuelas cocidas, puré de tomate simple y aceite; no se atribuye una composición exacta a cualquier guiso comercial. El aceite incluido en cada almuerzo es el total de esa preparación, no un aceite adicional oculto.
- Usar puré de tomate que solamente contenga tomate y, si se desea, sal. Verificar que no incluya cebolla ni apio. No utilizar sofritos o salsas con ingredientes excluidos. Ningún menú contiene espárragos, aceitunas, brócoli, coliflor, cebolla, apio ni otros pescados distintos al salmón y el atún.
- El pan francés es una referencia genérica opcional para alimentos favoritos; el pan casero debe calcularse con sus ingredientes y rendimiento real.

## Café y unidades de leche

El registro de leche es una **referencia genérica provisional**, no una etiqueta verificada de Tres Monjitas. Debe sustituirse por la etiqueta del envase real. El registro USDA 171265 declara 30.5 g de leche por una onza líquida estadounidense; utilizando 1 fl oz = 29.5735295625 ml se transforma de valores por 100 g a valores por 100 ml con un factor de 1.03132766. El espresso (FDC 171891) declara 29.6 g/fl oz y usa su propio factor.

Una taza precargada contiene 118 ml de leche y 30 ml de espresso sin azúcar: aproximadamente **76.9 kcal**. La leche y el espresso se guardan como ingredientes separados con `coffee: true`, lo que permite cambiar la leche sin alterar el espresso. Una segunda taza suma otra porción completa; la interfaz debe registrarla con un identificador nuevo y evitar repetir la misma operación por reintentos de sincronización.

## Catálogo verificable

Valores por 100 de la unidad indicada. Los enlaces llevan al registro USDA exacto. Las etiquetas de alimentos comerciales siempre tienen prioridad para el producto consumido.

| Alimento | Unidad | kcal | P, g | C, g | G, g | FDC |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Arroz blanco | g | 130.00 | 2.69 | 28.20 | 0.28 | [168878](https://fdc.nal.usda.gov/food-details/168878/nutrients) |
| Habichuelas rojas | g | 127.00 | 8.67 | 22.80 | 0.50 | [173740](https://fdc.nal.usda.gov/food-details/173740/nutrients) |
| Tomate triturado sin cebolla | g | 38.00 | 1.65 | 8.98 | 0.21 | [170460](https://fdc.nal.usda.gov/food-details/170460/nutrients) |
| Pechuga de pollo sin piel | g | 165.00 | 31.00 | 0.00 | 3.57 | [171477](https://fdc.nal.usda.gov/food-details/171477/nutrients) |
| Caderas de pollo sin piel | g | 179.00 | 24.80 | 0.00 | 8.15 | [172388](https://fdc.nal.usda.gov/food-details/172388/nutrients) |
| Carne molida 95 % magra | g | 193.00 | 29.20 | 0.00 | 7.58 | [174028](https://fdc.nal.usda.gov/food-details/174028/nutrients) |
| Bistec de sirloin magro | g | 183.00 | 30.60 | 0.00 | 5.79 | [168634](https://fdc.nal.usda.gov/food-details/168634/nutrients) |
| Salmón atlántico | g | 206.00 | 22.10 | 0.00 | 12.40 | [175168](https://fdc.nal.usda.gov/food-details/175168/nutrients) |
| Atún claro en agua | g | 86.00 | 19.40 | 0.00 | 0.96 | [173709](https://fdc.nal.usda.gov/food-details/173709/nutrients) |
| Papa para majado | g | 86.00 | 1.71 | 20.00 | 0.10 | [170440](https://fdc.nal.usda.gov/food-details/170440/nutrients) |
| Papa para air fryer | g | 93.00 | 2.50 | 21.20 | 0.13 | [170093](https://fdc.nal.usda.gov/food-details/170093/nutrients) |
| Avena | g | 379.00 | 13.20 | 67.70 | 6.52 | [173904](https://fdc.nal.usda.gov/food-details/173904/nutrients) |
| Farina | g | 369.00 | 10.60 | 78.00 | 0.50 | [173916](https://fdc.nal.usda.gov/food-details/173916/nutrients) |
| Harina de maíz integral amarilla | g | 362.00 | 8.12 | 76.90 | 3.59 | [169697](https://fdc.nal.usda.gov/food-details/169697/nutrients) |
| Yogur griego natural sin grasa | g | 59.00 | 10.20 | 3.60 | 0.39 | [170894](https://fdc.nal.usda.gov/food-details/170894/nutrients) |
| Guineo | g | 89.00 | 1.09 | 22.80 | 0.33 | [173944](https://fdc.nal.usda.gov/food-details/173944/nutrients) |
| Fresas | g | 32.00 | 0.67 | 7.68 | 0.30 | [167762](https://fdc.nal.usda.gov/food-details/167762/nutrients) |
| Arándanos | g | 57.00 | 0.74 | 14.50 | 0.33 | [171711](https://fdc.nal.usda.gov/food-details/171711/nutrients) |
| Manzana con piel | g | 52.00 | 0.26 | 13.80 | 0.17 | [171688](https://fdc.nal.usda.gov/food-details/171688/nutrients) |
| Huevos | g | 155.00 | 12.60 | 1.12 | 10.60 | [173424](https://fdc.nal.usda.gov/food-details/173424/nutrients) |
| Leche entera (genérica provisional) | ml | 62.91 | 3.25 | 4.95 | 3.35 | [171265](https://fdc.nal.usda.gov/food-details/171265/nutrients) |
| Espresso sin azúcar | ml | 9.01 | 0.12 | 1.67 | 0.18 | [171891](https://fdc.nal.usda.gov/food-details/171891/nutrients) |
| Aceite de canola | g | 884.00 | 0.00 | 0.00 | 100.00 | [172336](https://fdc.nal.usda.gov/food-details/172336/nutrients) |
| Mantequilla sin sal | g | 717.00 | 0.85 | 0.06 | 81.10 | [173430](https://fdc.nal.usda.gov/food-details/173430/nutrients) |
| Almendras | g | 579.00 | 21.20 | 21.60 | 49.90 | [170567](https://fdc.nal.usda.gov/food-details/170567/nutrients) |
| Zanahoria | g | 35.00 | 0.76 | 8.22 | 0.18 | [170394](https://fdc.nal.usda.gov/food-details/170394/nutrients) |
| Calabacín | g | 15.00 | 1.14 | 2.69 | 0.36 | [169292](https://fdc.nal.usda.gov/food-details/169292/nutrients) |
| Pan francés (referencia para pan casero) | g | 272.00 | 10.80 | 51.90 | 2.42 | [172675](https://fdc.nal.usda.gov/food-details/172675/nutrients) |
| Maicena | g | 381.00 | 0.26 | 91.30 | 0.05 | [169698](https://fdc.nal.usda.gov/food-details/169698/nutrients) |

## Comprobaciones reproducibles

1. `nutrientsFor(foodById.rice, 185)` produce 240.5 kcal, 4.9765 g proteína, 52.17 g carbohidratos y 0.518 g grasa.
2. `menuNutrients(day)` suma los ingredientes sin modificar valores de origen y sin redondear cada ingrediente antes de la suma.
3. El menú contiene exactamente cuatro comidas por día y siete días únicos (domingo = 0).
4. Las cantidades planificadas y consumidas son datos distintos: cambiar un registro real a 185 g no cambia los 125–180 g del menú base ni otros días.
5. Los registros históricos deben conservar una copia de los nutrientes utilizados al registrar el consumo, de modo que editar el catálogo no cambie el pasado.
