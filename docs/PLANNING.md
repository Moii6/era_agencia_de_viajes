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
 ├─ Tipo de habitación (con tarifa plana por noche, específico del viaje)
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
  registro/[slug]/   ✅ registro público (sin sesión) para unirse a una
                     agencia por su slug — GET /tenants/:slug/public (solo
                     name/slug, nada sensible) para saludar, POST
                     /tenants/:slug/register crea el usuario en PENDING con
                     rol AGENT fijo (no seleccionable). El OWNER comparte
                     este link con la persona que quiere sumar; no hay forma
                     de "descubrir" agencias navegando la app
  (app)/             ✅ route group protegido: layout.tsx hace el guard de
                     sesión + sidebar de navegación una sola vez
    dashboard/       ✅ tarjeta de "Viaje en curso" (rango departureDate–
                     returnDate cubre hoy) que cae a "Próximo viaje" (el
                     PUBLISHED más cercano) si no hay ninguno en curso, y
                     tarjeta de "Último viaje creado" (el más reciente por
                     createdAt, sin filtrar por estado) — ya no repite
                     nombre/email/rol, que ya viven en el pie del sidebar
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
    agencia/         ✅ perfil del tenant (representante, dirección,
                     contactos, notas, contador de usuarios/clientes/viajes)
                     — el botón "Editar" solo se muestra si el rol de sesión
                     es OWNER o ADMIN (PATCH /tenants/me es solo para esos
                     roles); primera pantalla del frontend con gating de UI
                     por rol. También incluye la sección "Usuarios" (listar,
                     alta, edición, desactivar/reactivar — sin borrado, el
                     backend no lo tiene), oculta por completo para
                     AGENT/GUIDE porque GET /users también es solo
                     OWNER/ADMIN. Alta y edición pasan por un flujo de
                     aprobación del otro OWNER cuando ya hay 2 (ver
                     "Edición de usuarios con aprobación de doble OWNER" más
                     abajo) — Aprobar/Rechazar solo visibles para el OWNER
                     que no fue quien solicitó el cambio
components/
  ui/        ✅ Modal (soporta size md/lg), Badge (reutilizables entre módulos)
  forms/     ✅ ClientForm, ProviderForm, TripForm, BusForm, RoomTypeForm,
             ActivityForm, QuoteForm (alta), QuoteEditForm (notas/vigencia),
             OccupancyForm, ReservationForm (alta), TravelerForm, DepositForm,
             TenantForm, UserForm (alta y edición, sin campo de contraseña en
             edición) (mismo patrón por módulo)
  tenant/    ✅ UsersSection (lista de usuarios de la agencia + alta/edición
             con flujo de aprobación de doble OWNER, botones Aprobar/Rechazar
             condicionados a rol y a no ser quien solicitó el cambio;
             visible solo dentro de agencia/ para OWNER/ADMIN)
  trips/     ✅ BusesSection, RoomTypesSection, ActivitiesSection (listas
             autocontenidas usadas en el detalle de viaje)
  quotes/    ✅ OccupanciesSection (ocupaciones + alta/borrado de actividades
             inline por ocupación, respeta el snapshot de precios del backend)
  reservations/ ✅ TravelersSection (viajeros + asignación de asiento inline
             por autobús), DepositsSection (anticipos, marca el inicial)
lib/         ✅ api.ts (fetch autenticado + manejo de 401), auth.ts (sesión
             en localStorage, incluye el rol usado para gating de UI),
             clients.ts, providers.ts, trips.ts, quotes.ts, tenant.ts, users.ts,
             registration.ts (getPublicTenant/registerForTenant, sin auth),
             reservations.ts (tipos + llamadas por recurso, incluye
             QUOTE_TRANSITIONS y RESERVATION_TRANSITIONS espejo de los mapas
             del backend para la UI), formats.ts (formatDate compartido,
             fuerza timeZone: "UTC" para evitar el bug de día -1; también
             toUTCDateOnly/todayUTCDateOnly para comparar fechas-calendario
             sin que la zona horaria del navegador corra el día, usado por
             el dashboard) — cada módulo nuevo agrega su propio
             lib/<recurso>.ts
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

**Cambio de modelo de precios de habitación (2026-09-20):** `RoomType.pricePerAdult`/`pricePerMinor`
se reemplazaron por un solo `pricePerNight` — el precio de una habitación es una tarifa plana por
noche, igual sin importar si la ocupan adultos o menores. `QuoteOccupancy.subtotal` ahora es
`unitPricePerNight × noches` (noches = `trip.returnDate − trip.departureDate`); `adults`/`minors`
en la ocupación siguen existiendo pero solo para validar contra `maxOccupancy` y contar viajeros,
ya no afectan el precio. Migrado a mano contra Render (`prisma migrate dev` no corre en modo no
interactivo) y las cotizaciones/ocupaciones existentes se recalcularon con un script puntual para
que sus totales quedaran consistentes con la nueva fórmula — verificado que una cotización previa
a la migración sigue mostrando el total correcto tras el recálculo. Probado también el cálculo
completo end-to-end: habitación a $1000/noche en un viaje de 4 noches → ocupación → total $4000.

**Comisión de la agencia (2026-09-20):** así es como la agencia gana dinero — cada cotización
incluye una comisión del 5% sobre `subtotal` (habitaciones + actividades), guardada en el nuevo
campo `Quote.commission` (no solo mezclada en `total`, para que se pueda mostrar como línea aparte).
`total = subtotal + commission`. Tasa fija por ahora (`QUOTE_COMMISSION_RATE = 0.05` en
`quotes.service.ts`), no configurable por tenant. Igual que el cambio de precio por noche, migrado
a mano contra Render y con un script de recálculo para las cotizaciones existentes. Verificado en
navegador: cotización nueva ($4000 subtotal → $200 comisión → $4200 total) y una cotización previa
a la migración mostrando su comisión recalculada correctamente.

**Tema visual (decidido y aplicado a toda la app):** tema claro, fondo `slate-50`, tarjetas `white`
con borde `slate-200`, texto en escala de slate (`900` títulos, `700` cuerpo, `500` metadatos), y
**teal** como color primario (no el azul genérico original — se probaron ambos lado a lado y teal
"tiene más personalidad" para una agencia de viajes, sin chocar con los colores semánticos de los
badges). Badges de estado con el patrón `bg-X-100 text-X-800` mapeados por "tono" (`neutral` slate,
`info` sky, `success` emerald, `warning` amber, `danger` rose) en `components/ui/Badge.tsx` —
cualquier estado nuevo (viajes/cotizaciones/reservas) solo necesita agregarse a ese mapa, no
inventar clases nuevas.

**Modo oscuro (2026-09-20):** se activa solo por preferencia del sistema operativo — Tailwind v4
responde a `prefers-color-scheme: dark` con el prefijo `dark:` sin configuración adicional, no hay
switch manual en la UI. Paleta: fondo de página `slate-950`, tarjetas/sidebar/modal `slate-900`,
bordes `slate-800`/`slate-700`, texto en escala de slate invertida (`100` títulos, `300` cuerpo,
`400` metadatos), primario `teal-500` (más claro que el `teal-600` del modo claro, para que
destaque sobre fondo oscuro), y badges/pills con fondo translúcido `-500/10` + texto `-300` en vez
del bloque sólido claro (efecto "glow", más propio de UI oscuras). Aplicado a **toda la app**:
layout compartido (sidebar), las 6 pantallas de lista, las 3 de detalle, dashboard, login, y todos
los formularios/secciones anidadas (28 archivos en total) — cada `className` con color de modo
claro tiene su contraparte `dark:` al lado, sin excepciones. Verificado con Playwright emulando
`colorScheme: "dark"` en cada pantalla y flujo de detalle, y con un control en `colorScheme:
"light"` para confirmar que el modo claro no se alteró. Antes de expandirlo a toda la app, se
probó primero solo en Clientes para validar la paleta — ver `git log` para ese commit intermedio.

**Perfil del tenant / pantalla "Mi Agencia" (2026-09-20):** hasta ahora `Tenant` solo tenía
`name`/`slug`/`status` y no existía ningún endpoint de escritura (ni el propio OWNER podía editar
los datos de su agencia). Se agregaron `representativeName`, `address`, `contacts` (mismo patrón de
arreglo sin etiquetar que `Provider.contacts`) y `notes`, más `PATCH /tenants/me` (solo OWNER/ADMIN)
para editarlos. Alcance decidido explícitamente con el usuario: solo esto — **no** se construyó
ningún flujo para crear tenants nuevos ni un rol de "administrador de plataforma" por encima de
OWNER, porque ese concepto no existe todavía en la app (haría falta decidir autenticación cross-
tenant, un rol nuevo, etc. — se dejó como decisión futura explícita). La pantalla `agencia/` es la
primera con gating de UI por rol: el botón "Editar" se oculta si `session.role` no es OWNER/ADMIN,
verificado en Playwright simulando un rol AGENT vía localStorage (0 botones "Editar" renderizados).

**Módulo de registro de usuarios en "Mi Agencia" (2026-09-20):** agrega la sección "Usuarios"
(listar + registrar) directamente en `agencia/`, usando los endpoints de `users` que ya existían
sin frontend. En este momento (sin edición todavía) — **máximo 2 usuarios con rol OWNER por
tenant**, validado en `UsersService.create` (cuenta OWNERs activos antes de crear;
`BadRequestException` si ya hay 2). Verificado contra Render por curl (2do OWNER → 201, 3er OWNER →
400 "Ya existen 2 usuarios con rol OWNER en esta agencia") y en el formulario real de la UI viendo
ese mismo mensaje inline. Superado por la entrada siguiente, que sí agrega edición.

**Edición de usuarios con aprobación de doble OWNER (2026-09-20, mismo día):** el usuario pidió
edición de usuarios existentes, con la condición de que tanto el alta como la edición requieran
aprobación del *otro* OWNER antes de tomar efecto. Diseño:
- `User` gana `status: PENDING` (además de `ACTIVE`/`INACTIVE`), `requestedByUserId` (quién pidió
  el cambio), y `pendingName`/`pendingEmail`/`pendingRole` (la propuesta de edición, mientras los
  campos reales de un usuario ya `ACTIVE` no se tocan hasta aprobar).
- **Regla de bootstrap explícita (no pedida, inferida para evitar un deadlock):** la aprobación
  solo se exige a partir de que el tenant ya tiene 2 OWNERs activos. Con 1 solo OWNER (una agencia
  recién creada), sus altas/ediciones aplican de inmediato — si no, el primerísimo usuario que ese
  OWNER intentara crear se quedaría pendiente para siempre, porque no existiría un segundo OWNER
  capaz de aprobarlo.
- Alta: con aprobación pendiente, el usuario nuevo se crea con `status: PENDING` (no puede iniciar
  sesión — `AuthService.login` ya rechazaba cualquier `status !== 'ACTIVE'`, así que esto no
  necesitó tocarse) en vez de `ACTIVE`.
- Edición: con aprobación pendiente, los campos `pendingName`/`pendingEmail`/`pendingRole` guardan
  la propuesta completa (no solo el diff) y los campos reales no cambian todavía. No se puede editar
  un usuario que sigue `PENDING` de alta (hay que aprobar o rechazar esa alta primero).
  No incluye cambio de contraseña — fuera de alcance.
- `POST /users/:id/approve` y `POST /users/:id/reject` — **solo OWNER** (ni ADMIN, aunque ADMIN sí
  puede crear/editar), y nunca el mismo usuario que pidió el cambio (bloqueo de autoaprobación,
  aplica también aunque sea "el único otro OWNER" técnicamente igual a sí mismo). Rechazar un alta
  pendiente borra la fila; rechazar una edición pendiente solo limpia los campos `pending*`, dejando
  los datos reales intactos.
- El tope de 2 OWNERs ahora cuenta `ACTIVE` + `PENDING` juntos (antes solo contaba `ACTIVE`), para
  no permitir una 3ra alta de OWNER que técnicamente "cabría" mientras las primeras 2 siguen
  pendientes.
- Frontend (`UsersSection`): cada fila usuario muestra su estado pendiente si aplica (alta o
  edición) con quién lo solicitó; los botones "Aprobar"/"Rechazar" solo se muestran si
  `session.role === "OWNER"` y `session.id !== requestedByUserId` — si no, se muestra "Esperando
  aprobación del otro OWNER" (para quien pidió el cambio) sin controles.
- Verificado end-to-end con dos sesiones reales de Playwright (Owner A y Owner B logueados a la
  vez, cada uno en su propio browser context): A crea un usuario → quedó `PENDING`, A no puede
  aprobar su propia solicitud (400), B sí puede y lo activa. A edita un usuario ya activo → el
  nombre visible no cambia todavía, aparece "Cambio pendiente..." con quién lo pidió, A ve
  "Esperando aprobación" sin botones. B ve los botones, rechaza → confirmado por curl que el nombre
  real nunca cambió. También probado por curl: 3er OWNER bloqueado contando pendientes, y editar un
  usuario `PENDING` de alta rechazado con mensaje claro.

**Desactivar/reactivar usuarios (2026-09-21):** a diferencia de alta/edición, esto es deliberadamente
**inmediato y sin aprobación** — se decidió así en conversación explícita con el usuario, razonando
que revocar acceso es una respuesta de seguridad donde la urgencia pesa más que el control cruzado
(y reactivar, si alguien se equivoca, es trivial). `POST /users/:id/deactivate` y `/reactivate` son
OWNER-only pero no pasan por `requestedByUserId`/aprobación. Reglas: no puedes desactivarte a ti
mismo (`userId === requesterId` → 400), solo se puede desactivar un usuario `ACTIVE` y solo
reactivar uno `INACTIVE`, y reactivar a un OWNER vuelve a chequear el tope de 2 (por si desactivar
y reactivar se usó para "rotar" el cupo). `findAll` dejó de filtrar por status — ahora se listan
`ACTIVE`, `PENDING` e `INACTIVE` juntos, si no reactivar sería imposible desde la UI. Login ya
rechazaba cualquier `status !== 'ACTIVE'`, así que desactivar bloquea acceso sin tocar `AuthService`.
Verificado por curl (auto-desactivación bloqueada, login falla tras desactivar y vuelve a funcionar
tras reactivar, doble-desactivación bloqueada) y en navegador: fila propia sin botón "Desactivar",
el resto sí lo tiene, y el badge cambia a "Inactivo" con botón "Reactivar" en su lugar.

**Registro público de usuarios (2026-09-22):** el usuario aclaró que el alta desde "Mi Agencia" no
era lo que pedía — quería que la propia persona nueva se registre (sin sesión) y quede esperando
aprobación, no que el OWNER la dé de alta por ella. Eso obligó a resolver una pregunta que no
existía en la app: ¿cómo sabe el formulario público a qué tenant se está uniendo? Se confirmó con
el usuario: por el `slug` del tenant en la URL (`Tenant.slug` ya existía en el modelo pero no se
usaba en ningún lado hasta ahora). Diseño:
- `GET /tenants/:slug/public` y `POST /tenants/:slug/register` viven en un controller nuevo y
  deliberadamente **sin guards** (`PublicRegistrationController`) — es el único rincón de la API
  pensado para alguien sin sesión. El GET solo expone `{id, name, slug}`, nunca el perfil completo
  (dirección, contactos, stats) que si tiene `GET /tenants/me`.
- El rol de un registro público siempre es `AGENT`, fijo en el backend — el formulario ni lo pide.
  Nadie puede auto-asignarse OWNER/ADMIN/GUIDE por esta vía.
- **Siempre queda `PENDING`, sin excepción de bootstrap** — a diferencia del alta interna (que se
  auto-aprueba si el tenant tiene 0-1 OWNER activo), un registro público jamás se activa solo,
  incluso con un solo OWNER, porque cualquiera en internet podría pegarle al endpoint. `requestedByUserId`
  queda `null` (no hay quién lo pidió, es anónimo).
- Esto rompía el chequeo de aprobación existente: `assertHasPendingRequest` exigía
  `requestedByUserId` truthy antes de mirar si había algo pendiente — un registro público con
  `requestedByUserId: null` nunca hubiera podido aprobarse. Se corrigió para que la condición de
  "hay algo pendiente" dependa solo de `status === 'PENDING'` o los campos `pending*`, y el chequeo
  de auto-aprobación (`requestedByUserId === approverId`) solo aplique cuando `requestedByUserId`
  sí existe — cualquier OWNER puede aprobar un registro público, no hace falta que sea "el otro".
- Frontend: `app/registro/[slug]/page.tsx`, fuera del route group `(app)` (como el login, sin
  sidebar). Mismo lenguaje visual que el login (panel teal + tarjeta blanca). Confirma contraseña
  en el cliente (el backend no lo exige). Tras enviar, no intenta iniciar sesión — muestra un mensaje
  claro de "pendiente de aprobación" en vez de dejar que el login falle de forma confusa.
- Verificado por curl (tenant inexistente → 404, email duplicado → 409, aprobar sin
  `requestedByUserId` → funciona, login antes de aprobar → 401, rechazar borra la fila) y en
  Playwright: formulario completo, contraseñas no coinciden, envío exitoso, intento de login
  inmediato sigue fallando (correcto, sigue pendiente), y el registro aparece en "Mi Agencia" con
  "solicitada por —" y los botones Aprobar/Rechazar visibles para cualquier OWNER.

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
10. Máximo 2 usuarios con rol `OWNER` por tenant (cuenta `ACTIVE` + `PENDING`), validado tanto en
    alta como en edición de rol.
11. Con 2+ OWNERs activos, toda alta o edición de usuario queda `PENDING` hasta que el *otro* OWNER
    la apruebe — nunca el mismo que la solicitó. Con 0-1 OWNER activo no aplica (bootstrap).
12. Desactivar/reactivar un usuario es inmediato, sin aprobación — un OWNER no puede desactivarse a
    sí mismo.
13. El registro público (`POST /tenants/:slug/register`) siempre crea el usuario en `PENDING` con
    rol `AGENT` fijo, sin la excepción de bootstrap de la regla 11 — nunca se auto-activa, ni con
    0-1 OWNER en el tenant.

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
