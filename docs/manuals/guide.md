# Manual de usuario — Guía (GUIDE)

> Ver también: [conceptos compartidos por todos los roles](README.md#conceptos-compartidos-por-todos-los-roles).

## Resumen

El GUIDE es el rol más restringido de la app, pensado para alguien que puede no ser empleado fijo de
la agencia (un guía freelance, por ejemplo). Su acceso se reduce a ver el Dashboard y los viajes a
los que está explícitamente asignado — nada de clientes, proveedores, cotizaciones, reservas, ni
administración de la agencia. Es también el único rol que no puede editar absolutamente nada dentro
de la app, ni siquiera su propio perfil.

## Navegación

Ve solo: **Dashboard**, **Viajes**, **Mi Perfil**. Si intenta entrar por URL directa a Clientes,
Proveedores, Cotizaciones, Reservas o Mi Agencia, es redirigido automáticamente — a `/dashboard` en
los primeros cuatro casos, a `/perfil` en el caso de Mi Agencia. Este control existe tanto en el
frontend (el layout redirige) como en el backend (cada endpoint de esos módulos rechaza a GUIDE con
403 de todas formas).

## Dashboard

Muestra únicamente los viajes a los que el GUIDE está asignado (vía la relación `TripGuide`) — nunca
el catálogo completo de la agencia. Si no tiene ningún viaje asignado, en vez de las tarjetas
normales ve un mensaje: **"No tienes viajes asignados."**

## Viajes

**Solo ve los viajes a los que está asignado** — ni la lista ni el detalle muestran viajes ajenos, y
entrar por URL directa a un viaje no asignado da "Viaje no encontrado" (404), igual que si no
existiera; no hay forma de enumerar viajes ajenos ni siquiera por prueba y error de URLs. Esto
también aplica a los sub-recursos de un viaje (autobuses, tipos de habitación, actividades): pedirlos
directamente para un viaje no asignado también da 404.

Del viaje o los viajes a los que sí está asignado, ve el detalle completo — fechas, punto de
salida/retorno, transporte, hospedaje, cupo, anticipo mínimo, autobuses (con chofer/placas), tipos
de habitación, actividades opcionales — pero **en modo estrictamente de solo lectura**: no hay
selector de estado, no hay botón "Editar", y las secciones de autobuses/habitaciones/actividades no
muestran los botones "+ Agregar"/"Editar"/"Eliminar" que sí ven OWNER/ADMIN. No es solo que la UI lo
oculte — el backend rechaza cualquier intento de crear/editar/eliminar en estos endpoints para
GUIDE de todas formas.

No hay botón "+ Nuevo viaje" para GUIDE (a diferencia de AGENT, que sí lo ve aunque tampoco pueda
usarlo con éxito).

## Mi Perfil

Ve sus propios datos (nombre, email, rol, último acceso). **No puede editarse a sí mismo** — el
botón "Editar" solo existe para OWNER/ADMIN.

## Lo que NO puede hacer

- Ver o hacer cualquier cosa en Clientes, Proveedores, Cotizaciones, Reservas o Mi Agencia.
- Ver un viaje al que no está asignado.
- Crear, editar, cambiar el estado, o eliminar nada relacionado con un viaje (ni siquiera uno propio
  asignado) — ni el viaje en sí, ni sus autobuses, tipos de habitación o actividades.
- Editar su propio perfil.
