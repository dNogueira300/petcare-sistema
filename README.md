# Veterinaria PetCare — Sistema de Gestión

Sistema web para la gestión integral de una clínica veterinaria: citas, historias clínicas, clientes, mascotas y reportes. Desarrollado como proyecto de análisis de sistemas para la UNAP.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Autenticación | JWT personalizado con cookies httpOnly |
| Estilos | Tailwind CSS v4 |
| Formularios | React Hook Form + Zod |
| Correos | Brevo SDK (`@getbrevo/brevo`) |
| Despliegue | Vercel |

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

| Rol | Permisos |
|---|---|
| `administrador` | Acceso total, reportes, gestión de usuarios |
| `veterinario` | Citas, historia clínica, mascotas |
| `recepcionista` | Citas, clientes, mascotas |
| `cliente` | Solo portal: ver y reprogramar sus citas |

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Brevo (correos transaccionales)
BREVO_SMTP_PASS=xkeysib-...
BREVO_FROM_EMAIL=noreply@petcare.pe
BREVO_FROM_NAME=Veterinaria PetCare

# Cron job de recordatorios
CRON_SECRET=
```

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Despliegue

```bash
# Build de producción
npm run build
```

El proyecto está configurado para desplegarse en Vercel. Las rutas del proxy (`/api/proxy/*`) están definidas en `vercel.json`.

## Base de datos

El schema SQL completo se encuentra en `src/database/schema.sql`. Incluye las tablas, políticas RLS y la tabla `recordatorios_enviados` para el control de duplicados del cron.
