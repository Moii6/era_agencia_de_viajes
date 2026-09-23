# Manual de usuario — Administrador (ADMIN)

> Ver también: [conceptos compartidos por todos los roles](README.md#conceptos-compartidos-por-todos-los-roles).

## Resumen

El ADMIN opera el día a día de la agencia con casi el mismo alcance que un OWNER, con dos
excepciones deliberadas: no puede tocar el perfil de la agencia ni el rol de ningún usuario, y no
tiene la última palabra en las aprobaciones de usuarios (eso queda para el OWNER).

## Navegación

Ve el menú completo: Dashboard, Clientes, Proveedores, Viajes, Cotizaciones, Reservas, **Mi
Agencia**.

## Clientes, Proveedores, Cotizaciones, Reservas

Acceso completo, igual que OWNER y AGENT — ver el detalle en
[README: acceso compartido](README.md#clientes-proveedores-cotizaciones-y-reservas--acceso-compartido-owner-admin-agent).

## Viajes

Acceso completo, igual que OWNER: puede crear viajes, editarlos, cambiar su estado, y gestionar
autobuses, tipos de habitación y actividades.

## Mi Agencia

### Perfil de la agencia

Puede **ver** el perfil de la agencia (representante, dirección, contactos, notas) pero **no
editarlo** — no hay botón "Editar" para él, y aunque lo intentara por API directa (`PATCH
/tenants/me`) recibe 403. Solo OWNER puede editar estos datos.

### Gestión de usuarios

Puede:
- **Dar de alta** un usuario nuevo, incluyendo elegir su rol inicial (esa parte no está
  restringida — la restricción es sobre *cambiar* el rol de alguien que ya existe, no sobre
  asignarlo al crear).
- **Editar** nombre/email de cualquier usuario, incluido el suyo propio desde "Mi perfil".

No puede:
- **Cambiar el rol** de un usuario existente — el campo "Rol" se muestra como texto de solo lectura
  al editar a alguien (incluido al editarse a sí mismo). Si lo intenta por API directa
  (`PATCH /users/:id` con un `role` distinto), recibe 403 ("Solo un OWNER puede cambiar el rol de un
  usuario"). Esto existe específicamente para que un ADMIN no pueda auto-promoverse ni promover a
  nadie más.
- **Aprobar o rechazar** una alta o edición pendiente — esos botones y el endpoint correspondiente
  (`POST /users/:id/approve` y `/reject`) son exclusivos de OWNER.
- **Desactivar o reactivar** a otro usuario — también exclusivo de OWNER.

En la práctica, esto significa que cualquier alta o edición que el ADMIN proponga (si la agencia ya
tiene 2 OWNERs activos) queda pendiente hasta que un OWNER la revise — el ADMIN puede *iniciar* el
cambio pero no *cerrarlo* solo.

### Mi perfil

Ve sus propios datos y puede editarse (nombre/email, no rol) desde la tarjeta "Mi perfil", igual que
un OWNER.

## Lo que NO puede hacer

- Editar el perfil de la agencia.
- Cambiar el rol de cualquier usuario, incluido el suyo.
- Aprobar, rechazar, desactivar o reactivar a otro usuario.
