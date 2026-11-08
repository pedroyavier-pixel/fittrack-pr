# FitTrack PR

> Estado de esta entrega: código completo publicado y despliegue de GitHub Pages aprobado. Las 21 pruebas y el build pasaron también en GitHub Actions. Falta completar el acceso al panel de Supabase para configurar la URL de retorno del correo y verificar el primer inicio de sesión real. Ver `docs/VALIDATION.md`.

Aplicación personal de entrenamiento, nutrición y progreso en español. React + TypeScript + Vite + Tailwind + Supabase Auth/Postgres/Storage + Recharts. Alojamiento estático en GitHub Pages, con PWA y cola local de sincronización.

## Usar la aplicación

1. Abre https://pedroyavier-pixel.github.io/fittrack-pr/.
2. Crea tu cuenta con tu correo y una contraseña de al menos 8 caracteres. Confirma el correo y entra. También puedes solicitar un enlace de acceso.
3. En **Ajustes**, revisa fecha de inicio, unidades, objetivos y cargas habituales.
4. **Hoy** muestra el día de Puerto Rico. **Entrenar** inicia o recupera tu sesión. **Comidas** registra gramos reales. **Historial** consulta y edita cualquier fecha. **Progreso** guarda peso, cintura y fotos privadas.
5. En Safari de iPhone: Compartir → Añadir a pantalla de inicio. La primera carga y el inicio de sesión necesitan conexión. Abre la app conectada una vez para precargar los archivos.

Las porciones planificadas nunca cuentan automáticamente como consumidas. El café se confirma por taza; la leche inicial usa una referencia USDA genérica provisional y se puede sustituir por la etiqueta real de Tres Monjitas. Los objetivos iniciales son una prueba ajustable: 2,100 kcal / 170 P / 210 C / 64 G. Esos macros equivalen a 2,096 kcal por redondeo; el menú utiliza nutrientes reales sin forzar cifras.

## Desarrollo local

Requiere Node 22 o posterior.

```bash
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
npm test
npm run build
```

`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` son valores públicos del cliente, protegidos por autenticación y RLS. Nunca uses claves `service_role`, `sb_secret_…`, tokens administrativos ni contraseñas en variables `VITE_…`.

Este repositorio ya incluye como alternativa la URL y la clave **publishable** de su proyecto de FitTrack. Para conectar otro proyecto, usa las variables; no necesitas modificar el código. Los registros y las fotos personales no se incluyen en GitHub.

## Base de datos y autenticación

El proyecto de Supabase `fittrack-pr` ya está creado. El esquema usa el prefijo `fittrack_` y 15 tablas con propietarios, índices, timestamps, relaciones entre entidades y políticas RLS. Ver [DATABASE.md](docs/DATABASE.md) y [schema.sql](supabase/schema.sql).

Para una instalación nueva:

1. Crea un proyecto Supabase.
2. Aplica la migración de `supabase/migrations/` una sola vez mediante Supabase CLI o ejecuta `supabase/schema.sql` una vez en el editor SQL. El script crea tablas nuevas; no lo ejecutes de nuevo sobre una instalación ya creada.
3. En Authentication → URL Configuration, configura **Site URL** como la URL final de Pages con barra final y añade esa misma URL a Redirect URLs. Para desarrollo puedes añadir `http://localhost:5173/fittrack-pr/`.
4. Mantén habilitado el proveedor Email y la confirmación del correo. Para enviar correos a otras cuentas con fiabilidad configura un SMTP propio según los límites de tu plan; la app no contiene un proveedor de envío de terceros.
5. Usa la clave publishable del proyecto en las variables de entorno.
6. Comprueba Security Advisor y las pruebas RLS de `supabase/tests/` antes de usar datos reales.

## Publicación en GitHub Pages

En Settings → Pages, selecciona **GitHub Actions**. El workflow `.github/workflows/deploy.yml` instala las versiones del lockfile, ejecuta pruebas y TypeScript, compila y publica `dist/` con HTTPS. Cada push a `main` actualiza la aplicación.

Variables opcionales del repositorio (Settings → Secrets and variables → Actions → Variables):

| Variable | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública `sb_publishable_…` |

`VITE_BASE_PATH` se calcula a partir del nombre del repositorio. Para un dominio raíz, usa `/`. La navegación de la app es interna, sin rutas que provoquen 404 en Pages. Manifest y service worker usan rutas relativas a la aplicación. El script de build genera el precache con los archivos compilados y una versión derivada de sus hashes.

## Arquitectura

| Ruta | Responsabilidad |
| --- | --- |
| `src/App.tsx` | Autenticación, navegación, reloj PR, dashboard y día seleccionado |
| `src/lib/time.ts` | Fecha y hora siempre en America/Puerto_Rico |
| `src/lib/store.ts` | Caché por usuario, cola durable, reconciliación, paginación, Realtime y reintentos |
| `src/lib/model.ts` | Objetivos, catálogos, planes y cálculo proporcional |
| `src/components/Workout.tsx` | Sesiones, series, descanso, sugerencias y cardio |
| `src/components/Nutrition.tsx` | Menú, cantidades reales, cafés, etiquetas, recetas y frecuentes |
| `src/components/Progress.tsx` | Peso, cintura, fotos privadas y promedio móvil |
| `src/components/History.tsx` | Calendario, filtros, edición, fuerza y exportación |
| `src/components/Settings.tsx` | Perfil, objetivos y editores semanales |
| `src/data/` | Rutina y menú iniciales con fuentes verificables |
| `supabase/` | Esquema, migraciones y pruebas de seguridad |
| `tests/` | Casos de fecha, cálculo, progresión y recuperación de datos |

Las tablas son relacionales por propietario y entidades padre/hijo; el contenido variable se guarda en `data` JSONB. Las sesiones y los consumos contienen snapshots de ejercicios, nutrientes y objetivos. Editar un catálogo o plan no modifica esos snapshots. El plan inicial está versionado en el código y los ajustes personales viven en la base de datos.

## Guardado y límites de sincronización

Cada entrada se escribe primero en almacenamiento local por cuenta. La cola usa UUID estables y `upsert`, por lo que reenviar una serie no crea otra copia. Conserva cambios pendientes al perder la conexión o cerrar el navegador. La aplicación sincroniza al volver a estar online, recuperar foco, cada 30 segundos y tras eventos Realtime.

- Los errores de guardado muestran un aviso y un reintento. No cierres sesión con cambios pendientes.
- El almacenamiento local puede perderse si borras los datos del navegador o el sistema los elimina. Las entradas ya sincronizadas permanecen en Supabase. Exporta JSON o CSV periódicamente.
- Ediciones simultáneas de **la misma entrada** en dos dispositivos utilizan la última escritura que llega al servidor. Para evitar conflictos, no edites la misma serie o alimento a la vez en ambos.
- Las fotos necesitan conexión y no se precargan ni comparten públicamente; se consultan mediante URLs firmadas de 15 minutos. Eliminar una medición la oculta mediante tombstone, sin purgar físicamente la foto, para permitir recuperación administrativa.
- El reloj se actualiza cada segundo y al regresar desde segundo plano. Una sesión de fuerza conserva la fecha de inicio. Los formularios en edición conservan su fecha de registro; al cambiar de fecha visualmente no se borran registros.
- Las sugerencias de fuerza son opcionales. El aumento sólo se sugiere con todas las series al extremo superior, técnica confirmada y RIR suficiente. Las cargas de máquinas requieren comparar el mismo equipo.
- Los enlaces abren las demostraciones externas en otra pestaña, conservando la sesión. La disponibilidad y las reglas de reproducción del proveedor pueden cambiar.

## Nutrición y entrenamiento

Consulta [NUTRITION.md](docs/NUTRITION.md) para alimentos, metodología de cálculo y totales de los siete días; [TRAINING.md](docs/TRAINING.md) contiene fuentes de técnica, videos y criterios de carga. No se deduce grasa corporal a partir del peso ni se descuentan las calorías del ejercicio. La media móvil describe tendencias, sin interpretar una variación diaria como grasa ganada o perdida.

## Mantenimiento

Mantén el lockfile y revisa actualizaciones antes de publicarlas. Ejecuta `npm test` y `npm run build` tras cambiar código. Ejecuta las pruebas RLS y Security Advisor tras cambiar la base de datos. Actualiza la documentación nutricional al sustituir datos USDA o etiquetas. Revisa periódicamente que los videos sigan disponibles. Usa backups de Supabase y exportaciones para conservar registros a largo plazo.
