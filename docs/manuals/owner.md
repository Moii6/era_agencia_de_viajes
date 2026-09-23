# Manual de usuario — Propietario (OWNER)

> Ver también: [conceptos compartidos por todos los roles](README.md#conceptos-compartidos-por-todos-los-roles).

## Resumen

El OWNER es la máxima autoridad de la agencia. Máximo **2 OWNERs activos por agencia** (se cuentan
`ACTIVE` + `PENDING` juntos, para que no se pueda "colar" un 3ro mientras los primeros 2 siguen sin
aprobar). Es el único rol que puede editar el perfil de la agencia y el único que puede cambiar el
rol de otro usuario.

## Navegación

Ve el menú completo: Dashboard, Clientes, Proveedores, Viajes, Cotizaciones, Reservas, **Mi
Agencia**.

## Clientes, Proveedores, Cotizaciones, Reservas

Acceso completo, igual que ADMIN y AGENT — ver el detalle en
[README: acceso compartido](README.md#clientes-proveedores-cotizaciones-y-reservas--acceso-compartido-owner-admin-agent).

## Viajes

Acceso completo: puede crear viajes, editarlos, cambiar su estado (`DRAFT` → `PUBLISHED` →
`CLOSED`/`COMPLETED`/`CANCELLED`, sin una máquina de estados estricta — el selector permite
cualquier valor), y gestionar sus autobuses, tipos de habitación y actividades (agregar, editar,
eliminar). Ve todos los viajes de la agencia, no solo los que él mismo creó.

## Mi Agencia

### Perfil de la agencia

Único rol que puede **editar** el perfil de la agencia: nombre del representante, dirección,
contactos y notas (botón "Editar" en la parte superior de la página). `PATCH /tenants/me` es
`@Roles('OWNER')` en el backend — un ADMIN que lo intente por API directa recibe 403, no solo el
botón oculto en la UI.

### Gestión de usuarios

Puede:
- **Dar de alta** un usuario nuevo (nombre, email, contraseña, rol) desde "+ Agregar".
- **Editar** nombre/email de cualquier usuario (excepto el suyo propio, que gestiona desde "Mi
  perfil" — ver abajo).
- **Cambiar el rol** de cualquier usuario — esto es exclusivo de OWNER. Un ADMIN ve el campo "Rol"
  como texto de solo lectura al editar a alguien; el OWNER ve el selector.
- **Aprobar o rechazar** una alta o edición pendiente de otro usuario (exclusivo de OWNER — ADMIN no
  tiene estos botones ni el endpoint correspondiente). No puede aprobar/rechazar su propia
  solicitud, necesita al otro OWNER (o, si no hay solicitante — un autorregistro público —, la
  aprobación de todos los OWNERs activos, ver [conceptos compartidos](README.md)).
- **Desactivar / reactivar** a cualquier usuario que no sea él mismo — exclusivo de OWNER,
  inmediato, sin necesidad de aprobación del otro OWNER (es una respuesta de seguridad: revocar
  acceso no debería esperar). Reactivar a un OWNER vuelve a chequear el tope de 2.
- El tope de 2 OWNERs se revalida en cada alta, cambio de rol y reactivación — nunca se puede
  terminar con 3 OWNERs `ACTIVE`/`PENDING` a la vez.

No puede editar un usuario que todavía tiene una alta pendiente de aprobar (hay que aprobarla o
rechazarla primero).

### Mi perfil

Ve sus propios datos (nombre, email, rol, último acceso) en la tarjeta "Mi perfil", arriba del
perfil de la agencia. Puede editarse a sí mismo (botón "Editar" ahí mismo) — sujeto a las mismas
reglas de aprobación por consenso que cualquier otra edición si la agencia ya tiene 2 OWNERs
activos.

## Lo que NO puede hacer

- Superar el tope de 2 OWNERs activos en la agencia.
- Aprobar o rechazar una solicitud que él mismo generó.
- Desactivar su propia cuenta.
