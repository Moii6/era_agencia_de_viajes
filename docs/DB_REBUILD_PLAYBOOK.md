# Playbook para recrear la base de datos en Render

## Objetivo

Este documento explica cómo reconstruir la base de datos cuando la instancia gratuita de Render expire o se recree, sin perder la capacidad de volver a levantar el entorno del proyecto.

---

## 1. Fuente de verdad del sistema

La base real no debe vivir solo como dato mutable en Render. La fuente de verdad del esquema debe estar en GitHub:

- [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- [packages/db/prisma/migrations](../packages/db/prisma/migrations)
- [packages/db/prisma/seed.ts](../packages/db/prisma/seed.ts)

Esto permite reconstruir el esquema y volver a cargar datos base sin depender de una instancia antigua.

---

## 2. Cuando expire la DB de Render

### Paso 1: crear una nueva base de datos

1. Ir a Render.
2. Crear un nuevo servicio PostgreSQL.
3. Elegir nombre y región.
4. Copiar la nueva connection string.

Ejemplo:

```bash
postgresql://usuario:password@host:5432/database?sslmode=require
```

---

### Paso 2: actualizar la variable de entorno

Actualizar la `DATABASE_URL` en el servicio de la app o en el entorno local correspondiente.

Ejemplo para el entorno local:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"
```

---

### Paso 3: regenerar Prisma Client

Desde la raíz del repo:

```bash
pnpm db:generate
```

---

### Paso 4: aplicar migraciones

```bash
pnpm --filter @erp/db migrate:deploy
```

Esto aplica todas las migraciones existentes de Prisma a la nueva base.

---

### Paso 5: sembrar datos base

```bash
pnpm --filter @erp/db seed
```

Esto ejecuta el seed para recrear el tenant demo y el usuario de prueba.

---

## 3. Flujo recomendado para recrear el entorno completo

```bash
pnpm install
pnpm db:generate
pnpm --filter @erp/db migrate:deploy
pnpm --filter @erp/db seed
```

Si la base fue creada limpia, este flujo deja el proyecto listo para trabajar.

---

## 4. Qué debe estar en el repo para no perder nada

Todo esto ya debe formarse parte del repositorio:

- schema Prisma completo
- migraciones generadas
- seed base con datos demo
- variables ejemplo en `.env.example`
- documentación de despliegue y configuración

Con esto, una DB nueva es solo un paso de infraestructura, no una pérdida de trabajo.

---

## 5. Recomendación de operación

Para este proyecto, la estrategia ideal es:

- Render free para empezar
- GitHub como origen del código
- Prisma como fuente de verdad del esquema
- seed como restaurador de datos base de pruebas

Así, aunque la instancia gratuita expire, el proyecto sigue listo para recrearse en pocos minutos.

---

## 6. Checklist rápido para reconstrucción

- [ ] crear nueva PostgreSQL en Render
- [ ] obtener nueva `DATABASE_URL`
- [ ] actualizar env del servicio/app
- [ ] ejecutar `pnpm db:generate`
- [ ] ejecutar `pnpm --filter @erp/db migrate:deploy`
- [ ] ejecutar `pnpm --filter @erp/db seed`
- [ ] verificar login y flujo base

---

## 7. Consejo importante

No dependas de que la data de la DB gratuita siga existiendo. El estado funcional importante debe quedar siempre reproducible por:

- código,
- migraciones,
- seed,
- y variables de ejemplo.

Eso hace que el proyecto resista reinicios y cambios de proveedor sin perder la capacidad de continuar.
