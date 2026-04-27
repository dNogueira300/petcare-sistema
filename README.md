# Veterinaria PetCare — Sistema de Gestión

Sistema web para la gestión integral de una clínica veterinaria: citas, historias clínicas, clientes, mascotas y reportes. Desarrollado como proyecto académico de Arquitectura de Sistemas de Información — UNAP 2026-I.

## Stack tecnológico

| Capa          | Tecnología                             |
| ------------- | -------------------------------------- |
| Framework     | Next.js 15 (App Router)                |
| Lenguaje      | TypeScript                             |
| Base de datos | Supabase (PostgreSQL + RLS)            |
| Autenticación | JWT personalizado con cookies httpOnly |
| Estilos       | Tailwind CSS v4                        |
| Formularios   | React Hook Form + Zod                  |
| Correos       | Brevo (SMTP via Nodemailer)            |
| Despliegue    | Vercel                                 |

## Módulos

- **Dashboard** — métricas, gráficos y próximas citas (solo administrador)
- **Citas** — CRUD completo con calendario visual y validación de horarios
- **Mascotas** — registro y edición vinculada a clientes
- **Clientes** — gestión de clientes con creación de cuenta automática
- **Usuarios** — administración de staff (admin, veterinario, recepcionista)
- **Historia clínica** — registro por cita, acceso exclusivo para veterinarios
- **Reportes** — estadísticas por estado, veterinario, especie, día y origen
- **Portal del cliente** — vista de citas, reprogramación y acceso público vía token
- **Recordatorios** — envío automático de correo 24 h antes de cada cita (cron job)

## Roles

| Rol             | Permisos                                    |
| --------------- | ------------------------------------------- |
| `administrador` | Acceso total, reportes, gestión de usuarios |
| `veterinario`   | Citas, historia clínica, mascotas           |
| `recepcionista` | Citas, clientes, mascotas                   |
| `cliente`       | Solo portal: ver y reprogramar sus citas    |

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Autenticación
JWT_SECRET=

# App
NEXT_PUBLIC_APP_NAME=PetCare
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=America/Lima

# Brevo (correos transaccionales)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=PetCare

# Cron job de recordatorios (protege /api/recordatorios)
CRON_SECRET=
```

> Las variables `NEXT_PUBLIC_*` son visibles en el cliente. El resto son exclusivamente del servidor y nunca deben exponerse.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Build de producción

```bash
npm run build
npm run start
```

## Base de datos

El schema SQL completo se encuentra en `src/database/schema.sql`. Incluye tablas, relaciones, políticas RLS y la tabla `recordatorios_enviados` para el control de duplicados del cron job.

## Cron job de recordatorios

El endpoint `POST /api/recordatorios` se ejecuta automáticamente cada día a las **08:00 hora Lima (13:00 UTC)** mediante Vercel Cron (configurado en `vercel.json`). Requiere el header `x-cron-secret` con el valor de `CRON_SECRET` para autenticarse.

Para pruebas manuales usar Thunder Client o Postman:

```
POST /api/recordatorios
Header: x-cron-secret: <valor de CRON_SECRET>
```

## Despliegue

El proyecto está configurado para desplegarse en Vercel. El cron job de recordatorios se activa automáticamente al estar en producción.
