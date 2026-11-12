# Entrenamiento y biblioteca de demostraciones

El calendario precargado reproduce las cuatro rutinas solicitadas: Upper A el lunes, Lower A el martes, Upper B el jueves y Lower B el viernes. Todos los ejercicios comienzan con **3 series**. Miércoles: 45 minutos de caminata y 10 de movilidad; sábado: 60 minutos de caminata; domingo: descanso, con caminata opcional. El jueves incluye 20 minutos de caminata y 5 intervalos de cuica de 20 segundos, con 60 segundos de descanso configurables.

No hay una fase automática de dos series. Las series de aproximación, si se realizan, deben distinguirse de las series de trabajo.

## Cargas registradas por el usuario

FitTrack no asigna ni sugiere cargas iniciales. El usuario introduce su peso y elige la convención explícita en cada serie:

- **Por mancuerna/mano:** se conserva el peso de una mancuerna para comparar; con dos iguales se calcula también la carga externa total. Si se usa una sola, elegir Total.
- **Discos por cada lado + barra:** el total es dos veces los discos de un lado más el peso real de la barra o la resistencia inicial de la Smith, que debe indicarse; no se asumen45lb.
- **Discos por cada lado:** suma ambos lados sin inventar la resistencia base del trineo. Se identifica el equipo.
- **Total:** el peso indicado por el selector de una máquina o la carga externa total.
- **BW:** sólo resistencia adicional o asistencia. La masa corporal no se suma al volumen externo.

Los registros anteriores sin convención se conservan sin reinterpretarlos. Las gráficas avisan cuando la convención cambia. Las variantes tienen historial propio; no heredan cargas de otro ejercicio. La doble progresión se explica como principio opcional (primero repeticiones, luego carga que se controla), sin aumentos calculados por la aplicación. `recommendLoad` y `trialLb` permanecen exclusivamente por compatibilidad de código y pruebas anteriores; la interfaz no los utiliza para asignar pesos.

## Guías nuevas y variantes

El plan personal original conserva sus tres series. Los cuestionarios nuevos adaptan volumen al tiempo y experiencia, muestran fuentes y requieren confirmación antes de reemplazar planes futuros. El programa híbrido combina movimientos de gimnasio y peso corporal; los estilos incluyen fuerza, circuito, entrenamiento cruzado, mixto y acondicionamiento básico inspirado en CrossFit. El detalle de fases, intervalos y registro real está en el entrenamiento de cada día.

`src/data/exerciseVariants.ts` añade26movimientos con demostraciones del proveedor verificadas por accesoHTTP y presencia de video el12-11-2026. Los58movimientos tienen dos alternativas de función similar, sin afirmar biomecánica idéntica ni equivalencia de cargas. Las variantes avanzadas o con equipo desconocido requieren aprender la técnica; no son una instrucción para forzar un movimiento doloroso. La apertura de la página no certifica reproducción en todos los dispositivos.

## Videos y fuentes

Los enlaces siguientes se abrieron durante la implementación el **8 de noviembre de 2026** y resolvieron a páginas educativas del ejercicio correspondiente. Muscle & Strength publica su propia biblioteca de demostraciones en video; PureGym publica la demostración de agarre neutro. Se revisó también la biblioteca de ACE para referencias técnicas; sus páginas consultadas priorizan fotografías e instrucciones, por lo que no sustituyen el enlace al video.

El botón debe abrir estas páginas en una pestaña nueva, con `rel="noopener noreferrer"`, conservando la sesión de FitTrack. No se incrustan páginas externas completas ni se presupone autorización de embedding. La disponibilidad y reproducción del reproductor externo puede cambiar, depender del consentimiento de cookies o de restricciones del proveedor. La verificación de acceso a la página no equivale a una prueba de reproducción audiovisual de todos los videos en Safari.

| Ejercicio | Página de demostración verificada |
| --- | --- |
| Bench Press | https://www.muscleandstrength.com/exercises/barbell-bench-press.html |
| Lat Pulldown | https://www.muscleandstrength.com/exercises/lat-pull-down.html |
| Incline Dumbbell Press | https://www.muscleandstrength.com/exercises/incline-dumbbell-bench-press.html |
| Seated Cable Row | https://www.muscleandstrength.com/exercises/seated-row.html |
| Lateral Raises | https://www.muscleandstrength.com/exercises/dumbbell-lateral-raise.html |
| Rope Triceps Pushdown | https://www.muscleandstrength.com/exercises/rope-tricep-extension.html |
| Dumbbell Biceps Curl | https://www.muscleandstrength.com/exercises/standing-dumbbell-curl.html |
| Hack Squat | https://www.muscleandstrength.com/exercises/hack-squat.html |
| Romanian Deadlift | https://www.muscleandstrength.com/exercises/romanian-deadlift |
| Bulgarian Split Squat | https://www.muscleandstrength.com/exercises/one-leg-dumbbell-squat-aka-bulgarian-squat.html |
| Seated Leg Curl | https://www.muscleandstrength.com/exercises/seated-leg-curl |
| Standing Calf Raises | https://www.muscleandstrength.com/exercises/standing-machine-calf-raise |
| Cable Crunch | https://www.muscleandstrength.com/exercises/cable-crunch.html |
| Incline Bench Press | https://www.muscleandstrength.com/exercises/incline-bench-press.html |
| Chest-Supported Row | https://www.muscleandstrength.com/node/48713 |
| Push-Ups | https://www.muscleandstrength.com/exercises/push-up.html |
| Neutral-Grip Lat Pulldown | https://www.puregym.com/exercises/back/lat-exercises/close-grip-lat-pulldown/ |
| Machine Shoulder Press | https://www.muscleandstrength.com/exercises/machine-shoulder-press |
| Rear Delt Fly (banco inclinado) | https://www.muscleandstrength.com/exercises/dumbbell-reverse-fly-on-incline-bench.html |
| Overhead Triceps Extension (polea alta y cuerda) | https://www.muscleandstrength.com/exercises/overhead-tricep-extension.html |
| Hammer Curl | https://www.muscleandstrength.com/exercises/standing-hammer-curl.html |
| Leg Press | https://www.muscleandstrength.com/exercises/45-degree-leg-press.html |
| Hip Thrust | https://www.muscleandstrength.com/exercises/barbell-hip-thrust |
| Lying Leg Curl | https://www.muscleandstrength.com/exercises/leg-curl.html |
| Leg Extension | https://www.muscleandstrength.com/exercises/leg-extension.html |
| Seated Calf Raises | https://www.muscleandstrength.com/exercises/seated-calf-raise.html |
| Pallof Press | https://www.muscleandstrength.com/exercises/pallof-press |

Referencias de técnica de ACE:

- https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/
- https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/
- https://www.acefitness.org/certifiednewsarticle/2884/ace-sponsored-research-top-3-most-effective-chest-exercises/

Las instrucciones en español son síntesis originales breves, no transcripciones de los proveedores. Detener una repetición ante dolor agudo y ajustar el recorrido o la carga; usar topes o compañero para presses con barra. El catálogo incluye dos pautas y dos errores comunes por ejercicio.

## Distribución por propósito y orientación de frecuencia

La guía moderna diferencia los días por función (fuerza, patrón dominante, técnica de circuito, base aeróbica, intervalos controlados o recuperación). Mantiene movimientos principales entre semanas para comparar registros; la variedad no consiste en cambiar ejercicios al azar. Las elecciones se restringen al equipo, experiencia y modalidades declaradas, con presupuesto explícito de tiempo.

La **disponibilidad** determina el calendario real. La **frecuencia orientativa** es una regla de organización de FitTrack, basada en meta, experiencia, actividad fuera del entrenamiento, minutos por sesión y variedad de actividades; puede ser mayor o menor que los días disponibles. No es una frecuencia óptima demostrada para una persona ni un requisito universal de CrossFit o entrenamiento cruzado. Se explica el motivo, cómo se adapta la semana y qué función tendría un día adicional; no se añaden obligaciones fuera de la agenda elegida.

ACSM 2026 respalda fuerza regular para los grandes grupos musculares al menos dos días por semana y la individualización del volumen, sin establecer que todos los estilos requieran cinco sesiones. La orientación de CrossFit distingue capacidad y recuperación; no se utiliza su cadencia como una regla universal para todos los usuarios: https://www.crossfit.com/essentials/how-often-should-i-do-crossfit .

Las cuentas que ya tienen una guía generada pueden abrir **Revisar distribución mejorada** en Hoy: se presenta una propuesta usando sus respuestas guardadas. Solo al confirmar se reemplazan los planes futuros. No se modifica una sesión iniciada, un registro histórico ni un programa manual de forma silenciosa. La nueva distribución guarda `guideDesignVersion:3` y su orientación de frecuencia en el perfil.
