# Evidencia de validación del backend

Estado observado durante la implementación del 8 de noviembre de 2026:

| Comprobación | Resultado observado |
| --- | --- |
| Inspección inicial del esquema `public` | Sin tablas antes de aplicar FitTrack |
| Migración `fittrack_initial_schema` | Aplicación confirmada por Supabase (`success: true`) |
| Historial remoto de migración | Versión `20261108043530`, conservada en `supabase/migrations/20261108043530_fittrack_initial_schema.sql` |
| Tablas y RLS | 15 tablas creadas con políticas de propietario; comprobación final adicional a cargo del proceso principal |
| Bucket de fotografías | `fittrack-progress` confirmado privado, límite 10 MB |
| Asesor de seguridad de Supabase | Sin hallazgos |
| Asesor de rendimiento | Únicamente 33 índices sin uso en proyecto nuevo; conservados para sincronización, fechas y relaciones |
| Fixtures QA persistentes | Comprobación observada: 0 usuarios con correo `fittrack-rls-%@example.invalid` antes de reintentar el script |
| Prueba transaccional A/B `supabase/tests/rls.sql` | Script preparado; las llamadas de ejecución no devolvieron resultado confirmado antes de interrumpirse. No se considera aprobada |
| Inicio de sesión por HTTP con dos clientes reales | No ejecutado |
| Sincronización entre dos dispositivos reales | No validada por este trabajo de backend |

No se crearon contraseñas, tokens ni claves `service_role` para pruebas HTTP. El script RLS usa cuentas efímeras dentro de una transacción y termina con `ROLLBACK`; una ejecución sin respuesta requiere verificar que no quedó una transacción pendiente antes de afirmar su resultado. La aplicación y el despliegue deben registrar sus pruebas por separado; esta evidencia no implica una validación completa de todos los casos solicitados.
