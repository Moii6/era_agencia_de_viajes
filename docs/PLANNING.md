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
  Row-Level Security (RLS) de PostgreSQL como refuerzo a nivel de base de datos. Es la opción con
  menor costo operativo para empezar y escala bien hasta que haya razones de negocio (compliance,
  tenants enterprise muy grandes) para separar por esquema o base de datos.
- **Roles iniciales:** Owner/Admin de agencia, Agente de ventas, Guía (rol de solo-operación para la
  app móvil de seguimiento, ver §7), (más adelante: Contador, Solo lectura).
- Cada request autenticado lleva el `tenant_id` resuelto desde la sesión/JWT; toda query pasa por
  un middleware que inyecta el filtro de tenant — nunca se confía en un `tenant_id` que venga del cliente.

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

## 4. Propuesta de stack técnico

| Capa | Elección | Motivo |
|---|---|---|
| Monorepo | pnpm + Turborepo | Compartir tipos/UI entre apps, builds incrementales |
| Frontend | Next.js (React) + TypeScript + Tailwind + shadcn/ui | Ecosistema maduro, buen DX, SSR para dashboards |
| Backend | NestJS (Node/TypeScript) | Estructura modular con DI, guards para aislar tenant, escala bien para dominio ERP |
| Base de datos | PostgreSQL | RLS nativo para multi-tenancy, robusto para modelos relacionales de ERP |
| ORM | Prisma | DX fuerte, migraciones versionadas; se complementa con RLS vía políticas SQL |
| Auth | Auth.js (Credentials + OAuth) con modelo propio de Tenant/Rol | Control total del modelo multi-tenant sin atarse a un proveedor externo de pago |
| Jobs/colas | BullMQ + Redis | Emails, recordatorios de cotizaciones por vencer, generación de PDFs |
| Documentos | Puppeteer o react-pdf | Generación de itinerarios/vouchers en PDF (fase 2) |
| Infra inicial | Docker Compose local → Railway/Render | Bajo costo operativo para validar el producto antes de ir a AWS/GCP |
| Testing | Vitest/Jest + Playwright | Unit/integration + e2e de flujos críticos (cotizar → reservar) |
| App móvil | Expo (React Native) + TypeScript | Comparte tipos/lógica con el backend Node; distribución OTA sin pasar por review de tiendas en cada cambio |
| Notificaciones push | Expo Push Notifications | Avisar a turista/guía cuando el guía registra un nuevo checkpoint |
| Actualización de checkpoints | Polling corto (p. ej. cada 30-60s) o refresh manual | Alcance es solo checkpoints manuales, no tracking en vivo; no se justifica WebSockets todavía |

Es una recomendación de partida, no una decisión cerrada — si tienes preferencia por otro lenguaje
(p. ej. Python/Django) o ya usas cierta infraestructura, lo ajustamos.

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

## 6. Roadmap por fases

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

## 7. Estado actual del repositorio

El monorepo ya está inicializado con la estructura y el modelo de datos descritos arriba como punto
de partida. Esto es lo que existe hoy:

- **Control de versiones:** `git init` hecho, rama `main`. Todo el contenido descrito abajo está en
  *staging* (`git add -A`) pero **sin commit inicial todavía** — pendiente de confirmación.
- **Monorepo:** pnpm workspaces + Turborepo, con `apps/*` y `packages/*` (`pnpm-workspace.yaml`,
  `turbo.json`, `package.json` raíz con scripts `dev`/`build`/`lint`/`typecheck`/`test`).
- **`apps/web`:** scaffold de Next.js 16 (App Router) + TypeScript + Tailwind, generado con
  `create-next-app`. Sin autenticación ni pantallas de negocio todavía — es el punto de partida.
- **`apps/api`:** scaffold de NestJS **10** (no la última versión: `@nestjs/cli` más reciente
  requiere Node ≥20.12/21.7 y el entorno de desarrollo tiene Node 20.11, así que se fijó v10 para que
  el CLI funcionara). Ya declara `@erp/db` como dependencia de workspace; sin módulos de dominio
  (Trip, Quote, Reservation, etc.) implementados todavía.
- **`packages/db`:** `schema.prisma` con **todas** las entidades de [DATA_MODEL.md](DATA_MODEL.md)
  (Tenant, User, Client, Trip, Bus, SeatAssignment, RoomType, Activity, Quote, QuoteOccupancy,
  Reservation, Traveler, Deposit, Checkpoint, etc.), cliente Prisma generado y funcionando desde
  `@erp/db`. El proceso de escribir el schema detectó y corrigió una relación inversa faltante
  (`Tenant.interactions`) gracias al validador de Prisma. **No se ha corrido ninguna migración**
  (`prisma migrate dev`) contra una base de datos real todavía — falta levantar Postgres y aplicar
  el primer `migrate dev` para generar la migración inicial.
- **`docker-compose.yml`:** Postgres 16 + Redis 7 para desarrollo local — definido pero no levantado
  (`docker compose up -d` pendiente de ejecutarse).
- **Verificado y pasando:** `pnpm install`, `pnpm db:generate`, `pnpm typecheck` y `pnpm lint` en las
  3 workspaces (vía Turborepo), y `next build` en `apps/web`.
- **Aún no implementado / no configurado:** autenticación (Auth.js), políticas RLS de Postgres,
  shadcn/ui, colas con BullMQ, generación de PDFs, la app móvil (Expo), y el setup de testing
  (Vitest/Playwright — el scaffold de Nest trae Jest por defecto pero sin pruebas de dominio propias).

## 8. Preguntas abiertas para siguientes pasos

- Sin agencia piloto por ahora: el desarrollo va guiado por este documento y se valida con datos
  de prueba propios; conviene reconfirmar el orden de prioridades del roadmap conforme avance el MVP.
- Cuando se retome el tema de pagos/facturación más adelante, será buen momento para definir PAC
  y flujo de cobro — no urgente hoy.
- **Commit inicial:** el contenido del repo está listo en staging pero no se ha confirmado el primer
  commit (ver §7) — falta que se apruebe explícitamente.
