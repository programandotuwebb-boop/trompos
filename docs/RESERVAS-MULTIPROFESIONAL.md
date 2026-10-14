# Agenda multiprofesional — PostgreSQL

La web es el único sistema de agenda. No consulta ni escribe Google Calendar. Servicios y precios también se administran en `/admin`. No existe modo antiguo ni bandera `BOOKING_MULTI_ENABLED`; `CRON_SECRET` y el endpoint de sincronización dejaron de usarse.

## Abrir localmente

En esta computadora quedó preparada `.env.local` (ignorada por Git), una base `trompos_local` y cuentas locales. Sus credenciales están en `.env.local.credentials`, también ignorado por Git. Son exclusivas de desarrollo.

PostgreSQL local está en `/Users/joacoslon/.local/share/trompos-postgres`, puerto 55433, accesible solamente desde localhost. Si reiniciás la computadora, arrancalo con:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /Users/joacoslon/.local/share/trompos-postgres -l /Users/joacoslon/.local/share/trompos-postgres/server.log -o '-p 55433 -h 127.0.0.1' start
```

Abrir con `npm run dev -- --hostname 127.0.0.1 --port 3003` y entrar a `http://localhost:3003` o `http://localhost:3003/admin`. `APP_ORIGIN` ya está configurado para ese origen. El puerto 3000 estaba ocupado por otro proceso y se conservó.

En otra instalación:

```sh
npm ci
# Configurar DATABASE_URL y APP_ORIGIN en .env.local
npm run db:migrate
npm run db:seed
# Configurar ADMIN_EMAIL, ADMIN_PASSWORD (12+ caracteres), ADMIN_ROLE=OWNER
npm run admin:create-user
npm run dev
```

El seed no sobreescribe datos: crea Tomás, Mateo y Franco con sus jornadas originales y descansos. Los deja inactivos hasta revisar horarios/precios. En la base local de demostración ya están activos. El sistema admite cualquier cantidad de profesionales.

## Uso del panel

- OWNER: agenda completa, filtros por profesional/servicio/fecha/estado, profesionales, servicios/precios, cuentas y todos los horarios.
- PROFESSIONAL: agenda propia **Hoy / Semana / Próximos**, crear turnos, cancelar/reprogramar, marcar completado o ausente, configurar horario habitual y excepciones propias. Los permisos se comprueban en servidor; no puede operar otra identidad.
- **Modificar horario habitual**: bloques semanales recurrentes. Separar los bloques para respetar descansos. No hay que crear semanas: se calcula un horizonte móvil de 56 días (8 semanas).
- **Modificar solo este día**: seleccionar fecha y registrar bloqueo de día, bloqueo parcial, horario especial o disponibilidad extraordinaria. También se pueden abarcar varios días, por ejemplo vacaciones.
- `HOURS` reemplaza la jornada semanal de esas fechas. Se pueden agregar varios bloques especiales para representar descansos. `EXTRA` agrega horas a la jornada efectiva. Los intervalos contiguos se unen; los bloqueos parciales se restan y un día cerrado prevalece. Para reabrirlo, quitar el cierre. Las excepciones existentes se listan con fechas y horas y pueden quitarse.
- No se permite guardar un cambio que deje una reserva confirmada fuera de disponibilidad: reprogramar o cancelar primero. La cancelación libera el horario en la misma transacción. Reprogramar conserva el turno anterior si falla el destino.
- Los estados son `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`. No se puede marcar como completado/ausente antes del inicio. Esos estados mantienen el intervalo histórico ocupado; solo cancelar lo libera.

## Migración sin pérdida de reservas

Ejecutar `npm run db:migrate` con backup previo y la versión anterior detenida durante el cambio. La migración `002_postgres_agenda.sql` adapta las tablas existentes; no crea un sistema paralelo ni borra clientes, reservas, profesionales, cuentas o auditoría.

- Conserva los identificadores históricos de Google como metadatos opcionales, sin utilizarlos para disponibilidad.
- Renombra `CANCELED` a `CANCELLED`; mantiene confirmadas las reservas importadas.
- Finaliza intenciones pendientes: CREATE pasa a confirmada, CANCEL a cancelada y MOVE adopta el destino protegido por el hold. Registra el estado anterior en auditoría. Revisar esos turnos y avisar a sus clientes si antes figuraban pendientes.
- Ajusta los holds a los intervalos definitivos y conserva la exclusión PostgreSQL por profesional. Elimina solamente la exclusión por calendario externo. Si detecta solapamientos, la migración falla y revierte completa.
- No modifica ni borra eventos de Google: desde el cambio, esos calendarios ya no son operativos. No mantener la versión antigua aceptando turnos en paralelo.

Si todavía existen turnos guardados **únicamente** en Calendar, importar antes del corte con `npm run db:import-calendar`, usando las credenciales antiguas y verificando la asociación al profesional histórico. Es una herramienta manual de solo lectura; el SDK está en dependencias de desarrollo y no participa del runtime de la web. El comando pagina eventos históricos del sitio, conserva IDs y no duplica importaciones. Una reserva ya importada se opera como cualquier booking normal. Confirmar el inventario antes de quitar las credenciales antiguas; los eventos externos que nunca fueron reservas del sitio deben cargarse como bloqueos/turnos manuales si corresponden.

## Cuentas y producción

Crear el primer dueño con `npm run admin:create-user`. Luego crear PROFESSIONAL desde **Cuentas**, vinculado a su profesional. La CLI también permite restablecer contraseña con `ADMIN_ROLE` y `ADMIN_PROFESSIONAL_ID`; revoca sesiones anteriores. Quitar las variables de bootstrap después de utilizarlas.

Antes de producción:

1. PostgreSQL gestionada con TLS verificado, backups y extensión `btree_gist`; configurar `DATABASE_URL` privada.
2. `APP_ORIGIN` con el dominio HTTPS real; migraciones y seed ejecutados explícitamente, nunca durante el build.
3. Cuentas reales y contraseñas propias; no copiar las cuentas/base locales. Revisar profesionales activos, servicios, precios, jornadas y datos históricos.
4. Probar reserva pública → panel de dueño/profesional → reprogramación → cancelación. Configurar Resend solo si se desean emails.
5. Resolver las alertas de dependencias antes de publicar: `npm audit --omit=dev` informó vulnerabilidades en Next.js 16.3.4 (crítica), sharp y source-map-js (altas). No se actualizó el framework fuera del alcance de este cambio; requiere actualización y verificación propia.
6. No hace falta configurar Google Cloud, calendarios ni scheduler de sincronización. Buenos Aires sigue siendo el huso operativo; los instantes se guardan como timestamptz.

La cancelación pública conserva la regla existente de identificación por teléfono. Las sesiones privadas siguen siendo HttpOnly, SameSite Strict y Secure en producción, con contraseñas scrypt, control de origen y límites de intentos.

## Verificación

```sh
npm run typecheck
npm run lint
npm test
TEST_DATABASE_URL='postgresql://.../trompos_test' npm run test:integration
npm run build
```

Los tests de integración utilizan PostgreSQL real con schemas aislados y limpian únicamente esos schemas. Cubren concurrencia, movimientos atómicos, cancelación inmediata, permisos, extraordinarios, cambios de semana, duración completa, bloqueos, estados y preservación de bookings históricos. Se ejecutan sin credenciales ni sustitutos de Google.

Verificado en esta entrega: typecheck, ESLint, 22 pruebas (10 unitarias + 12 de integración) y build aprobados. Chrome verificó reserva pública, agenda OWNER/PROFESSIONAL, edición del horario habitual, disponibilidad extraordinaria, creación propia de turnos, permisos, cancelación y responsive a 320/768/1440 px. La ejecución no usó credenciales ni mocks de Calendar. No se realizó push ni deploy.
