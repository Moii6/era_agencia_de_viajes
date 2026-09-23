# Manual de usuario — Agente (AGENT)

> Ver también: [conceptos compartidos por todos los roles](README.md#conceptos-compartidos-por-todos-los-roles).

## Resumen

El AGENT es el rol de ventas/operación del día a día: clientes, cotizaciones y reservas son su
trabajo principal. Puede ver (pero no crear ni editar) el catálogo de viajes, y no tiene ningún
acceso a la administración de la agencia. Es también el rol con el que entra cualquiera que se
autorregistre desde `/registro/<slug>` — el autorregistro público siempre asigna `AGENT`, nunca
otro rol.

## Navegación

Ve: Dashboard, Clientes, Proveedores, Viajes, Cotizaciones, Reservas, **Mi Perfil**. No ve "Mi
Agencia" — si intenta entrar a `/agencia` por URL directa, es redirigido a `/perfil`.

## Clientes, Proveedores, Cotizaciones, Reservas

Acceso completo, igual que OWNER y ADMIN — ver el detalle en
[README: acceso compartido](README.md#clientes-proveedores-cotizaciones-y-reservas--acceso-compartido-owner-admin-agent).
No hay concepto de "mis clientes" ni "mis cotizaciones": el AGENT ve y opera sobre todo lo de la
agencia, no solo lo que él mismo creó.

## Viajes

**Solo lectura.** Puede ver el catálogo completo de viajes de la agencia (lista y detalle: fechas,
punto de salida/retorno, transporte, hospedaje, cupo, anticipo mínimo, autobuses, tipos de
habitación, actividades) pero no puede crear un viaje nuevo, editarlo, cambiar su estado, ni
agregar/editar/eliminar sus autobuses, tipos de habitación o actividades — esas acciones son
exclusivas de OWNER/ADMIN (`POST`/`PATCH`/`DELETE` en esos endpoints no incluyen `AGENT` en sus
roles permitidos). Aun así, la UI de detalle de viaje no oculta esos controles para AGENT como sí
lo hace para GUIDE — si un AGENT los usa, el backend los rechaza. (Nota para developers: esto es una
inconsistencia frontend/backend preexistente, no algo diseñado así a propósito — el frontend de
`/viajes/[id]` solo oculta controles de edición para GUIDE, no para AGENT.)

## Mi Perfil

Ve sus propios datos (nombre, email, rol, último acceso). **No puede editarse a sí mismo** — el
botón "Editar" en "Mi perfil" solo aparece para OWNER/ADMIN (`PATCH /users/:id` es
`@Roles('OWNER', 'ADMIN')` en el backend, así que tampoco funcionaría por API directa). Si necesita
corregir su nombre o email, tiene que pedírselo a un OWNER o ADMIN.

## Lo que NO puede hacer

- Crear, editar o cambiar el estado de un viaje, ni gestionar sus autobuses/habitaciones/actividades.
- Ver o editar el perfil de la agencia.
- Ver o gestionar la lista de usuarios de la agencia.
- Editar su propio perfil.
