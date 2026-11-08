# Verificación de FitTrack PR

Estado al 8 de noviembre de 2026. La aplicación está implementada y compila. La base está aplicada y el código completo está en [pedroyavier-pixel/fittrack-pr](https://github.com/pedroyavier-pixel/fittrack-pr). La sesión del navegador permitió publicarlo después del error HTTP 403 de la conexión API. **GitHub Pages está publicado con HTTPS** en https://pedroyavier-pixel.github.io/fittrack-pr/. El despliegue inicial y la actualización de persistencia terminaron con build y deploy exitosos. La [actualización del historial](https://github.com/pedroyavier-pixel/fittrack-pr/actions/runs/42496269926), commit `0c0f9eec813be01a5fdc30eb652101e3a64f56b8`, pasó sus pruebas, build y deploy. La comprobación local final incluye 25 pruebas. La URL final se abrió y mostró correctamente la interfaz de acceso.

El panel web de Supabase se abrió mediante inicio de sesión seguro con GitHub. Site URL y Redirect URLs quedaron configuradas a la URL HTTPS publicada. Se verificaron Email habilitado, registro habilitado, confirmación de correo activa y acceso anónimo deshabilitado. La creación de la cuenta personal es el primer paso normal al usar la app; la entrega no contiene una contraseña preasignada.

## Evidencia ejecutada

- `npm test`: 25 pruebas aprobadas (15 de lógica/persistencia y 10 de interfaz).
- `npm run build`: TypeScript y producción Vite aprobados. El build crea el service worker con precache versionado.
- `git diff --check`: sin errores de whitespace.
- GitHub Actions: instalación, 25 pruebas, build, artefacto y despliegue exitosos.
- URL pública: interfaz de acceso cargada correctamente en Chromium con HTTPS.
- Verificación final remota: 0 cuentas de prueba RLS en auth.users.
- Prueba RLS transaccional remota: PASS en las 15 tablas; no dejó datos de prueba.
- Caché de 30 días, retención de pendientes antiguos, recuperación de historial completo y paginación de más de 1,000 filas con timestamps iguales: aprobadas en tests.
- Consulta remota: las 15 tablas de `public.fittrack_*` tienen RLS activa.
- Security Advisor: sin hallazgos en el esquema inicial; detalle en `DATABASE.md`.
- Menú USDA calculado: 2,095.5–2,103.1 kcal y 169.0–170.5 g de proteína, según el día. Las fuentes y cálculos figuran en `NUTRITION.md`.
- Se resolvieron las páginas de demostración de los 27 ejercicios; `TRAINING.md` distingue enlaces y criterios.

La revisión visual en Chromium se hizo con la interfaz real en un viewport de 390 px y un almacén local de QA sin conexión a una cuenta de producción. No se confundió esa vista con un despliegue ni con una prueba de Auth. Se verificaron navegación móvil, selección de lunes, inicio de sesión de fuerza, tres series (45 lb×10, 50 lb×8, 55 lb×6), recuperación tras recargar, arroz de 185 g, dos cafés y dashboard de 394 kcal. Esos datos son de prueba y no se cargaron a tu cuenta de Supabase. El harness de QA está excluido del código entregado y del build.

## Casos solicitados

| Caso | Resultado / alcance |
| --- | --- |
| Lunes muestra Upper A y menú | Aprobado en tests y revisión local de navegador |
| Miércoles muestra caminata/movilidad sin pesas | Aprobado en interfaz automatizada |
| Domingo muestra descanso | Aprobado en interfaz automatizada y revisión local |
| Registrar tres series distintas | Aprobado en navegador local y persistencia automatizada |
| Cerrar/reabrir y recuperar series | Aprobado al recargar navegador local y reconstruir almacén en tests |
| Cambiar arroz a 185 g | Aprobado en test y navegador local |
| Cálculo proporcional | 240.5 kcal reales para 185 g de arroz cocido |
| Uno y dos cafés | Aprobado; cada taza usa leche y espresso como ingredientes separados |
| Cambio de día PR | Prueba automatizada del reloj cruzando 03:59:59→04:00:01 UTC |
| Nuevo día empieza en 0 kcal | Aprobado en el dashboard automatizado |
| Ayer permanece intacto | Aprobado en test del reloj y almacenamiento |
| Otro dispositivo autenticado | PASS HTTP con dos clientes independientes de A: lectura de la misma sesión y comidas, tras login real; no fue una prueba con dos teléfonos físicos |
| Registro parcial offline sin duplicados | Cola durable y recarga aprobadas en tests; reintento upsert también comprobado por HTTP real sin duplicados |
| Videos abren | 27 páginas verificadas; reproducción audiovisual completa en Safari pendiente |
| A no accede a B | PASS remoto de las 15 tablas: CRUD propio y bloqueo ajeno, relaciones, timestamps y tombstones; ROLLBACK final |
| URL real de GitHub Pages | Aprobado: deploy exitoso y pantalla de acceso abierta en URL final |

## Cierre pendiente

1. Crear y confirmar la cuenta personal desde la app con tu correo y contraseña elegida por ti.
2. Verificar Safari de iPhone, instalación PWA, retorno desde segundo plano y reproducción de videos en el dispositivo.
3. Mantener las exportaciones y revisar periódicamente enlaces de videos y actualizaciones.

No están expuestas claves secretas, service_role, contraseñas o sesiones en los archivos entregados. La URL y la clave publishable del proyecto están destinadas al cliente y requieren RLS.


## Pruebas de clientes reales y cierre

PASS HTTP con Supabase Auth y PostgreSQL: login de A en dos clientes independientes, login de B, una sesión con tres series, arroz de 185 g, lectura desde el segundo cliente A, reintentos upsert sin duplicados, aislamiento frente a B y anónimos y tombstones. Los tres clientes cerraron sesión global y el proceso principal confirmó 0 cuentas temporales restantes tras eliminar únicamente las dos UUID de QA. No se conservaron credenciales. Ver `docs/QA.md`.

La última corrección mantiene las series y el cardio vinculados al cambiar explícitamente la fecha histórica de una sesión. La prueba de interfaz confirma que conserva sus IDs y datos, sin dejar entradas en la fecha anterior ni duplicar registros.
