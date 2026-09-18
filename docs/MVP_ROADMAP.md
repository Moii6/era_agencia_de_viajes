# Roadmap del MVP — ERP para Agencia de Viajes

## 1. Objetivo del MVP

Construir una plataforma SaaS multi-tenant para agencias de viajes que permita:

- gestionar clientes y su historial de interacciones,
- crear y administrar viajes grupales,
- armar cotizaciones sobre viajes concretos,
- aceptar cotizaciones y convertirlas en reservas,
- registrar viajeros, depósitos y estados de reserva,
- operar la solución desde una web para la agencia.

El MVP está orientado a validar el flujo real de negocio de una agencia de viajes con salida fija, sin incluir pagos ni facturación electrónica.

---

## 2. Alcance del MVP

### Incluye
- Multi-tenancy por tenant
- Autenticación por usuario + JWT
- Roles: Owner, Admin, Agent, Guide
- CRM de clientes con interacciones
- Catálogo de proveedores
- Viajes con buses, tipos de habitación y actividades
- Cotizaciones por ocupación
- Reservas con viajeros y depósitos
- Dashboard básico de actividades

### No incluye en este MVP
- pagos dentro de la app
- facturación CFDI
- reportes avanzados
- app móvil de seguimiento de viaje
- generación de PDF/itinerarios
- notificaciones push o colas complejas

---

## 3. Principios de arquitectura

### 3.1 Monorepo
Usar pnpm + Turbo para centralizar scripts y mantener apps separadas:

- apps/web: frontend Next.js
- apps/api: backend NestJS
- packages/db: Prisma + modelos compartidos

### 3.2 Base de datos
- PostgreSQL como base principal
- Prisma como ORM
- RLS en PostgreSQL como refuerzo de aislamiento de tenant
- IDs UUID y timestamps en todas las entidades de negocio
- dinero en Decimal, nunca float

### 3.3 Seguridad
- JWT con tenantId, role, email
- guard de autenticación
- guard de roles
- middleware/servicio que inyecta al usuario autenticado y su tenant
- validación de tenant en todas las queries de negocio

### 3.4 Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- estructura por módulos y componentes reutilizables

---

## 4. Arquitectura sugerida para el MVP

### Backend (NestJS)

src/
  app.module.ts
  main.ts
  common/
    decorators/
    guards/
    filters/
    interceptors/
    pipes/
  auth/
    auth.module.ts
    auth.service.ts
    auth.controller.ts
    dto/
    strategies/
    guards/
    decorators/
  tenant/
  users/
  clients/
  interactions/
  providers/
  trips/
    dto/
    validations/
  room-types/
  activities/
  quotes/
    dto/
  quote-occupancies/
  reservations/
  travelers/
  deposits/
  prisma/
    prisma.module.ts
    prisma.service.ts

### Frontend (Next.js)

src/
  app/
    (auth)/login
    (dashboard)/page.tsx
    clientes/page.tsx
    viajes/page.tsx
    cotizaciones/page.tsx
    reservas/page.tsx
  components/
    layout/
    forms/
    tables/
    modals/
    ui/
  lib/
    api.ts
    auth.ts
    formats.ts
    schemas.ts
  types/
    api.ts

---

## 5. Modelo de dominio que debe estar operativo en el MVP

### 5.1 Tenant
- Agencia con sus usuarios y recursos aislados
- cada entidad de negocio lleva `tenantId`

### 5.2 User
- roles: OWNER, ADMIN, AGENT, GUIDE
- autenticación por email/password
- login con JWT

### 5.3 Client
- cliente o lead unificado
- stage: LEAD | PROSPECT | CUSTOMER | INACTIVE
- propietario opcional (`ownerUserId`)

### 5.4 Interaction
- nota, llamada, email, WhatsApp, reunión
- ligado a cliente, usuario y tenant

### 5.5 Provider
- hotel, transportista u otro proveedor
- usado en viajes y en el catálogo base

### 5.6 Trip
- viaje grupal con salida fija
- datos de salida, retorno, transporte, hospedaje, capacidad y anticipo mínimo

### 5.7 Bus
- autobus(es) del viaje
- asientos y chofer

### 5.8 RoomType
- tipo de habitación (doble, triple, individual, etc.)
- precio por adulto / menor

### 5.9 Activity
- actividad opcional del itinerario
- puede tener costo extra

### 5.10 Quote
- cotización para un cliente sobre un viaje
- estados: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- calcula subtotal y total

### 5.11 QuoteOccupancy
- grupo de viajeros que comparte habitación
- guarda snapshot del precio vigente al cotizar

### 5.12 Reservation
- confirmación de la cotización aceptada
- incluye viajeros, depósitos y status

### 5.13 Traveler
- viajero real de la reserva
- nombre, edad, teléfono, titular

### 5.14 Deposit
- anticipo o abono registrado fuera del sistema
- monto + fecha + referencia opcional

---

## 6. Reglas de negocio que deben implementarse en backend

Estas son eliminatorias para el MVP:

1. Multi-tenancy obligatorio: todo query de negocio debe estar filtrada por `tenantId`.
2. Un usuario solo debe acceder a recursos del tenant al que pertenece.
3. La cotización debe conservar snapshot de los precios en `QuoteOccupancy`.
4. La reserva debe derivarse de una cotización `ACCEPTED`.
5. La reserva debe tener un anticipo mínimo definido por `Trip.minimumDepositAmount`.
6. Cada viajero debe tener un único asiento en un bus del viaje.
7. Los viajes deben manejar capacidad total (turistas + guías) consistente con buses.
8. Los estados de reserva y cotización deben transitar de manera controlada.
9. Cada `Interaction` debe reportar quién la registró y cuándo.

---

## 7. Plan de desarrollo por fases

## Fase 1 — Base operativa

### Objetivo
Poner la base para que cualquier flujo del negocio pueda operar de manera segura.

### Tareas
- levantar Postgres y Redis con Docker
- ejecutar primera migración Prisma
- crear seed base de tenant y usuario owner
- completar autenticación JWT
- crear guard de tenant y roles
- crear endpoint `/auth/login` y `/auth/me`
- crear endpoints base para tenant y users

### Entregable
Un usuario owner puede iniciar sesión y operar dentro de un tenant válido.

---

## Fase 2 — CRM y viajes

### Objetivo
Permitir a la agencia gestionar clientes, interacciones y viajes con su catálogo asociado.

### Tareas
- CRUD de clientes
- historial de interacciones por cliente
- CRUD de proveedores
- crear trip con datos base
- agregar buses
- agregar room types
- agregar activities
- revisar validaciones del viaje

### Entregable
La agencia puede crear viajes listos para cotizar y vender.

---

## Fase 3 — Cotizaciones y reservas

### Objetivo
Completar el ciclo comercial del negocio.

### Tareas
- crear quote desde un cliente y un viaje
- definir ocupaciones y actividades opcionales
- calcular totales
- cambiar estados de cotización
- aceptar cita y crear reserva
- agregar viajeros
- asignar autobús y asiento
- registrar depósitos
- consultar saldo pendiente

### Entregable
El flujo completo cotización → aceptación → reserva está operativo.

---

## Fase 4 — Frontend MVP

### Objetivo
Que la agencia pueda manejar todo desde la web.

### Tareas
- layout base con sidebar y navegación
- pantalla de login
- dashboard principal
- pantalla de clientes
- pantalla de viajes
- pantalla de cotizaciones
- pantalla de reservas
- detalle de reserva con viajeros y depósitos
- integración con la API y manejo de errores

### Entregable
Una web funcional que pueda operar el negocio real.

---

## 8. Tareas técnicas priorizadas

## Prioridad 1: Backend y datos
- completar migración inicial de Prisma
- configuraciones de entorno (`.env`)
- crear seed demo
- JWT + guards
- tenant filtering
- CRUD de clientes
- CRUD de viajes
- CRUD de cotizaciones
- CRUD de reservas

## Prioridad 2: Web app
- login
- sidebar
- dashboard
- clientes
- viajes
- cotizaciones
- reservas

## Prioridad 3: Validaciones y UX
- errores formales
- dashboards y listas con filtros
- estados visuales por reserva/cotización
- validaciones de negocio en UI

---

## 9. Orden recomendado de implementación real

La secuencia más segura es esta:

1. Docker + Postgres + Redis
2. Prisma migrate + seed
3. Auth + JWT + roles + tenant
4. Clientes + interacciones
5. Proveedores
6. Viajes + buses + room types + activities
7. Cotizaciones
8. Reservas + viajeros + depósitos
9. Dashboard y navegación web
10. Polishing y validaciones

Esto evita construir pantalla sin soporte backend real.

---

## 10. Entregables del MVP final

Al terminar el MVP se debería poder demostrar en una sola sesión:

- iniciar sesión con un usuario del tenant,
- crear un cliente,
- crear un viaje con buses y tipos de habitación,
- cotizar para ese cliente,
- aceptar la cotización,
- crear la reserva con viajeros,
- registrar un depósito inicial,
- ver el estado total de la reserva en la dashboard.

Ese flujo es la prueba final del MVP.

---

## 11. Siguiente paso recomendado

El siguiente paso ejecutable es comenzar con la implementación de la base operativa:

1. levantar Postgres y Redis,
2. correr la migración inicial,
3. preparar auth con tenant,
4. dejar funcionando login + usuarios + clientes,
5. continuar luego con viajes y cotizaciones.

Este es el camino más corto para llegar a un MVP funcional sin sobre-diseñar.
