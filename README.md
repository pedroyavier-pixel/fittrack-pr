# FitTrack PR

> Aplicación publicada en https://pedroyavier-pixel.github.io/fittrack-pr/. Código completo, base de datos y autenticación configurados. Las pruebas de privacidad transaccionales de las 15 tablas están aprobadas. Ver `docs/VALIDATION.md` y `docs/QA.md` para evidencia y alcance de las comprobaciones.

Aplicación personal de entrenamiento, nutrición y progreso en español. React + TypeScript + Vite + Tailwind + Supabase Auth/Postgres/Storage + Recharts. Alojamiento estático en GitHub Pages, con PWA y cola local de sincronización.

## Usar la aplicación

1. Abre https://pedroyavier-pixel.github.io/fittrack-pr/.
2. Crea tu cuenta con tu correo y una contraseña de al menos 8 caracteres. Confirma el correo y entra. También puedes solicitar un enlace de acceso.
3. En **Ajustes**, revisa fecha de inicio, unidades, objetivos y programa semanal.
4. **Hoy** muestra el día de Puerto Rico. **Entrenar** inicia o recupera tu sesión. **Comidas** registra gramos reales. **Historial** consulta y edita cualquier fecha. **Progreso** guarda peso, cintura y fotos privadas.
5. En Safari de iPhone: Compartir → Añadir a pantalla de inicio. La primera carga y el inicio de sesión necesitan conexión. Abre la app conectada una vez para precargar los archivos.

Las porciones planificadas nunca cuentan automáticamente como consumidas. El café se confirma por taza; la leche inicial usa una referencia USDA genérica provisional y se puede sustituir por la etiqueta real de Tres Monjitas. Los objetivos iniciales son una prueba ajustable: 2,100 kcal / 170 P / 210 C / 64 G. Esos macros equivalen a 2,096 kcal por redondeo; el menú utiliza nutrientes reales sin forzar cifras.

## Desarrollo local

Requiere Node 22 o posterior.

```bash
npm ci --ignore-scripts
npm run dev
npm test
npm run build
```

Para conectar otro proyecto, copia `.env.example` a `.env.local` y reemplaza sus valores. La configuración de este proyecto funciona sin crear ese archivo.

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
| `src/components/Workout.tsx` | Sesiones, series, descanso, variantes, cargas explícitas y cardio |
| `src/components/Nutrition.tsx` | Menú, cantidades reales, cafés, etiquetas, recetas y frecuentes |
| `src/components/Progress.tsx` | Peso, cintura, fotos privadas y promedio móvil |
| `src/components/History.tsx` | Calendario, filtros, edición, fuerza y exportación |
| `src/components/Settings.tsx` | Perfil, objetivos y editores semanales |
| `src/data/` | Rutina y menú iniciales con fuentes verificables |
| `supabase/` | Esquema, migraciones y pruebas de seguridad |
| `tests/` | Casos de fecha, cálculo, progresión y recuperación de datos |

Las tablas son relacionales por propietario y entidades padre/hijo; el contenido variable se guarda en `data` JSONB. Las sesiones y los consumos contienen snapshots de ejercicios, nutrientes y objetivos. Editar un catálogo o plan no modifica esos snapshots. El plan inicial está versionado en el código y los ajustes personales viven en la base de datos.

## Guardado y límites de sincronización

Cada entrada se escribe primero en almacenamiento local por cuenta. La caché durable conserva los últimos 30 días calendario de Puerto Rico, la configuración y todos los cambios pendientes, incluso si corresponden a fechas anteriores. El historial completo permanece en Supabase y se recupera al abrir con conexión; durante esa sesión se consultan cambios incrementales con paginación por fecha de actualización e identificador. La cola usa UUID estables y `upsert`, por lo que reenviar una serie no crea otra copia. Conserva cambios pendientes al perder la conexión o cerrar el navegador. La aplicación sincroniza al volver a estar online, recuperar foco, cada 30 segundos y tras eventos Realtime.

- Los errores de guardado muestran un aviso y un reintento. No cierres sesión con cambios pendientes.
- Para consultar fechas anteriores a los 30 días después de reabrir la app, necesitas conexión.
- El almacenamiento local puede perderse si borras los datos del navegador o el sistema los elimina. Las entradas ya sincronizadas permanecen en Supabase. Exporta JSON o CSV periódicamente.
- Ediciones simultáneas de **la misma entrada** en dos dispositivos utilizan la última escritura que llega al servidor. Para evitar conflictos, no edites la misma serie o alimento a la vez en ambos.
- Las fotos necesitan conexión y no se precargan ni comparten públicamente; se consultan mediante URLs firmadas de 15 minutos. Eliminar una medición la oculta mediante tombstone, sin purgar físicamente la foto, para permitir recuperación administrativa.
- El reloj se actualiza cada segundo y al regresar desde segundo plano. Una sesión de fuerza conserva la fecha de inicio. Los formularios en edición conservan su fecha de registro; al cambiar de fecha visualmente no se borran registros.
- La carga la introduce el usuario con su convención explícita. No se sugieren pesos automáticamente. Las cargas de máquinas requieren comparar el mismo equipo.
- Los enlaces abren las demostraciones externas en otra pestaña, conservando la sesión. La disponibilidad y las reglas de reproducción del proveedor pueden cambiar.

## Nutrición y entrenamiento

Consulta [NUTRITION.md](docs/NUTRITION.md) para alimentos, metodología de cálculo y totales de los siete días; [TRAINING.md](docs/TRAINING.md) contiene fuentes de técnica, videos y criterios de carga. No se deduce grasa corporal a partir del peso ni se descuentan las calorías del ejercicio. La media móvil describe tendencias, sin interpretar una variación diaria como grasa ganada o perdida.

## Mantenimiento

Mantén el lockfile y revisa actualizaciones antes de publicarlas. Ejecuta `npm test` y `npm run build` tras cambiar código. Ejecuta las pruebas RLS y Security Advisor tras cambiar la base de datos. Actualiza la documentación nutricional al sustituir datos USDA o etiquetas. Revisa periódicamente que los videos sigan disponibles. Usa backups de Supabase y exportaciones para conservar registros a largo plazo.


## Notificaciones directas de FitTrack

En iPhone, añade FitTrack a la pantalla de inicio, ábrela desde el icono y entra en Ajustes → Perfil y objetivos → Recordatorios de entrenamiento. Pulsa Activar notificaciones y permite el aviso de iOS. Puedes enviar un aviso de prueba o desactivar este dispositivo. Se desactivan también al cerrar sesión.

El servidor comprueba los días de fuerza (por defecto lunes, martes, jueves y viernes), a las 17:00 y 20:00 en America/Puerto_Rico. Omite avisos si hay una serie completada, cardio o sesión finalizada en esa fecha. Los registros aún sin sincronizar no son visibles. Cada dispositivo recibe como máximo un aviso por horario y fecha; los endpoints caducados se deshabilitan. iOS puede silenciar o retrasar mensajes por Concentración, conexión o ajustes de notificaciones.

La función `supabase/functions/fittrack-push` verifica el JWT del usuario para las pruebas y un secreto del servidor para cron. La verificación JWT de la pasarela está desactivada porque la autenticación se hace dentro de la función; las solicitudes anónimas son rechazadas. La tabla `fittrack_push_config` y las entregas son accesibles únicamente desde el servidor. El navegador y este repositorio solo contienen la clave VAPID pública. No exportes la clave privada, el token de cron ni las suscripciones de dispositivos. En instalaciones nuevas, genera tu propio par ECDSA P-256, guárdalo en la configuración privada y actualiza la clave pública de `src/lib/push.ts`. Las pruebas SQL nuevas están en `supabase/tests/push.sql`.

Los mensajes Web Push no llevan datos personales ni contenido: el service worker muestra el texto localmente. Los servidores push de Apple/Google/Mozilla reciben únicamente una solicitud autenticada con VAPID. La entrega real debe verificarse en cada teléfono con el botón de prueba.


## Guía personalizada por cuenta

Las cuentas nuevas completan un cuestionario de opciones cerradas y revisan su propuesta antes de guardarla. Las cuentas existentes pueden abrir **Hoy → Personalizar mi guía** o **Ajustes → Perfil y objetivos → Personalizar mi guía**. La rutina personal y el historial existentes se conservan hasta confirmar un cambio.

El motor local `src/lib/personalization.ts` usa reglas explícitas: meta, experiencia, actividad diaria, equipo, días elegidos y tiempo por sesión. La edad y un aviso general sobre necesidad de adaptación determinan el alcance; no se solicitan diagnósticos. El peso es voluntario y no se usa para calcular fuerza, un déficit ni metas de peso. El horizonte deseado no genera una cuenta regresiva ni una promesa de resultados. Las referencias están en la interfaz: ACSM 2026, OMS y Harvard. Respaldan principios generales; no representan una validación clínica de cada rutina ni una evaluación profesional.

La versión actual orienta a adultos. En menores de edad o cuando hay dudas o necesidad de adaptación profesional, mantiene registro manual y fuentes generales sin generar una rutina. Si hay necesidades alimentarias clínicas, no genera menú. El catálogo doméstico incluye demostraciones verificadas de CSP, NHS, NASM y Muscle & Strength. Sin resistencia externa se explicita la limitación para entrenar espalda; no se presenta como un programa completo para todos los objetivos.

`src/data/mealSuggestions.ts` ofrece ideas editables de siete días, con ingredientes separados, porciones ilustrativas, preferencias variadas/vegetarianas/vegetales y exclusiones de catálogo. No prescribe dieta, calorías ni suficiencia nutricional. Los filtros no certifican ausencia de alérgenos o contacto cruzado. La variedad vegetal es limitada por el catálogo y se informa en pantalla. El café con leche permanece en el plan original de las cuentas que ya lo tenían; no se impone a las demás.

Las cuentas nuevas registran consumo sin un objetivo numérico asignado. Pueden activar referencias numéricas propias o de un profesional en Ajustes. Los objetivos ya configurados permanecen. Los registros guardan el estado del objetivo de ese momento y siguen mostrando sus snapshots históricos.

La aplicación guarda el conjunto de la nueva guía una vez en la cola local, con rollback si falla el almacenamiento. Se sincroniza después con UUID estables y las mismas políticas RLS por propietario; actualiza también las relaciones de los planes. Nunca reescribe sesiones iniciadas, series completadas, consumos ni mediciones anteriores. Al cerrar sesión con la cola vacía se elimina la copia local de esa cuenta y su temporizador, manteniendo los datos del servidor.

### Privacidad y límites

Las respuestas están en `fittrack_user_profiles.data.personalization`, protegidas por las políticas de propietario existentes. No se envían a ningún servicio de IA ni se publican en GitHub. Se utiliza HTTPS y almacenamiento privado para fotos, pero no cifrado de extremo a extremo ni cifrado adicional de la caché del navegador. Administradores autorizados y el proveedor de infraestructura pueden tener acceso técnico. Ningún sistema ofrece seguridad absoluta. No se afirma cumplimiento de una norma legal o certificación sanitaria específica.

El usuario puede editar respuestas y exportar sus registros. No se añade publicidad ni intercambio entre cuentas. Los datos pendientes sin sincronizar dependen de la conservación del almacenamiento del dispositivo.

Antes de abrir el registro a público externo, valida el envío real de confirmaciones a direcciones ajenas al equipo de Supabase y configura SMTP propio si corresponde. El servicio de correo integrado de Supabase restringe destinatarios y no está destinado a producción; ver https://supabase.com/docs/guides/auth/auth-smtp. No se deshabilita la confirmación del correo para evitar esta limitación. Esta entrega verifica el cuestionario y el guardado con datos de prueba, no la entrega de correo a una nueva cuenta externa.

## Cuestionario ampliado, cargas y cocina de Puerto Rico

La versión2 pregunta por sexo biológico, meta, entorno (gimnasio/casa/híbrido), estilo, actividades de cardio, impacto, acceso al equipo y restricciones alimentarias. El sexo no predice fuerza ni asigna cargas; las limitaciones y necesidades de adaptación requieren valoración individual. Las respuestas antiguas conservan su programa hasta confirmar otra guía.

El catálogo muestra **Dos variantes** por movimiento, con técnica y equipo. Son alternativas de función similar, sin equivalencia exacta de carga, recorrido o demanda. Una sustitución utiliza su propio historial y nunca hereda automáticamente el peso del ejercicio anterior. No hay peso sugerido automático. Cada serie indica total, por mano, discos por lado o discos por lado más barra real. Para dos mancuernas iguales se almacena también la carga externa total. Las filas históricas sin convención no se reinterpretan. Las gráficas advierten cuando hay convenciones distintas.

El planificador distribuye calentamiento, fuerza o acondicionamiento, cardio y vuelta a la calma dentro de los minutos seleccionados. Los circuitos y EMOM guardan duración real, vueltas, esfuerzo y notas; su cronómetro se recupera al reabrir. No generan series ficticias ni duplican automáticamente volumen de fuerza. CrossFit se presenta como acondicionamiento básico inspirado en sus principios, sin afiliación ni WOD avanzado. “Mixto” combina bloques de fuerza y cardio y no representa un protocolo de marca MixFit.

Las recetas de inspiración puertorriqueña usan ingredientes individuales del catálogo verificable y sus cantidades reales. Las adaptaciones respetan las exclusiones seleccionadas; ningún filtro certifica etiquetas ni contacto cruzado. El asistente conversacional de recetas funciona con reglas locales y contexto de ingredientes, sin enviar conversaciones a una IA externa. Sugiere preparaciones y sustitutos, permite ajustar porciones y guardarlas; no prescribe dietas ni evalúa necesidades clínicas. Las referencias bibliográficas y los materiales abiertos se muestran en Alcance, fuentes y privacidad. No se afirma haber consultado el texto completo de los libros comerciales.
