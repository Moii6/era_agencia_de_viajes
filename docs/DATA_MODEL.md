# Modelo de datos — MVP + Seguimiento de viaje

**v2 — reescrito tras describir el flujo real de la agencia de prueba.** El negocio no es "cotizar
servicios sueltos por cliente": es un catálogo de **viajes grupales con salida fija** (ej. "Vallarta"),
con hospedaje/tipos de habitación con precio por turista, transporte normalmente incluido, e
itinerario de actividades opcionales. Ver decisiones en [PLANNING.md](PLANNING.md).

**Convención de nombres:** identificadores de modelos/campos en inglés (convención estándar de
Prisma/Postgres); los textos de UI y datos de negocio van en español.

## 1. Flujo de negocio (confirmado)

1. La agencia crea un **Viaje** (`Trip`): destino, fecha/hora/punto de salida, fecha/hora/punto de
   retorno, número máximo de viajeros (cupo), si el transporte va incluido (normalmente uno o más
   **autobuses** de pasajeros, `Bus`), el hospedaje (hotel + tipos de habitación disponibles con sus
   características y precio por turista), y opcionalmente un itinerario de actividades (con o sin
   costo extra).
2. Un agente arma una **Cotización** (`Quote`) para un cliente sobre ese Viaje: agrupa a los
   viajeros por "unidad de ocupación" (p. ej. 1 adulto + 1 menor comparten una habitación), el
   sistema calcula el precio según el tipo de habitación adecuado y las actividades opcionales que
   elijan.
3. Si el cliente acepta, la cotización se confirma como **Reserva** (`Reservation`) — en este punto
   se capturan los datos reales de cada **Viajero** (`Traveler`): nombre completo, edad, teléfono; se
   marca cuál de ellos es el **titular** de la reserva (normalmente el adulto responsable); y a cada
   viajero se le asigna un autobús y un número de asiento dentro de ese autobús.
4. Para asegurar el lugar se requiere un **anticipo inicial**, con un **monto mínimo** definido por
   el Viaje (`Trip.minimumDepositAmount`). Después del anticipo inicial puede haber más abonos. El
   cobro en sí ocurre fuera de la aplicación (efectivo, transferencia, etc.) — en el sistema solo se
   registra el monto y la fecha en que se recibió cada uno, como referencia (`Deposit`). El costo
   total debe quedar liquidado antes de que inicie el viaje; el saldo pendiente se calcula (`total de
   la Quote − suma de anticipos`), no se procesa ningún cobro dentro de la app.
5. Cada Viaje tiene un equipo de **Guías** de la agencia asignado — mínimo 2 guías + 1 **guía líder**
   (3 personas en total). Se encargan de que los pasajeros aborden el autobús correcto, dar
   indicaciones durante el recorrido y orientar a los viajeros hasta el destino. Un Viaje puede
   **crearse sin guías definidos todavía**; el mínimo de 2+1 debe cumplirse antes de que el viaje
   inicie, pero esto **no se bloquea a nivel de datos** — solo se muestra un aviso visual en la app
   si el viaje está por iniciar y el equipo está incompleto. Distinto es el caso de la cobertura por
   autobús: **todos los autobuses, sin excepción, deben tener al menos un guía asignado** — esta sí
   es una regla que la aplicación debe hacer cumplir activamente (no basta un aviso visual).
   Al igual que los viajeros, los guías (incluido el líder) también quedan asignados a un **autobús y
   asiento** específicos — viajeros y guías comparten un mismo espacio de asientos por autobús
   (`SeatAssignment`), así la base de datos garantiza que nunca se dupliquen. Cada autobús (`Bus`)
   también registra a su **chofer** (nombre, teléfono, licencia) — el chofer no tiene cuenta/login en
   el sistema, es solo un dato de referencia. El cupo del viaje (`Trip.capacity`) cuenta **turistas +
   guías** y debe coincidir con la suma de asientos de todos sus autobuses (`Σ Bus.seatCapacity`).
6. (Fase 2) El día del viaje, cualquiera de los guías asignados registra **Checkpoints** de un
   itinerario con hitos predefinidos (inicio de viaje, llegada al hospedaje, inicio/fin de cada
   actividad, inicio de retorno, fin del viaje); cada Reserva tiene su propio link de acceso para
   que los viajeros de ese grupo vean el avance — pero los checkpoints son del Viaje completo (todos
   los grupos del mismo viaje ven lo mismo).
7. Facturación: sigue fuera del sistema por ahora (sin cambios respecto a lo ya acordado). El registro
   de anticipos es informativo, no un módulo de pagos/cobros.

## 2. Principios (sin cambios respecto a v1)

- Multi-tenancy: `tenantId` en toda tabla de negocio + RLS de Postgres.
- IDs UUID v4. Dinero en `Decimal`, nunca float, siempre con `currency` (por ahora `"MXN"`).
- `createdAt`/`updatedAt` en todo; `deletedAt` (soft delete) en catálogos referenciados desde histórico.
- **Snapshot de precio en la Cotización:** `QuoteOccupancy` guarda el precio vigente al cotizar
  (`unitPriceAdult`/`unitPriceMinor`), así un cambio de precio posterior en `RoomType` no altera
  cotizaciones ya emitidas. La Reserva no duplica esos montos — es una confirmación de la Cotización
  aceptada, así que lee los montos de ahí (evita mantener dos copias de la misma información).

## 3. Diagrama de entidades

```
Tenant
 └─ User (role: OWNER | ADMIN | AGENT | GUIDE)

Client (CRM: unifica lead y cliente vía "stage")
 └─ Interaction (nota/llamada/email/whatsapp/reunión)

Provider (catálogo opcional: hotel, transportista, etc. — referenciado desde Trip)

Trip (Viaje — creado por la agencia, salida única con fecha fija, cupo (turistas+guías) == Σ asientos)
 ├─ TripGuide[] (mínimo 2 guías + 1 líder; cada autobús debe tener ≥1 guía — sí bloqueante)
 ├─ Bus[] (uno o más autobuses, cada uno con su chofer registrado)
 ├─ SeatAssignment[] (asiento único por autobús, ocupado por un Traveler o un TripGuide)
 ├─ RoomType[] (tipos de habitación disponibles, con precio por adulto/menor)
 ├─ Activity[] (itinerario opcional, con o sin costo extra)
 ├─ Quote[]
 └─ Checkpoint[] (fase 2 — hitos predefinidos del viaje completo: inicio, llegada, actividades, retorno, fin)

Quote (cotización sobre un Trip)
 ├─ QuoteOccupancy[] (grupo de viajeros que comparte habitación: N adultos + N menores)
 │   └─ QuoteOccupancyActivity[] (actividades opcionales elegidas por ese grupo)
 ├─ status: DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED
 └─ Reservation? (1:1, se crea al aceptar)

Reservation (confirmación de una Quote ACCEPTED)
 ├─ touristAccessToken (acceso sin cuenta para ver checkpoints del Trip)
 ├─ Traveler[] (nombre, edad, teléfono, con SeatAssignment propio; uno marcado isHolder = titular)
 ├─ Deposit[] (anticipos: monto + fecha; el primero debe cubrir Trip.minimumDepositAmount)
 └─ status: PENDING_DEPOSIT | CONFIRMED | CANCELLED | COMPLETED
```

## 4. Tablas (campos principales)

### Tenant / User / Client / Interaction
Sin cambios respecto a v1 (ver historial). Se mantiene `role` de User con `GUIDE` para fase 2.

### Provider *(catálogo opcional)*
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenantId | uuid FK | |
| name | string | Nombre del hotel/transportista |
| type | enum HOTEL/TRANSPORT/OTHER | |
| address | string? | Importante para hoteles |
| contacts | string[] | Teléfonos/emails sueltos, sin etiquetar; 0 o más |
| notes | text? | |
| deletedAt | timestamp? | |
| createdAt / updatedAt | timestamp | |

### Trip (Viaje)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenantId | uuid FK | |
| name | string | Ej. "Vallarta" |
| destination | string? | |
| departureDate | date | |
| departureTime | time? | |
| departurePoint | string | Punto de partida |
| returnDate | date | |
| returnTime | time? | |
| returnPoint | string | Punto de retorno |
| transportIncluded | boolean | Default true |
| transportNotes | string? | Ej. "Autobús ejecutivo" |
| lodgingIncluded | boolean | Default true |
| hotelProviderId | uuid FK → Provider? | Nullable si lodgingIncluded = false |
| capacity | int | Cupo máximo total (turistas + guías) — se establece al crear el viaje; debe coincidir con `Σ Bus.seatCapacity` |
| minimumDepositAmount | decimal | Monto mínimo exigido para el anticipo inicial de cada Reserva |
| status | enum DRAFT/PUBLISHED/CLOSED/COMPLETED/CANCELLED | |
| notes | text? | |
| createdAt / updatedAt | timestamp | |

Los guías asignados viven en la tabla puente `TripGuide` (relación muchos-a-muchos con `User`), no
como una FK directa en `Trip` — un viaje siempre tiene varios guías (mínimo 3).

### TripGuide (equipo de guías asignado al Trip)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | |
| userId | uuid FK → User | Debe tener `role = GUIDE` |
| isLead | boolean | Guía líder — exactamente uno en `true` por Trip (regla de aplicación) |
| createdAt | timestamp | |

El autobús/asiento de cada guía vive en `SeatAssignment` (ver tabla siguiente), no como FK directa
aquí — así se comparte el mismo espacio de asientos con `Traveler` y la unicidad queda garantizada
por la base de datos.

*Reglas de negocio sobre el equipo de guías:*
- Un Trip puede crearse y venderse sin `TripGuide` alguno.
- **Mínimo 2 guías + 1 líder** antes de que el viaje inicie (`Trip.departureDate`) — **no bloqueante**,
  solo un aviso visual en la app si el equipo sigue incompleto cerca de la fecha.
- **Todo autobús (`Bus`) del Trip debe tener al menos un guía asignado** (vía `SeatAssignment`) —
  **sí es bloqueante**: la aplicación debe impedir dejar un autobús sin guía (por ejemplo, al
  intentar finalizar/publicar la asignación de asientos), no solo advertir. No es un constraint de
  base de datos (comparar cardinalidad entre `Bus` y `TripGuide` no es un CHECK simple de Postgres),
  se aplica en la capa de servicio/backend.

### SeatAssignment (asiento único por autobús — lo ocupa un Traveler o un TripGuide)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | Redundante con `bus.tripId`, para consultas directas |
| busId | uuid FK → Bus | |
| seatNumber | string | |
| travelerId | uuid FK → Traveler?, unique | Uno de los dos debe estar presente (no ambos) |
| tripGuideId | uuid FK → TripGuide?, unique | Uno de los dos debe estar presente (no ambos) |
| createdAt | timestamp | |

*Unicidad de asiento (garantizada por la BD):* índice único en `(busId, seatNumber)` — al ser una
sola tabla para viajeros y guías, un asiento no puede duplicarse entre ambos tipos de ocupante.
*Exactamente uno de `travelerId`/`tripGuideId` presente* es una invariante de aplicación (Postgres no
tiene un `XOR` declarativo simple entre dos FKs nullable sin un `CHECK` a medida).

### Bus (Autobús asignado al Trip — específico de un Trip)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | |
| label | string | Ej. "Autobús 1" |
| providerId | uuid FK → Provider? | Transportista contratado, opcional |
| seatCapacity | int | Número de asientos disponibles en este autobús |
| plateOrUnitNumber | string? | Placa o número económico, opcional |
| driverName | string? | Chofer asignado — no es un usuario del sistema, solo dato de referencia |
| driverPhone | string? | |
| driverLicense | string? | Número de licencia, opcional |
| notes | text? | |

Los ocupantes de este autobús (viajeros y guías) se consultan vía `SeatAssignment.busId`.

### RoomType (Tipo de habitación — específico de un Trip)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | |
| name | string | Ej. "Doble", "Triple", "Individual" |
| characteristics | text? | Camas, vista, amenidades… |
| maxOccupancy | int | Total de personas que caben |
| pricePerAdult | decimal | |
| pricePerMinor | decimal | Siempre distinto al de adulto |
| quantityAvailable | int? | Nullable = sin control de inventario en MVP |
| currency | string | Default "MXN" |

### Activity (Itinerario opcional — específico de un Trip)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | |
| name | string | |
| description | text? | |
| scheduledAt | timestamp? | Fecha/hora dentro del itinerario, opcional |
| hasExtraCost | boolean | |
| price | decimal? | Null si `hasExtraCost = false` |
| currency | string | |

### Quote (Cotización)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenantId | uuid FK | |
| clientId | uuid FK → Client | |
| userId | uuid FK → User | Agente que cotiza |
| tripId | uuid FK → Trip | |
| status | enum DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED | |
| currency | string | |
| subtotal / total | decimal | Suma de `QuoteOccupancy.subtotal` (+ actividades) |
| validUntil | date? | |
| notes | text? | |
| createdAt / updatedAt | timestamp | |

### QuoteOccupancy *(grupo de viajeros que comparte habitación)*
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| quoteId | uuid FK → Quote | |
| roomTypeId | uuid FK → RoomType | Debe pertenecer al mismo `tripId` que la Quote |
| label | string? | Ej. "Familia Pérez", para distinguir grupos en la misma cotización |
| adults | int | |
| minors | int | |
| unitPriceAdult | decimal | Snapshot de `RoomType.pricePerAdult` al cotizar |
| unitPriceMinor | decimal | Snapshot de `RoomType.pricePerMinor` al cotizar |
| subtotal | decimal | `adults×unitPriceAdult + minors×unitPriceMinor` |

### QuoteOccupancyActivity *(actividades opcionales elegidas por ese grupo)*
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| quoteOccupancyId | uuid FK → QuoteOccupancy | |
| activityId | uuid FK → Activity | |
| quantity | int | Personas del grupo que toman la actividad (puede ser menor a adults+minors) |
| unitPrice | decimal | Snapshot de `Activity.price` |
| subtotal | decimal | |

### Reservation (Reserva — confirmación de una Quote aceptada)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenantId | uuid FK | |
| quoteId | uuid FK → Quote, unique | 1:1 — la Reserva no existe sin una Quote aceptada |
| status | enum PENDING_DEPOSIT/CONFIRMED/CANCELLED/COMPLETED | Nace en `PENDING_DEPOSIT`; pasa a `CONFIRMED` automáticamente al registrar el anticipo inicial (confirmado) |
| touristAccessToken | string unique | Link/código de acceso a checkpoints del Trip (fase 2) |
| createdAt / updatedAt | timestamp | |

*Saldo pendiente (no almacenado, se calcula):* `Quote.total − Σ Deposit.amount` de esa Reserva.
La app puede alertar si el viaje está próximo (`Trip.departureDate`) y el saldo sigue > 0.

### Traveler (Viajero — datos reales, capturados al confirmar)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| reservationId | uuid FK → Reservation | |
| quoteOccupancyId | uuid FK → QuoteOccupancy | A qué grupo/habitación pertenece |
| fullName | string | |
| age | int | |
| phone | string? | Requerido solo para el titular (`isHolder = true`); opcional para el resto |
| type | enum ADULT/MINOR | Coherente con la clasificación usada al cotizar (adults/minors) |
| isHolder | boolean | Titular de la reserva — exactamente uno en `true` por Reservation (regla de aplicación) |
| documentId | string? | INE/pasaporte, opcional |
| notes | text? | Alergias, requerimientos especiales, etc. |
| createdAt | timestamp | |

El autobús/asiento del viajero vive en `SeatAssignment` (relación opcional 1:1 vía `SeatAssignment.travelerId`), no como FK directa aquí.

### Deposit (Anticipo — registro informativo, el cobro es externo)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| reservationId | uuid FK → Reservation | |
| amount | decimal | Si `isInitialDeposit = true`, debe ser ≥ `Trip.minimumDepositAmount` (validación de app) |
| currency | string | Default "MXN" |
| date | date | Fecha en que se recibió el anticipo (no necesariamente `createdAt`) |
| isInitialDeposit | boolean | El anticipo con el que se aseguró el lugar — exactamente uno en `true` por Reservation |
| note | text? | Ej. "Transferencia", "Efectivo en sucursal" |
| createdByUserId | uuid FK → User | Quién lo registró |
| createdAt | timestamp | |

### Checkpoint (Fase 2 — hitos predefinidos del Trip completo)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tripId | uuid FK → Trip | Ya no depende de Reservation — es del viaje completo |
| type | enum TRIP_START/LODGING_ARRIVAL/ACTIVITY_START/ACTIVITY_END/RETURN_START/TRIP_END/CUSTOM | Ej. secuencia: inicio de viaje → llegada al hospedaje → inicio actividad 1 → fin actividad 1 → … → inicio de retorno → fin del viaje |
| activityId | uuid FK → Activity? | Requerido cuando `type` es `ACTIVITY_START`/`ACTIVITY_END`; identifica cuál actividad |
| createdByUserId | uuid FK → User | Guía que lo registra; debería estar en el `TripGuide` de ese Trip (validación de app, no de schema) |
| label | string? | Texto libre — obligatorio cuando `type = CUSTOM`, opcional/descriptivo en los demás casos |
| note | text? | |
| occurredAt | timestamp | |
| createdAt | timestamp | |

## 5. Puntos a confirmar (asunciones que tomé para no bloquear el avance)

**Resuelto en esta ronda:** catálogo `Service` eliminado definitivamente; checkpoints confirmados por
Trip completo con hitos predefinidos; `minimumDepositAmount` es un monto fijo por Trip (no un
porcentaje); `Trip.capacity` cuenta turistas + guías y debe igualar `Σ Bus.seatCapacity`; viajeros y
guías comparten un modelo unificado `SeatAssignment` para que la unicidad de asiento la garantice la
base de datos; `Reservation` pasa automáticamente a `CONFIRMED` al registrar el anticipo inicial;
"todo autobús debe tener ≥1 guía" es una regla **bloqueante** (a diferencia del mínimo general de
2+1 guías, que sigue siendo solo un aviso visual).

No quedan asunciones abiertas de rondas anteriores. Únicos puntos a vigilar conforme se implemente:

- **Dónde exactamente se bloquea "autobús sin guía":** documenté la regla como bloqueante pero no el
  punto exacto de la UI/flujo donde se impide (¿al intentar publicar el viaje? ¿al guardar la
  asignación de asientos de ese autobús?) — es un detalle de flujo de trabajo, no de modelo de datos,
  se puede definir al construir la funcionalidad.

## 6. Borrador de schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
}

enum UserRole {
  OWNER
  ADMIN
  AGENT
  GUIDE
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum ClientStage {
  LEAD
  PROSPECT
  CUSTOMER
  INACTIVE
}

enum InteractionType {
  NOTE
  CALL
  EMAIL
  WHATSAPP
  MEETING
}

enum ProviderType {
  HOTEL
  TRANSPORT
  OTHER
}

enum TripStatus {
  DRAFT
  PUBLISHED
  CLOSED
  COMPLETED
  CANCELLED
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

enum ReservationStatus {
  PENDING_DEPOSIT
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum TravelerType {
  ADULT
  MINOR
}

enum CheckpointType {
  TRIP_START
  LODGING_ARRIVAL
  ACTIVITY_START
  ACTIVITY_END
  RETURN_START
  TRIP_END
  CUSTOM
}

model Tenant {
  id        String       @id @default(uuid())
  name      String
  slug      String       @unique
  status    TenantStatus @default(ACTIVE)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  users        User[]
  clients      Client[]
  interactions Interaction[]
  providers    Provider[]
  trips        Trip[]
  quotes       Quote[]
  reservations Reservation[]
}

model User {
  id           String     @id @default(uuid())
  tenantId     String
  tenant       Tenant     @relation(fields: [tenantId], references: [id])
  email        String     @unique
  passwordHash String
  name         String
  role         UserRole
  status       UserStatus @default(ACTIVE)
  lastLoginAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  clientsOwned      Client[]      @relation("ClientOwner")
  interactions      Interaction[]
  quotes            Quote[]
  guideAssignments  TripGuide[]
  checkpoints       Checkpoint[]
  deposits          Deposit[]

  @@index([tenantId])
}

model Client {
  id          String      @id @default(uuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  name        String
  email       String?
  phone       String?
  stage       ClientStage @default(LEAD)
  source      String?
  notes       String?
  ownerUserId String?
  owner       User?       @relation("ClientOwner", fields: [ownerUserId], references: [id])
  deletedAt   DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  interactions Interaction[]
  quotes       Quote[]

  @@index([tenantId])
}

model Interaction {
  id         String           @id @default(uuid())
  tenantId   String
  tenant     Tenant           @relation(fields: [tenantId], references: [id])
  clientId   String
  client     Client           @relation(fields: [clientId], references: [id])
  userId     String
  user       User             @relation(fields: [userId], references: [id])
  type       InteractionType
  content    String
  occurredAt DateTime
  createdAt  DateTime         @default(now())

  @@index([tenantId, clientId])
}

model Provider {
  id          String       @id @default(uuid())
  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  name        String
  type        ProviderType
  address     String?
  contacts    String[] @default([])
  notes       String?
  deletedAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  trips Trip[]
  buses Bus[]

  @@index([tenantId])
}

model Trip {
  id                   String     @id @default(uuid())
  tenantId             String
  tenant               Tenant     @relation(fields: [tenantId], references: [id])
  name                 String
  destination          String?
  departureDate        DateTime
  departureTime        String?
  departurePoint       String
  returnDate           DateTime
  returnTime           String?
  returnPoint          String
  transportIncluded    Boolean    @default(true)
  transportNotes       String?
  lodgingIncluded      Boolean    @default(true)
  hotelProviderId      String?
  hotelProvider        Provider?  @relation(fields: [hotelProviderId], references: [id])
  capacity             Int
  minimumDepositAmount Decimal    @db.Decimal(12, 2)
  status               TripStatus @default(DRAFT)
  notes                String?
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  guides          TripGuide[]
  buses           Bus[]
  seatAssignments SeatAssignment[]
  roomTypes       RoomType[]
  activities      Activity[]
  quotes          Quote[]
  checkpoints     Checkpoint[]

  @@index([tenantId])
}

model TripGuide {
  id        String   @id @default(uuid())
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  isLead    Boolean  @default(false)
  createdAt DateTime @default(now())

  seatAssignment SeatAssignment?

  @@unique([tripId, userId])
  @@index([tripId])
}

model Bus {
  id                String    @id @default(uuid())
  tripId            String
  trip              Trip      @relation(fields: [tripId], references: [id])
  label             String
  providerId        String?
  provider          Provider? @relation(fields: [providerId], references: [id])
  seatCapacity      Int
  plateOrUnitNumber String?
  driverName        String?
  driverPhone       String?
  driverLicense     String?
  notes             String?

  seatAssignments SeatAssignment[]

  @@index([tripId])
}

model SeatAssignment {
  id          String     @id @default(uuid())
  tripId      String
  trip        Trip       @relation(fields: [tripId], references: [id])
  busId       String
  bus         Bus        @relation(fields: [busId], references: [id])
  seatNumber  String
  travelerId  String?    @unique
  traveler    Traveler?  @relation(fields: [travelerId], references: [id])
  tripGuideId String?    @unique
  tripGuide   TripGuide? @relation(fields: [tripGuideId], references: [id])
  createdAt   DateTime   @default(now())

  @@unique([busId, seatNumber])
  @@index([tripId])
}

model RoomType {
  id                 String  @id @default(uuid())
  tripId             String
  trip               Trip    @relation(fields: [tripId], references: [id])
  name               String
  characteristics    String?
  maxOccupancy       Int
  pricePerAdult      Decimal @db.Decimal(12, 2)
  pricePerMinor      Decimal @db.Decimal(12, 2)
  quantityAvailable  Int?
  currency           String  @default("MXN")

  occupancies QuoteOccupancy[]

  @@index([tripId])
}

model Activity {
  id            String    @id @default(uuid())
  tripId        String
  trip          Trip      @relation(fields: [tripId], references: [id])
  name          String
  description   String?
  scheduledAt   DateTime?
  hasExtraCost  Boolean
  price         Decimal?  @db.Decimal(12, 2)
  currency      String    @default("MXN")

  occupancyActivities QuoteOccupancyActivity[]
  checkpoints         Checkpoint[]

  @@index([tripId])
}

model Quote {
  id         String      @id @default(uuid())
  tenantId   String
  tenant     Tenant      @relation(fields: [tenantId], references: [id])
  clientId   String
  client     Client      @relation(fields: [clientId], references: [id])
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  tripId     String
  trip       Trip        @relation(fields: [tripId], references: [id])
  status     QuoteStatus @default(DRAFT)
  currency   String      @default("MXN")
  subtotal   Decimal     @db.Decimal(12, 2)
  total      Decimal     @db.Decimal(12, 2)
  validUntil DateTime?
  notes      String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  occupancies QuoteOccupancy[]
  reservation Reservation?

  @@index([tenantId, clientId])
  @@index([tripId])
}

model QuoteOccupancy {
  id              String   @id @default(uuid())
  quoteId         String
  quote           Quote    @relation(fields: [quoteId], references: [id])
  roomTypeId      String
  roomType        RoomType @relation(fields: [roomTypeId], references: [id])
  label           String?
  adults          Int
  minors          Int
  unitPriceAdult  Decimal  @db.Decimal(12, 2)
  unitPriceMinor  Decimal  @db.Decimal(12, 2)
  subtotal        Decimal  @db.Decimal(12, 2)

  activities QuoteOccupancyActivity[]
  travelers  Traveler[]

  @@index([quoteId])
}

model QuoteOccupancyActivity {
  id                String         @id @default(uuid())
  quoteOccupancyId  String
  quoteOccupancy    QuoteOccupancy @relation(fields: [quoteOccupancyId], references: [id])
  activityId        String
  activity          Activity       @relation(fields: [activityId], references: [id])
  quantity          Int
  unitPrice         Decimal        @db.Decimal(12, 2)
  subtotal          Decimal        @db.Decimal(12, 2)

  @@index([quoteOccupancyId])
}

model Reservation {
  id                 String             @id @default(uuid())
  tenantId           String
  tenant             Tenant             @relation(fields: [tenantId], references: [id])
  quoteId            String             @unique
  quote              Quote              @relation(fields: [quoteId], references: [id])
  status             ReservationStatus  @default(PENDING_DEPOSIT)
  touristAccessToken String             @unique
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  travelers Traveler[]
  deposits  Deposit[]

  @@index([tenantId])
}

model Traveler {
  id                String         @id @default(uuid())
  reservationId     String
  reservation       Reservation    @relation(fields: [reservationId], references: [id])
  quoteOccupancyId  String
  quoteOccupancy    QuoteOccupancy @relation(fields: [quoteOccupancyId], references: [id])
  fullName          String
  age               Int
  phone             String?
  type              TravelerType
  isHolder          Boolean        @default(false)
  documentId        String?
  notes             String?
  createdAt         DateTime       @default(now())

  seatAssignment SeatAssignment?

  @@index([reservationId])
}

model Deposit {
  id                String      @id @default(uuid())
  reservationId     String
  reservation       Reservation @relation(fields: [reservationId], references: [id])
  amount            Decimal     @db.Decimal(12, 2)
  currency          String      @default("MXN")
  date              DateTime
  isInitialDeposit  Boolean     @default(false)
  note              String?
  createdByUserId   String
  createdBy         User        @relation(fields: [createdByUserId], references: [id])
  createdAt         DateTime    @default(now())

  @@index([reservationId])
}

model Checkpoint {
  id              String         @id @default(uuid())
  tripId          String
  trip            Trip           @relation(fields: [tripId], references: [id])
  type            CheckpointType
  activityId      String?
  activity        Activity?      @relation(fields: [activityId], references: [id])
  createdByUserId String
  createdBy       User           @relation(fields: [createdByUserId], references: [id])
  label           String?
  note            String?
  occurredAt      DateTime
  createdAt       DateTime       @default(now())

  @@index([tripId])
}
```
