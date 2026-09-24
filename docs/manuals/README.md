# Manuales de usuario por rol

Estos manuales describen qué puede hacer cada rol en Travify, módulo por módulo, tal como está
implementado hoy en el código (no es una aspiración de diseño — si algo cambia en el código y no se
actualiza aquí, este documento queda desactualizado y hay que corregirlo).

**Audiencia actual:** developers del equipo, como referencia para entender/validar el modelo de
permisos sin tener que leer cada `@Roles()` en cada controller. Cuando la aplicación pase a
producción, esta misma información se republicará como páginas (Artifact) dirigidas al personal
real de la agencia, con lenguaje menos técnico.

Clientes, Proveedores, Cotizaciones y Reservas se documentan **una sola vez aquí** porque OWNER,
ADMIN y AGENT tienen exactamente el mismo acceso a esos cuatro módulos — repetirlo en los tres
manuales solo agregaría trabajo de mantenimiento sin agregar información. Cada manual de rol cubre
lo que sí varía: Viajes, Mi Agencia/Mi Perfil, y cualquier restricción propia del rol.

- [owner.md](owner.md) — Propietario (`OWNER`)
- [admin.md](admin.md) — Administrador (`ADMIN`)
- [agent.md](agent.md) — Agente (`AGENT`)
- [guide.md](guide.md) — Guía (`GUIDE`)

## Conceptos compartidos por todos los roles

- **Multi-tenant:** cada usuario pertenece a una sola agencia (`tenant`). Todo lo que ve —
  clientes, viajes, cotizaciones, etc. — está limitado a su propia agencia; nunca ve datos de otra.
- **Login:** email + contraseña en `/`. No existe login separado por agencia — el email es único
  en toda la plataforma, así que el sistema ya sabe a qué tenant perteneces en cuanto inicias
  sesión.
- **Alta de nuevos usuarios:** existen dos caminos —
  1. Un OWNER o ADMIN da de alta al usuario desde "Mi Agencia" (ver [owner.md](owner.md) /
     [admin.md](admin.md)).
  2. La propia persona se autorregistra en `/registro/<slug-de-la-agencia>` (sin sesión) — siempre
     entra con rol `AGENT` fijo y queda pendiente de aprobación.
  En ambos casos, mientras el alta está pendiente, esa persona no puede iniciar sesión.
- **Aprobación por consenso:** con 2 OWNERs activos en la agencia (el máximo permitido), toda alta o
  edición de usuario necesita la aprobación de **todos los OWNERs activos excepto quien la
  solicitó** antes de aplicarse — con 2 OWNERs y un solicitante, eso es el otro OWNER; si nadie la
  solicitó (autorregistro público), la necesitan ambos. Con 0-1 OWNER activo, las altas/ediciones
  internas se aplican de inmediato (excepto el autorregistro público, que nunca se auto-aprueba).
  Rechazar solo necesita un OWNER, no consenso.
- **Modo oscuro:** se activa solo según la preferencia del sistema operativo del usuario, no hay un
  interruptor manual en la app.
- **Mi Perfil / Mi Agencia:** todo usuario tiene una vista de sus propios datos (nombre, email, rol,
  último acceso). Dónde vive esa vista y si puede editarla depende del rol — ver el manual
  correspondiente.

## Los cuatro roles, de un vistazo

| Rol | Ve Clientes/Proveedores/Cotizaciones/Reservas | Ve todos los Viajes | Crea/edita Viajes | Ve "Mi Agencia" | Edita datos de la agencia | Gestiona usuarios | Cambia roles |
|---|---|---|---|---|---|---|---|
| **OWNER** | Sí | Sí | Sí | Sí | Sí | Sí (crear/editar/aprobar/rechazar/(des)activar) | Sí |
| **ADMIN** | Sí | Sí | Sí | Sí | No | Sí (crear/editar — no aprueba/rechaza/(des)activar) | No |
| **AGENT** | Sí | Sí (solo lectura) | No | No | No | No | No |
| **GUIDE** | No | No (solo sus viajes asignados, solo lectura) | No | No | No | No | No |

El detalle de cada celda, con sus matices, está en el manual de cada rol.

## Clientes, Proveedores, Cotizaciones y Reservas — acceso compartido (OWNER, ADMIN, AGENT)

Estos cuatro módulos son **idénticos** para OWNER, ADMIN y AGENT: mismo acceso de lectura/escritura,
sin ninguna restricción adicional por rol dentro del módulo. No hay concepto de "mis clientes" — un
AGENT ve y puede editar todos los clientes de la agencia, no solo los que él mismo registró (el
campo `ownerUserId` de un cliente es solo metadata informativa, no filtra nada). GUIDE no tiene
acceso a ninguno de estos cuatro módulos — ver [guide.md](guide.md).

### Clientes

CRUD completo (crear, ver, editar, eliminar). Un cliente tiene una etapa (`stage`): Interesado → Prospecto
→ Cliente, o Inactivo. El borrado es lógico (el registro no desaparece de la base, solo se marca y
deja de listarse).

### Proveedores

CRUD completo. Un proveedor tiene un tipo: Hotel, Transportista u Otro. Borrado lógico, igual que
Clientes.

### Cotizaciones

- Se crean para un cliente y un viaje específicos; empiezan en estado **Borrador** con subtotal $0.
- Mientras está en Borrador se le agregan/editan/quitan ocupaciones (tipo de habitación + adultos y
  menores) y actividades opcionales por ocupación — cada cambio recalcula automáticamente subtotal,
  **comisión de la agencia (5% fijo)** y total. No hay que recalcular nada a mano.
- **El precio de una habitación es por persona, no por cuarto**: cada tipo de habitación tiene un
  precio por adulto/noche y un precio (normalmente menor) por menor/noche — así se refleja que en un
  viaje all-inclusive el costo real es sobre todo comida/bebida, que escala con quién ocupa el
  cuarto, no con la cama en sí. El subtotal de una ocupación es
  `(adultos × precio adulto + menores × precio menor) × noches`. Cambiar el precio de un tipo de
  habitación **no** afecta cotizaciones ya armadas con ese tipo — cada ocupación guarda una foto del
  precio al momento de crearse.
- Transiciones de estado permitidas: Borrador → Enviada / Rechazada / Expirada; Enviada → Aceptada /
  Rechazada / Expirada. Aceptada, Rechazada y Expirada son finales — no hay marcha atrás. Cualquier
  otro salto de estado se rechaza.
- **Una vez que sale de Borrador (Enviada o más allá), las ocupaciones y actividades quedan
  congeladas** — ya no se pueden agregar/editar/quitar líneas, solo cambiar el estado, las notas o la
  fecha de validez de la cotización completa.
- Solo se puede eliminar una cotización mientras sigue en Borrador.

### Reservas

- Se crea una reserva a partir de una cotización **Aceptada** (no de cualquier estado) — y solo
  puede existir una reserva por cotización.
- Estados: **Pendiente de anticipo** (inicial) → **Confirmada** → Completada / Cancelada. Pendiente
  de anticipo también puede pasar directo a Cancelada.
- **Confirmada no se alcanza manualmente** — no hay botón para eso. Se confirma automáticamente en
  cuanto se registra el anticipo inicial (ver Depósitos abajo).
- **Completada tampoco se alcanza manualmente en la práctica** — solo se puede pasar a Completada
  cuando el saldo (total de la cotización menos lo depositado) es $0 o menos; si se intenta con
  saldo pendiente, se rechaza. Igual que Confirmada, normalmente ocurre sola: en cuanto un depósito
  deja el saldo en $0, la reserva se completa automáticamente, sin que nadie tenga que cambiarle el
  estado.
- **Viajeros:** se agregan a una ocupación de la cotización, sin exceder su capacidad (adultos +
  menores). Solo un viajero puede ser el "titular" de la reserva, y el titular requiere teléfono.
  Cada viajero puede tener un asiento asignado en un autobús del viaje (un asiento no se puede
  asignar dos veces en el mismo autobús).
- **Depósitos:** son un registro contable de dinero ya recibido — no se editan ni se borran una vez
  creados (deliberado: reflejan algo que ya pasó fuera de la app). Solo puede haber un depósito
  marcado como "anticipo inicial" por reserva, y su monto debe ser al menos el anticipo mínimo que
  el viaje tiene configurado. Registrar ese anticipo inicial es lo que confirma la reserva.
