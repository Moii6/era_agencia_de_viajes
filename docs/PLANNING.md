# ERP para Agencias de Viajes — Planeación

## 1. Visión y alcance

Plataforma SaaS multi-tenant para agencias de viajes: cada agencia (tenant) tiene sus propios usuarios,
clientes, catálogo y reservas, aislados de los demás tenants, sobre una infraestructura compartida.

**MVP (fase 1):**
- Módulo de Reservas y Cotizaciones
- Módulo de CRM de clientes

**Fuera del MVP, planeado para fases posteriores:**
- Contabilidad
- Gestión de proveedores (catálogo avanzado, contratos, comisiones)
- Reportes y dashboards analíticos
- Generación de documentos (vouchers, itinerarios PDF)
- App móvil de seguimiento de viaje (turista + guía, solo checkpoints)

**Fuera de alcance por ahora (sin fase asignada):**
- **Pagos:** no se procesa ni cobra dinero dentro de la aplicación — no hay pasarela ni gateway. Sí
  se lleva un **registro informativo del anticipo** (monto + fecha) requerido para asegurar el lugar
  en el viaje, porque el negocio lo necesita para saber si una reserva está asegurada y cuánto falta
  por liquidar antes de que inicie el viaje. El cobro en sí (efectivo, transferencia, etc.) sigue
  ocurriendo fuera del sistema; ver detalle en [DATA_MODEL.md](DATA_MODEL.md) (entidad `Deposit`).
- **Facturación (CFDI):** no hay PAC definido ni es prioridad actual. Queda pendiente para cuando se
  decida formalizar el cobro (pasarela de pago, liquidación) dentro del sistema.

**Moneda y mercado:** operación en peso mexicano (MXN). Se deja como nota para cuando se retome
facturación: al ser México, eventualmente se necesitará CFDI 4.0 vía un PAC (Proveedor Autorizado
de Certificación) y datos fiscales del cliente (RFC, régimen fiscal, uso de CFDI) — no se modela
ahora, pero se tiene presente para no bloquear esa evolución del modelo de datos.

**Escala:** volumen de agencias/usuarios aún desconocido. La arquitectura elegida (BD compartida +
RLS) no requiere decisiones de particionamiento anticipadas y escala razonablemente sin cambios
hasta un volumen medio-alto, así que no se sobre-diseña para esto por ahora; se revisita si en
producción se identifican tenants con carga desproporcionada.

## 2. Modelo de negocio y multi-tenancy

- **Estrategia de aislamiento:** base de datos compartida con columna `tenant_id` en cada tabla +
  Row-Level Security (RLS) de PostgreSQL como refuerzo a nivel de base de datos (**pendiente de
  implementar** — hoy el aislamiento se hace a mano, filtrando cada query de Prisma por `tenantId`).
  Es la opción con menor costo operativo para empezar y escala bien hasta que haya razones de negocio
  (compliance, tenants enterprise muy grandes) para separar por esquema o base de datos.
- **Roles:** `OWNER`, `ADMIN`, `AGENT`, `GUIDE` (implementados en el enum `UserRole`). El rol Guía es
  de solo-operación para la app móvil de seguimiento, ver §5. (Más adelante: Contador, Solo lectura.)
- Cada request autenticado lleva el `tenantId` resuelto desde el JWT; cada query de negocio a Prisma
  se filtra explícitamente por ese `tenantId` — nunca se confía en un `tenantId` que venga del cliente.

## 3. Entidades principales (dominio)

El modelo real (confirmado con el flujo de la agencia de prueba) es un catálogo de **viajes
grupales con salida fija**, no cotizaciones de servicios sueltos. Detalle completo y schema Prisma
en [DATA_MODEL.md](DATA_MODEL.md); resumen:

```
Tenant (Agencia)
 └─ Usuario (Owner/Admin/Agente/Guía)

CRM
 ├─ Cliente (unifica lead y cliente vía "stage")
 └─ Interacción (nota, llamada, email, whatsapp, reunión)

Viaje (Trip — creado por la agencia: fechas/puntos de salida/retorno, cupo máximo, transporte y hospedaje)
 ├─ Autobús (uno o más, con su capacidad de asientos)
 ├─ Tipo de habitación (con precio por adulto/menor, específico del viaje)
 ├─ Actividad opcional de itinerario (con o sin costo extra)
 └─ Checkpoint de seguimiento (fase 2, lo registra el Guía asignado al viaje)

Cotización (sobre un Viaje concreto)
 └─ Grupo de ocupación (N adultos + N menores → tipo de habitación + actividades elegidas)

Reserva (confirmación de una Cotización aceptada, requiere anticipo para asegurar el lugar)
 └─ Viajero (nombre, edad, teléfono, titular, autobús + asiento asignado)

(Fuera de alcance por ahora: Factura, Pago — ver §1)
```

## 4. Stack técnico

| Capa | Elección | Estado |
|---|---|---|
| Monorepo | pnpm + Turborepo | ✅ implementado |
| Frontend | Next.js (React) + TypeScript + Tailwind | ✅ implementado (login + dashboard básicos) |
| Backend | NestJS (Node/TypeScript) | ✅ implementado (auth, tenant, users) |
| Base de datos | PostgreSQL administrado en **Render** | ✅ implementado |
| ORM | Prisma | ✅ implementado, migración inicial aplicada |
| Auth | NestJS + Passport + JWT (solo credenciales, sin OAuth) | ✅ implementado — reemplaza la idea inicial de Auth.js: NestJS es el dueño de la API, así que la autenticación vive ahí, no en Next.js |
| Jobs/colas | BullMQ + Redis | Pendiente — no urgente hasta fase 2 |
| Documentos | Puppeteer o react-pdf | Pendiente (fase 2) |
| Infra | Render (Postgres) + Docker Compose local solo para Redis cuando se necesite | ✅ Render implementado; Redis pendiente |
| Testing | Vitest/Jest + Playwright | Pendiente — Nest trae Jest por defecto pero sin pruebas de dominio propias |
| App móvil | Expo (React Native) + TypeScript | Pendiente (fase 2) |
| Notificaciones push | Expo Push Notifications | Pendiente (fase 2) |
| Actualización de checkpoints | Polling corto o refresh manual | Pendiente (fase 2) — no se justifica WebSockets todavía |

## 5. App móvil de seguimiento de viaje

Alcance acotado: **no** es un cliente móvil del ERP completo, solo cubre el viaje ya reservado y en curso.

- **Rol Guía:** usuario del tenant con cuenta normal (email/password). Desde la app puede ver el
  itinerario de la Reserva que tiene asignada y registrar checkpoints ("salimos al hotel", "llegada
  al aeropuerto", "actividad completada"), con hora y nota opcional. Sin ubicación GPS en vivo por
  ahora — solo checkpoints manuales; se reevalúa si más adelante se vuelve necesario.
- **Rol Turista:** no crea una cuenta completa — entra con un enlace o código vinculado a su Reserva
  (enviado por email/WhatsApp al confirmarse el viaje). Ve el itinerario, los checkpoints en tiempo
  real que registra el Guía, y recibe notificaciones push de cambios de estatus.
- Fuera de alcance en esta primera versión de la app: ubicación GPS en vivo, chat bidireccional
  completo, pagos desde la app, edición de la reserva — esas interacciones siguen pasando por la
  agencia en el ERP web (o fuera del sistema, en el caso de pagos).
- Depende del módulo de Reservas (fase 1) para existir, por lo que se ubica en fase 2 del roadmap.

## 6. Roadmap por fases (producto)

**Fase 1 — MVP (Reservas + CRM)**
1. Fundamentos: modelo de Tenant, autenticación, roles, layout base de la app
2. CRM: alta/gestión de clientes y leads, historial de interacciones
3. Catálogo básico de proveedores y servicios
4. Cotizaciones: armar cotización multi-servicio, enviarla, marcarla aceptada
5. Reservas: convertir cotización aceptada en reserva, estados y seguimiento

**Fase 2**
- Generación de documentos (voucher, itinerario PDF)
- App móvil de seguimiento de viaje (turista + guía, solo checkpoints, ver §5)
- Dashboard y reportes de ventas
- Comisiones de proveedor (registro informativo, sin procesar pagos)

**Fase 3**
- Portal de autoservicio para clientes finales (ver su itinerario/reserva desde web, no solo app)
- Integraciones con proveedores externos (GDS, APIs de hoteles/vuelos) si aplica

**Sin fecha (pendiente de decisión):**
- Pagos dentro de la app
- Facturación electrónica (CFDI) — depende de que se decida incorporar pagos
- Contabilidad — depende de facturación

## 7. Plan de ejecución técnica del MVP (fase 1)

Complementa el roadmap de producto (§6) con el "cómo" a nivel de código. Se actualiza conforme
avanza la implementación — lo marcado ✅ ya existe en el repo.

### 7.1 Estructura del backend (`apps/api/src/`)

```
app.module.ts, main.ts
auth/          ✅ login, /me, JWT, guards de rol
prisma/        ✅ PrismaModule/PrismaService
tenant/        ✅ GET /tenants/me
users/         ✅ CRUD básico de usuarios del tenant
clients/       ✅ CRUD + soft delete, filtro por stage
interactions/  ✅ historial por cliente (anidado en clients/:id/interactions)
providers/     ✅ CRUD + soft delete, filtro por type
trips/         ✅ CRUD (sin delete, usa status), con buses/, room-types/, activities/ anidados
quotes/        ✅ CRUD (delete solo en DRAFT) + transiciones de estado controladas, con
               occupancies/ (snapshot de precio) y occupancies/:id/activities/ anidados;
               totales (subtotal/total) recalculados en cascada, edición bloqueada fuera de DRAFT
reservations/  ✅ se crea desde una Quote ACCEPTED, transiciones de estado controladas, con
               travelers/ (titular único, asiento vía SeatAssignment, valida cupo de la
               ocupación) y deposits/ (anticipo mínimo, auto-confirma la reserva, sin
               edición/borrado por ser registro contable) anidados; balance calculado
```

### 7.2 Estructura del frontend (`apps/web/src/`)

```
app/
  page.tsx           ✅ login (vive en /, fuera del grupo protegido)
  (app)/             ✅ route group protegido: layout.tsx hace el guard de
                     sesión + sidebar de navegación una sola vez
    dashboard/       ✅ básico (nombre, email, rol)
    clientes/        ✅ CRUD completo (lista, filtro por etapa, crear/editar
                     en modal, soft delete) — plantilla de referencia
    proveedores/     ✅ CRUD completo (lista, filtro por tipo) — no estaba
                     en el plan original, se agregó porque Viajes lo
                     necesita para elegir hotel/transportista
    viajes/          ✅ lista (filtro por estado) + detalle con edición,
                     cambio de estado y 3 secciones anidadas (buses, tipos
                     de habitación, actividades), cada una con su propio
                     modal de alta/edición/borrado
    cotizaciones/    ✅ lista (filtro por estado) + detalle con edición
                     (notas/vigencia), transiciones de estado controladas
                     (mismo mapa que el backend, DRAFT→SENT→ACCEPTED/
                     REJECTED/EXPIRED), borrado (solo DRAFT), y sección de
                     ocupaciones con actividades anidadas — todo editable
                     solo mientras la cotización está en DRAFT
    reservas/        ✅ lista (filtro por estado) + detalle con balance
                     (total/anticipado/saldo), transiciones de estado
                     controladas (CONFIRMED es inalcanzable manualmente —
                     solo ocurre al registrar el anticipo inicial, igual
                     que el backend), sección de viajeros (con reglas de
                     titular y asignación de asiento por autobús) y
                     sección de anticipos (solo alta, sin edición/borrado
                     — es un registro contable)
components/
  ui/        ✅ Modal (soporta size md/lg), Badge (reutilizables entre módulos)
  forms/     ✅ ClientForm, ProviderForm, TripForm, BusForm, RoomTypeForm,
             ActivityForm, QuoteForm (alta), QuoteEditForm (notas/vigencia),
             OccupancyForm, ReservationForm (alta), TravelerForm, DepositForm
             (mismo patrón por módulo)
  trips/     ✅ BusesSection, RoomTypesSection, ActivitiesSection (listas
             autocontenidas usadas en el detalle de viaje)
  quotes/    ✅ OccupanciesSection (ocupaciones + alta/borrado de actividades
             inline por ocupación, respeta el snapshot de precios del backend)
  reservations/ ✅ TravelersSection (viajeros + asignación de asiento inline
             por autobús), DepositsSection (anticipos, marca el inicial)
lib/         ✅ api.ts (fetch autenticado + manejo de 401), auth.ts (sesión
             en localStorage), clients.ts, providers.ts, trips.ts, quotes.ts,
             reservations.ts (tipos + llamadas por recurso, incluye
             QUOTE_TRANSITIONS y RESERVATION_TRANSITIONS espejo de los mapas
             del backend para la UI), formats.ts (formatDate compartido,
             fuerza timeZone: "UTC" para evitar el bug de día -1) — cada
             módulo nuevo agrega su propio lib/<recurso>.ts
```

Probado en navegador real (Playwright headless, no solo build/typecheck): login → dashboard →
lista de clientes → crear → filtrar por etapa → editar → eliminar (soft delete), sin errores de
consola. También probado el flujo completo de Viajes: crear viaje → agregar bus/tipo de
habitación/actividad → cambiar estado a PUBLISHED → volver a la lista y ver los conteos
actualizados, sin errores de consola. `chromium-cli` no estaba disponible en esta máquina; se usó
un script de Playwright puntual en el scratchpad (no quedó como skill del proyecto — si se repite
seguido, conviene correr `/run-skill-generator` para dejarlo formalizado).

Bug encontrado y corregido durante la revisión de capturas de la pantalla de Viajes: las fechas
(`departureDate`/`returnDate`) se mostraban un día antes del valor guardado, porque
`toLocaleDateString` sin `timeZone: "UTC"` convierte la medianoche UTC a la zona horaria local del
navegador. Corregido centralizando el formateo en `lib/formats.ts`.

También probado el flujo completo de Cotizaciones: crear cotización (cliente + viaje) → agregar
una ocupación → intentar una ocupación que excede la capacidad del tipo de habitación (rechazada
por el backend con 400, mensaje mostrado correctamente en el formulario) → agregar una ocupación
válida → agregar una actividad a la ocupación (recalcula subtotal/total) → cambiar estado a SENT →
confirmar que "Eliminar" y los controles de edición desaparecen al salir de DRAFT → volver a la
lista y ver el estado y total actualizados. Sin errores de consola.

También probado el flujo completo de Reservas: crear cotización → ocupación → SENT → ACCEPTED →
crear reserva desde esa cotización (queda en PENDING_DEPOSIT) → agregar dos viajeros (titular +
acompañante, con la regla de teléfono obligatorio para el titular) → asignar autobús/asiento a
cada uno → registrar un anticipo que no alcanza el mínimo del viaje (rechazado por el backend,
mensaje mostrado inline) → registrar el anticipo inicial por el mínimo o más → confirmar que el
estado pasa automáticamente a CONFIRMED sin intervención manual (igual que el backend) → registrar
un segundo anticipo y ver el saldo recalculado → mover el estado a COMPLETED. También se verificó
que una reserva cancelada no reabre sus controles de edición (CANCELLED es un estado terminal, sin
transiciones ni ediciones disponibles, igual que el backend). Sin errores de consola.

**Tema visual (decidido y aplicado a toda la app):** tema claro, fondo `slate-50`, tarjetas `white`
con borde `slate-200`, texto en escala de slate (`900` títulos, `700` cuerpo, `500` metadatos), y
**teal** como color primario (no el azul genérico original — se probaron ambos lado a lado y teal
"tiene más personalidad" para una agencia de viajes, sin chocar con los colores semánticos de los
badges). Badges de estado con el patrón `bg-X-100 text-X-800` mapeados por "tono" (`neutral` slate,
`info` sky, `success` emerald, `warning` amber, `danger` rose) en `components/ui/Badge.tsx` —
cualquier estado nuevo (viajes/cotizaciones/reservas) solo necesita agregarse a ese mapa, no
inventar clases nuevas.

### 7.3 Reglas de negocio no negociables (backend)

1. Multi-tenancy obligatorio: todo query de negocio debe estar filtrado por `tenantId`.
2. Un usuario solo debe acceder a recursos del tenant al que pertenece.
3. La cotización debe conservar snapshot de los precios en `QuoteOccupancy`.
4. La reserva debe derivarse de una cotización `ACCEPTED`.
5. La reserva debe tener un anticipo mínimo definido por `Trip.minimumDepositAmount`.
6. Cada viajero debe tener un único asiento en un bus del viaje (`SeatAssignment`).
7. Los viajes deben manejar capacidad total (turistas + guías) consistente con sus autobuses.
8. Los estados de reserva y cotización deben transitar de manera controlada (no saltos arbitrarios).
9. Cada `Interaction` debe reportar quién la registró y cuándo.

### 7.4 Orden recomendado de implementación

1. ✅ Base de datos (Render) + Prisma migrate + seed
2. ✅ Auth + JWT + roles + tenant (login, `/me`, tenant, users)
3. ✅ Clientes + interacciones
4. ✅ Proveedores
5. ✅ Viajes + buses + room types + activities
6. ✅ Cotizaciones
7. ✅ Reservas + viajeros + depósitos
8. ✅ Frontend: dashboard, clientes, proveedores, viajes, cotizaciones, reservas
9. Polishing y validaciones de UX ← **siguiente paso**

### 7.5 Definición de "MVP terminado"

Se puede demostrar en una sola sesión: iniciar sesión con un usuario del tenant → crear un cliente →
crear un viaje con buses y tipos de habitación → cotizar para ese cliente → aceptar la cotización →
crear la reserva con viajeros → registrar un depósito inicial → ver el estado de la reserva en el
dashboard.

**✅ MVP completo y probado end-to-end desde la UI real** (Playwright headless contra la API en
Render, no solo curl): login → cliente → viaje con buses/habitaciones → cotización con ocupaciones →
cotización aceptada → reserva → viajeros con asientos → anticipo inicial → confirmación automática
→ liquidación del saldo. Queda pendiente §7.4.9 (polishing y validaciones de UX) antes de considerar
el frontend "terminado" más allá del flujo feliz.

## 8. Estado actual del repositorio

- **Git:** repo en `https://github.com/Moii6/era_agencia_de_viajes`, rama `main`, historial:
  scaffold inicial → migración inicial de Prisma → módulo de auth (JWT) → base de auth + tenant/users
  + login frontend. Todo commiteado y sincronizado con GitHub.
- **`apps/web`:** login funcional contra la API + dashboard básico (nombre/email/rol, logout).
  Token guardado en `localStorage` — aceptable para esta etapa, revisar antes de tener usuarios reales.
- **`apps/api`:** `PrismaModule`, `AuthModule` (`POST /auth/login`, `GET /auth/me`), `TenantModule`
  (`GET /tenants/me`), `UsersModule` (`GET /users`, `GET /users/me`, `POST /users`) — todos probados
  end-to-end, incluido el build de producción compilado (`nest build` + `node dist/main.js`), no solo
  el modo dev.
- **`packages/db`:** schema completo, migración inicial aplicada, seed con tenant + usuario Owner de
  prueba (`owner@agenciadeprueba.mx`).
- **Base de datos:** migrada a **Render** (Postgres administrado) — es la fuente de verdad compartida
  entre equipos de desarrollo. El Postgres local (Postgres.app) ya no se usa para este proyecto.
- **`docker-compose.yml`:** ya no es el plan para Postgres (se mueve a Render); se mantiene solo para
  Redis cuando se necesite (fase 2, BullMQ).
- **Verificado:** `pnpm install`, `db:generate`, `typecheck`, `lint` y `build` pasan limpio en las 3
  workspaces vía Turborepo.
- **Aún no implementado:** módulos de negocio del MVP (clients, trips, quotes, reservations, etc.),
  RLS de Postgres, shadcn/ui, BullMQ/Redis, generación de PDFs, app móvil (Expo), testing automatizado.

### Checklist de migración a Render — completado

- [x] Crear el servicio PostgreSQL en Render
- [x] Obtener el connection string (externo, no el interno — el interno solo resuelve entre
      servicios de Render, no desde una máquina de desarrollo)
- [x] Actualizar `packages/db/.env` y `apps/api/.env` con la nueva `DATABASE_URL`
- [x] Migraciones y seed ya estaban aplicados contra esta base (trabajo previo de la otra máquina)
- [x] Verificar login end-to-end contra la base de Render — funciona
- [x] Confirmar que la base local de Postgres.app ya no es la fuente de verdad

Ver [RENDER_PRISMA_SETUP.md](RENDER_PRISMA_SETUP.md) y [DB_REBUILD_PLAYBOOK.md](DB_REBUILD_PLAYBOOK.md)
para el detalle operativo de Render (esos quedan como runbooks aparte, no se consolidan aquí).

## 9. Preguntas abiertas para siguientes pasos

- Sin agencia piloto por ahora: el desarrollo va guiado por este documento y se valida con datos
  de prueba propios; conviene reconfirmar el orden de prioridades del roadmap conforme avance el MVP.
- Cuando se retome el tema de pagos/facturación más adelante, será buen momento para definir PAC
  y flujo de cobro — no urgente hoy.
