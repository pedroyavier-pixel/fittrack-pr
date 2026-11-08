# Base de datos de FitTrack PR

Proyecto configurado: `rdomgmmqmkczdaxnmqos` (`fittrack-pr`, región `us-east-1`). El esquema inicial está aplicado. `supabase/schema.sql` es la copia reproducible para un proyecto vacío; no volver a ejecutarlo sobre el mismo esquema porque crea tablas y políticas existentes. Para cambios futuros, usar una migración nueva y conservar el historial.

## Contrato del cliente

Las tablas tienen prefijo `fittrack_` en `public`. Todas incluyen `id uuid` (PK), `user_id uuid` (FK a `auth.users`), `data jsonb` (objeto), `local_date date`, `created_at timestamptz`, `updated_at timestamptz` y `deleted_at timestamptz` nullable. La aplicación genera UUID estables antes de guardar y reutiliza el mismo UUID al reintentar; `upsert` no duplica la entrada. `created_at` se preserva al editar y `updated_at` se asigna en el servidor.

`local_date` es obligatoria en sesiones, series, cardio, comidas consumidas y medidas corporales. Su valor predeterminado es la fecha calendario de `America/Puerto_Rico`, pero el cliente debe enviar siempre la fecha congelada al abrir el formulario o la sesión. Así una serie de una sesión iniciada antes de medianoche no pasa al día siguiente por accidente. Las demás tablas permiten fecha nula.

| Tabla | Contenido y relaciones opcionales |
| --- | --- |
| `fittrack_user_profiles` | Perfil; `user_id` único |
| `fittrack_user_goals` | Objetivos configurables |
| `fittrack_exercise_catalog` | Ejercicios, técnica, referencias y cargas personales |
| `fittrack_workout_plans` | Programa semanal editable |
| `fittrack_workout_plan_exercises` | `plan_id`, `exercise_id` |
| `fittrack_workout_sessions` | Fecha de sesión, instantánea del programa; `plan_id` |
| `fittrack_workout_sets` | Series independientes; `session_id`, `exercise_id` |
| `fittrack_cardio_logs` | Tiempo, distancia, pasos, intervalos; `session_id` |
| `fittrack_food_catalog` | Nutrientes por 100 g/ml y fuentes |
| `fittrack_recipes` | Recetas personales |
| `fittrack_recipe_ingredients` | `recipe_id`, `food_id` |
| `fittrack_meal_plans` | Plan semanal de comidas |
| `fittrack_meal_plan_items` | `meal_plan_id`, `food_id`, `recipe_id` |
| `fittrack_food_logs` | Cantidad y nutrientes consumidos como instantánea; `food_id`, `recipe_id` |
| `fittrack_body_measurements` | Peso, cintura, notas y rutas de fotos privadas |

Las claves foráneas de relaciones usan `(id,user_id)`. Un registro de A no puede asociarse a un padre de B. Son opcionales para permitir guardar instantáneas sin depender de la versión actual del catálogo. Los valores históricos deben conservar nombre, cantidad, nutrientes, carga y repeticiones dentro de `data`; los cambios futuros del plan no deben recalcular el pasado.

## Autenticación y seguridad

El navegador usa únicamente URL pública y clave **publishable** de Supabase. Nunca usar `service_role`, una clave secret, contraseña de PostgreSQL o token de administración en variables `VITE_*`, GitHub Pages o el repositorio.

Las 15 tablas tienen RLS activa. `SELECT`, `INSERT`, `UPDATE` y `DELETE` requieren `auth.uid() = user_id`. Las políticas de actualización incluyen `USING` y `WITH CHECK`, por lo que no permiten transferir el propietario. `anon` no tiene permisos sobre las tablas. Las funciones son `SECURITY INVOKER` y fijan `search_path`; no existe una función que omita RLS.

La autenticación está configurada: Email habilitado, registro de usuarios habilitado, confirmación del correo activa y acceso anónimo deshabilitado. Site URL y Redirect URLs apuntan a `https://pedroyavier-pixel.github.io/fittrack-pr/`, verificados en el panel. La confirmación de correo y recuperación de contraseña dependen de esa configuración. No se ha modificado la configuración de Auth mediante SQL. Para pruebas reales de entrada, usar el formulario y confirmar el correo recibido; no compartir contraseñas con el asistente.

## Sincronización y eliminaciones

Las tablas se añadieron a `supabase_realtime`. Las suscripciones Postgres Changes respetan RLS. También se puede recuperar al abrir o reconectar con `select` filtrado por usuario; los índices `(user_id,updated_at,id)` ayudan a la sincronización y los índices de fecha ayudan al historial.

La eliminación normal usa un tombstone (`deleted_at`) y se sincroniza como actualización. Consultar también tombstones durante la sincronización y excluirlos de las pantallas evita que un segundo dispositivo restaure registros borrados. La cola local debe sobrevivir al cierre y eliminar una operación sólo tras recibir éxito; no debe mezclarse entre cuentas. Los cambios simultáneos del mismo registro requieren una regla explícita de resolución en el cliente.

## Fotografías

Bucket `fittrack-progress`, privado, límite de 10 MB por imagen; acepta JPEG, PNG, WebP, HEIC y HEIF. Ruta: `<auth.uid()>/<uuid>.<ext>`. Las políticas de lectura, inserción, actualización y borrado comprueban el primer directorio de la ruta. Guardar la ruta en `data`; generar URL firmada temporal para mostrarla. No almacenar URL pública ni URL firmada como identidad permanente del archivo.

## Validación y mantenimiento

El esquema se aplicó mediante la migración remota `fittrack_initial_schema`. La revisión de seguridad de Supabase no devolvió hallazgos. La revisión de rendimiento devolvió únicamente índices todavía sin uso en un proyecto nuevo; se conservan porque soportan consultas de sincronización, fechas y claves foráneas. [Referencia del aviso de índices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

`supabase/tests/rls.sql` ejecuta pruebas de dos identidades aisladas en una transacción y termina con `ROLLBACK`: acceso propio, bloqueo de lectura/escritura/borrado ajenos, transferencia de propietario, relaciones entre dueños, timestamps y tombstones. No deja cuentas ni registros de prueba. El resultado observado de su ejecución debe constar en la evidencia de QA; la existencia del script por sí sola no significa que haya pasado.

Antes de nuevas migraciones: revisar tablas actuales, aplicar cambios, ejecutar estas pruebas y volver a ejecutar los asesores de seguridad. Nunca editar `auth.users` para configurar autenticación de producción. Habilitar y revisar los respaldos disponibles en el plan de Supabase; conservar además exportaciones personales de la app.


La ejecución final de `supabase/tests/rls.sql` devolvió PASS para las 15 tablas: CRUD propio, bloqueo de lectura/escritura/borrado/transferencia ajenos, relaciones por propietario, timestamps y tombstones. La transacción terminó con ROLLBACK.


Las pruebas HTTP de Auth y persistencia con clientes independientes finalizaron PASS. Las cuentas desechables se eliminaron y el servidor confirmó 0 restantes; detalles en `QA.md`.
