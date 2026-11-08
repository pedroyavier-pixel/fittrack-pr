# Validación final del backend

Comprobaciones ejecutadas el 8 de noviembre de 2026 en el proyecto de FitTrack PR.

| Comprobación | Resultado |
| --- | --- |
| Migración inicial | Aplicada; versión remota `20261108043530` coincide con el archivo reproducible |
| Tablas personales | 15 tablas, todas con RLS y políticas de propietario |
| Fotos | Bucket `fittrack-progress` privado, rutas por UUID del usuario y límite de 10 MB |
| Security Advisor | Sin hallazgos |
| Performance Advisor | Sólo índices todavía sin uso en un proyecto nuevo |
| Prueba SQL transaccional A/B | PASS en las 15 tablas: CRUD propio, acceso ajeno bloqueado, transferencia de propietario bloqueada, relaciones por propietario, timestamps y tombstones; ROLLBACK final |
| Salud de Auth HTTP | HTTP 200 |
| Login real | PASS con dos clientes independientes de A y otro cliente de B usando supabase-js 2.100.1 |
| Persistencia real | Sesión, tres series distintas y arroz de 185 g recuperados por el segundo cliente A |
| Reintentos | Repetir upsert de las series conservó tres filas, sin duplicados |
| Privacidad HTTP | B no pudo leer datos de A ni insertar como A; el cliente anónimo no obtuvo acceso |
| Eliminación sincronizada | Tombstone visible desde el segundo cliente A |
| Cierre de sesiones de prueba | signOut global de los tres clientes completado |
| Limpieza | Eliminadas únicamente las dos UUID de QA; el servidor confirmó `remaining_disposable_accounts: 0` y los registros relacionados se eliminaron por cascada |
| Credenciales de QA | Aleatorias y temporales; no conservadas en código, documentación, logs ni archivos. No se usaron claves service_role |

Las cuentas QA usaron correos del dominio reservado `example.invalid`. Las pruebas HTTP emplearon clientes reales y la clave publishable, por lo que sus consultas quedaron sujetas a RLS. No se cargaron datos de prueba a la cuenta personal del usuario.

La autenticación está configurada con Email habilitado, registro de usuarios habilitado, confirmación de correo activa y acceso anónimo deshabilitado. Site URL y Redirect URLs están fijadas a `https://pedroyavier-pixel.github.io/fittrack-pr/` y se verificaron en el panel.

Las pruebas entre clientes independientes verifican persistencia y aislamiento; no equivalen a una prueba con dos iPhones físicos. La instalación PWA, las transiciones de segundo plano y la reproducción audiovisual completa en Safari deben comprobarse en un iPhone real. La entrega del primer correo personal se comprobará al crear y confirmar esa cuenta desde la app.
