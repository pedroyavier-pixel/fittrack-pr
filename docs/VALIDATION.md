# Verificación de FitTrack PR

Estado al 8 de noviembre de 2026. La aplicación está implementada y compila. La base está aplicada y el código completo está en [pedroyavier-pixel/fittrack-pr](https://github.com/pedroyavier-pixel/fittrack-pr). La sesión del navegador permitió publicarlo después del error HTTP 403 de la conexión API. **GitHub Pages está publicado con HTTPS** en https://pedroyavier-pixel.github.io/fittrack-pr/. El [workflow inicial](https://github.com/pedroyavier-pixel/fittrack-pr/actions/runs/42494152972), commit `92faffd24523088991b686bff361578c03c8c7e3`, terminó con build y deploy exitosos, incluyendo npm test y npm run build. La URL final se abrió y mostró correctamente la interfaz de acceso.

El panel web de Supabase requirió iniciar sesión y ese acceso no se completó. La configuración Site URL/Redirect URLs sigue pendiente. No se afirma que el registro por correo o sus enlaces de retorno ya hayan pasado una prueba real.

## Evidencia ejecutada

- `npm test`: 21 pruebas aprobadas (12 de lógica/persistencia y 9 de interfaz).
- `npm run build`: TypeScript y producción Vite aprobados. El build crea el service worker con precache versionado.
- `git diff --check`: sin errores de whitespace.
- GitHub Actions: instalación, 21 pruebas, build, artefacto y despliegue exitosos.
- URL pública: interfaz de acceso cargada correctamente en Chromium con HTTPS.
- Verificación final remota: 0 cuentas de prueba RLS en auth.users.
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
| Otro dispositivo autenticado | Pendiente de Auth real; reconciliación y separación de cachés probadas con cliente simulado |
| Registro parcial offline sin duplicados | Aprobado con cola durable, recarga y reintentos en servidor simulado |
| Videos abren | 27 páginas verificadas; reproducción audiovisual completa en Safari pendiente |
| A no accede a B | Políticas aplicadas; consultar resultado de ejecución de `supabase/tests/rls.sql` en evidencia de base de datos |
| URL real de GitHub Pages | Aprobado: deploy exitoso y pantalla de acceso abierta en URL final |

## Cierre pendiente

1. Completar el acceso seguro al panel de Supabase y configurar Site URL y Redirect URLs a la URL publicada con barra final.
2. Crear/confirmar la cuenta desde la app y probar Auth, sincronización entre dos sesiones y recuperación de red con Supabase real.
3. Ejecutar la prueba RLS A/B cuando se confirme la solicitud del servicio; las solicitudes anteriores expiraron sin ejecutar la prueba. No se declara PASS.
4. Verificar Safari de iPhone, instalación PWA, retorno desde segundo plano y reproducción de videos en el dispositivo.

No están expuestas claves secretas, service_role, contraseñas o sesiones en los archivos entregados. La URL y la clave publishable del proyecto están destinadas al cliente y requieren RLS.
