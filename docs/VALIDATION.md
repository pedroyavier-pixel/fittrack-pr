# Verificación de FitTrack PR

Estado al 8 de noviembre de 2026. La aplicación está implementada y compila. La base está aplicada. El código completo se está publicando en `pedroyavier-pixel/fittrack-pr` mediante la sesión del navegador; la conexión API devolvió HTTP 403 al escribir. GitHub Pages está configurado para GitHub Actions y HTTPS. El estado final del workflow y Auth se registrará al completar esas comprobaciones.

El panel web de Supabase requirió iniciar sesión y ese acceso no se completó. La configuración Site URL/Redirect URLs sigue pendiente. No se afirma que el registro por correo o sus enlaces de retorno ya hayan pasado una prueba real.

## Evidencia ejecutada

- `npm test`: 21 pruebas aprobadas (12 de lógica/persistencia y 9 de interfaz).
- `npm run build`: TypeScript y producción Vite aprobados. El build crea el service worker con precache versionado.
- `git diff --check`: sin errores de whitespace.
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
| URL real de GitHub Pages | Pendiente de permiso de escritura / despliegue |

## Cierre pendiente

1. Confirmar la carga completa del código mediante la sesión del navegador.
2. Subir el código y observar el workflow hasta despliegue exitoso.
3. Configurar Site URL y Redirect URLs en Supabase a la URL publicada con barra final.
4. Crear/confirmar la cuenta desde la app y probar Auth, sincronización entre dos sesiones de navegador y recuperación de red con Supabase real.
5. Verificar Safari de iPhone, instalación PWA, retorno desde segundo plano y reproducción de videos en el dispositivo.

No están expuestas claves secretas, service_role, contraseñas o sesiones en los archivos entregados. La URL y la clave publishable del proyecto están destinadas al cliente y requieren RLS.
