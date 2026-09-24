# Happy path: de la cotización a la reserva completada

Guion de prueba manual, paso a paso, que recorre el flujo completo de venta: cliente → viaje →
cotización → envío → aceptación → reserva → viajeros → asientos → anticipos → reserva completada.
Cada paso trae la pantalla exacta, los campos a llenar (con valores concretos, listos para copiar) y
qué verificar antes de seguir. Pensado para probarse a mano en el navegador después de un cambio que
toque cotizaciones, viajes o reservas.

No es una prueba de permisos por rol — para eso están los [manuales por rol](manuals/README.md).
Cualquier OWNER, ADMIN o AGENT puede correr este flujo completo; un GUIDE no (solo ve sus propios
viajes asignados, sin poder cotizar ni reservar).

**Antes de empezar:** inicia sesión con un usuario OWNER, ADMIN o AGENT (por ejemplo
`owner@agenciadeprueba.mx`). Todos los valores de este guion son nuevos (no dependen de datos
previos en la base) — al terminar quedan un cliente, un viaje y una reserva de prueba adicionales;
bórralos si no los quieres dejar.

## 1. Crear el cliente

**Clientes → "+ Nuevo cliente"**

| Campo | Valor |
|---|---|
| Nombre * | `Ana Test` |
| Email | `ana.test@example.com` |
| Teléfono | `5555550001` |
| Etapa | `Interesado` (default) |

Guardar. Verifica que aparece en la tabla con etapa "Interesado".

## 2. Crear el viaje

**Viajes → "+ Nuevo viaje"**

| Campo | Valor |
|---|---|
| Nombre del viaje * | `Cancún Happy Path` |
| Destino | `Cancún` |
| Fecha de salida * | cualquier fecha futura, por ejemplo dentro de 30 días |
| Punto de salida * | `CDMX Terminal Norte` |
| Fecha de retorno * | 3 días después de la salida (el guion asume **3 noches**) |
| Punto de retorno * | `CDMX Terminal Norte` |
| Transporte incluido | marcado (default) |
| Hospedaje incluido | marcado (default) — Hotel puede quedar "Sin seleccionar" |
| Cupo máximo * | `10` |
| Anticipo mínimo (MXN) * | `1000` |

Guardar → te lleva al detalle del viaje (`/viajes/<id>`).

### 2.1 Agregar el tipo de habitación

**Sección "Tipos de habitación" → "+ Agregar"**

| Campo | Valor |
|---|---|
| Nombre * | `Doble Happy Path` |
| Ocupación máxima * | `2` |

`RoomType` no tiene precio — la cotización/reserva de la habitación se hace en la página del hotel,
así que este catálogo es solo informativo. Guardar. Verifica que la tarjeta muestre "Hasta 2
personas", sin ningún precio.

### 2.2 Agregar el autobús

**Sección "Autobuses" → "+ Agregar"**

| Campo | Valor |
|---|---|
| Etiqueta * | `Autobús HP-1` |
| Asientos * | `10` |

El resto de los campos (transportista, placa, chofer) quedan vacíos — no hacen falta para este guion.

### 2.3 Agregar la actividad opcional

**Sección "Actividades opcionales" → "+ Agregar"**

| Campo | Valor |
|---|---|
| Nombre * | `City Tour` |
| Tiene costo extra | marcado |
| Precio (MXN) * | `300` |

## 3. Crear la cotización

**Cotizaciones → "+ Nueva cotización"**

| Campo | Valor |
|---|---|
| Cliente * | `Ana Test` |
| Viaje * | `Cancún Happy Path` |

"Crear cotización" → te lleva al detalle (`/cotizaciones/<id>`). Estado: **Borrador**, subtotal $0.

### 3.1 Agregar la ocupación

**Sección "Ocupaciones" → "+ Agregar"**

| Campo | Valor |
|---|---|
| Tipo de habitación * | `Doble Happy Path (hasta 2)` |
| Etiqueta | `Habitación 1` |
| Adultos * | `1` |
| Menores | `1` |
| Precio total de la habitación (según el hotel) * | `4500` |

`adults`/`minors` aquí son solo informativos — le dicen al agente cuántas personas buscar en la
página del hotel; el precio que entra al cálculo es el que se escribe a mano, no algo derivado de
adultos/menores. Guardar. Verifica el subtotal de la ocupación: **$4500**, exactamente el número que
capturaste. Prueba también editar la ocupación cambiando solo Adultos/Menores (por ejemplo a 2
adultos) y confirma que el subtotal **no cambia** — son campos independientes del precio.

### 3.2 Agregar la actividad a la ocupación

Dentro de la misma tarjeta de ocupación, en el selector "Agregar actividad...":

| Campo | Valor |
|---|---|
| Actividad | `City Tour (+$300)` |
| Cantidad | `1` |

"+ Agregar". Verifica los totales de la cotización (arriba de "Ocupaciones"):

- Subtotal: **$4800** ($4500 habitación + $300 actividad)
- Comisión (5%): **$240**
- Total: **$5040**

### 3.3 Confirmar que la cotización está congelada solo en Borrador (opcional, para probar la regla)

Mientras sigue en Borrador, deberías poder seguir editando/quitando la ocupación y la actividad
libremente — no lo hagas si quieres seguir el guion tal cual. Este es el único punto en todo el
flujo donde "Ocupaciones" es editable; después del siguiente paso deja de serlo.

## 4. Enviar y aceptar la cotización

En el detalle de la cotización, usa el selector **"Cambiar estado..."** junto al botón "Editar":

1. Selecciona `SENT` → estado pasa a **Enviada**. Verifica que la sección "Ocupaciones" ya no
   muestra los botones "+ Agregar"/"Editar"/"Eliminar" — quedó congelada.
2. Selecciona `ACCEPTED` → estado pasa a **Aceptada**.

## 5. Crear la reserva

**Reservas → "+ Nueva reserva"**

| Campo | Valor |
|---|---|
| Cotización aceptada * | `Ana Test · Cancún Happy Path · $5040` |

"Crear reserva" → te lleva al detalle (`/reservas/<id>`). Estado: **Pendiente de anticipo**. La
tarjeta "Balance" debe mostrar Total $5040, Anticipado $0, Saldo $5040.

## 6. Agregar los viajeros

La ocupación de esta cotización se armó para 1 adulto + 1 menor — esa es la capacidad real de esta
reserva para esa habitación (2 personas en total), independientemente de que el tipo de habitación
admita hasta 2 en general.

**Sección "Viajeros" → "+ Agregar"** (dos veces)

Viajero 1 (el titular):

| Campo | Valor |
|---|---|
| Ocupación * | `Habitación 1 (0/2)` |
| Nombre completo * | `Ana Test` |
| Edad * | `32` |
| Tipo * | `Adulto` |
| Teléfono | `5555550001` |
| Es el titular de la reserva | marcado |

Viajero 2:

| Campo | Valor |
|---|---|
| Ocupación * | `Habitación 1 (1/2)` |
| Nombre completo * | `Test Jr` |
| Edad * | `8` |
| Tipo * | `Menor` |
| Notas | `Hijo del titular` |

Después de agregar al segundo, el selector de ocupación debería mostrar `Habitación 1 (2/2)` y
quedar deshabilitado — la ocupación ya está llena. Intenta agregar un tercer viajero para confirmar
que no te deja (o que la única ocupación disponible aparece deshabilitada).

## 7. Asignar asientos

Debajo de cada viajero sin asiento asignado hay un selector de autobús + número de asiento.

| Viajero | Autobús | Asiento |
|---|---|---|
| Ana Test | `Autobús HP-1` | `1` |
| Test Jr | `Autobús HP-1` | `2` |

Después de asignar, cada tarjeta debe mostrar `Asiento: Autobús HP-1 · #1` (o `#2`) con la opción
"Quitar asiento" en vez del selector.

## 8. Registrar el anticipo inicial

**Sección "Anticipos" → "+ Agregar"**

| Campo | Valor |
|---|---|
| Es el anticipo inicial (mínimo $1000 — confirma la reserva) | marcado (default) |
| Monto (MXN) * | `1000` |
| Fecha * | hoy (default) |

"Registrar anticipo". Verifica:

- La reserva pasa sola a **Confirmada** (sin tocar ningún selector de estado — no debería haber uno
  visible todavía, ya que Completada solo se ofrece cuando el saldo llega a 0).
- Tarjeta "Balance": Anticipado $1000, Saldo **$4040**.
- El depósito aparece en la lista con la etiqueta "Inicial".

## 9. Registrar el anticipo que salda el resto

**Anticipos → "+ Agregar"** otra vez — esta vez el checkbox de "anticipo inicial" ya no aparece
(solo puede haber uno).

| Campo | Valor |
|---|---|
| Monto (MXN) * | `4040` |
| Fecha * | hoy |

"Registrar anticipo". Verifica:

- La reserva pasa sola a **Completada** — de nuevo, sin ningún cambio de estado manual.
- Balance: Anticipado $5040, Saldo **$0**.

## Resultado esperado (checklist final)

- [ ] Cliente "Ana Test" existe, etapa Interesado.
- [ ] Viaje "Cancún Happy Path" con 1 tipo de habitación, 1 autobús, 1 actividad.
- [ ] Cotización: Borrador → Enviada → Aceptada, total $5040 (habitación $4500 + actividad $300,
      comisión $240).
- [ ] Reserva: Pendiente de anticipo → Confirmada (automático, al anticipo inicial) → Completada
      (automático, al saldar el resto).
- [ ] 2 viajeros, ambos con asiento asignado, ocupación llena (2/2).
- [ ] 2 depósitos ($1000 inicial + $4040), saldo final $0.

Si algún paso no da el resultado esperado, es una regresión — compara contra las reglas de negocio
documentadas en [docs/PLANNING.md §7.3](PLANNING.md) y en las entradas fechadas correspondientes
(precio de habitación capturado a mano: 2026-09-24; congelamiento de ocupaciones al salir de
Borrador: histórico; auto-confirmación/auto-completado de reservas: 2026-09-24).
