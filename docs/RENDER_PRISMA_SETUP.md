# Configuración de PostgreSQL en Render + Prisma

## 1. Crear la base de datos en Render

1. Entra a Render.
2. Crea un servicio de tipo PostgreSQL.
3. Elige un nombre como:
   - `erp-agencia-viajes-dev`
4. Guarda estos datos:
   - Host
   - Port
   - Database
   - Username
   - Password

Render te entregará algo como:

```bash
postgresql://usuario:password@host:5432/database?sslmode=require
```

---

## 2. Configurar variables de entorno

### Prisma

Crea el archivo:

```bash
packages/db/.env
```

Con este contenido:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"
```

### API NestJS

Crea el archivo:

```bash
apps/api/.env
```

Con este contenido:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"
JWT_SECRET="cambia-esto-por-una-clave-muy-segura"
JWT_EXPIRES_IN="8h"
WEB_ORIGIN="http://localhost:3000"
PORT=3001
```

> Importante: estos archivos `.env` no deben subirse a Git.

---

## 3. Generar Prisma Client

Desde la raíz del proyecto:

```bash
pnpm db:generate
```

Esto usa el script definido en la raíz:

```json
"db:generate": "pnpm --filter @erp/db generate"
```

---

## 4. Crear migración inicial

Desde la raíz:

```bash
pnpm --filter @erp/db migrate:dev
```

Esto ejecuta:

```json
"migrate:dev": "prisma migrate dev"
```

Esto hace dos cosas:

1. crea una migración basada en el schema,
2. aplica esa migración a la base de datos actual.

---

## 5. Flujo recomendado de trabajo

### Durante el desarrollo

Cuando cambies el schema, haz esto:

```bash
pnpm db:generate
pnpm --filter @erp/db migrate:dev
```

### Cuando quieras revisar la base

```bash
pnpm --filter @erp/db studio
```

### Cuando despliegues

En un ambiente de producción o staging controlado:

```bash
pnpm --filter @erp/db migrate:deploy
```

> Nunca usar `migrate dev` en producción.

---

## 6. Recomendación para este proyecto

Como eres el único desarrollador y quieres que la base sea real y compartible, esta estrategia es adecuada:

- Render PostgreSQL = base principal de desarrollo
- Prisma = fuente de verdad del esquema
- `.env` local = secretos y conexión
- migraciones versionadas = control del schema

Esto evita:

- copiar DB entre equipos,
- trabajar con instancias desalineadas,
- perder tiempo con backups manuales.

---

## 7. Comandos útiles

```bash
pnpm install
pnpm db:generate
pnpm --filter @erp/db migrate:dev
pnpm --filter @erp/db studio
```

---

## 8. Archivo .gitignore recomendado

Asegúrate de que esto exista en el repo:

```gitignore
.env
.env.local
.env.*.local
```

Y que no se suba ningún archivo `.env` real.

---

## 9. Siguiente paso

Con esto listo, ya puedes:

- conectar Prisma con Render,
- crear la primera migración,
- y empezar a construir el MVP con una base real de desarrollo.
