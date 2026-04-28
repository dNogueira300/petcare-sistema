<div align="center">

# 🐾 Veterinaria PetCare

### Sistema de Gestión Integral

_Proyecto académico — Arquitectura de Sistemas de Información · UNAP 2026-I_

---

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 📋 Descripción

Sistema web para la gestión integral de una clínica veterinaria: citas, historias clínicas, clientes, mascotas y reportes. Incluye portal público para clientes y recordatorios automáticos por correo electrónico.

---

## 🛠️ Stack tecnológico

|     | Capa          | Tecnología                             |
| --- | ------------- | -------------------------------------- |
| ⚡  | Framework     | Next.js 15 (App Router)                |
| 🔷  | Lenguaje      | TypeScript                             |
| 🗄️  | Base de datos | Supabase (PostgreSQL + RLS)            |
| 🔐  | Autenticación | JWT personalizado con cookies httpOnly |
| 🎨  | Estilos       | Tailwind CSS v4                        |
| 📝  | Formularios   | React Hook Form + Zod                  |
| 📧  | Correos       | Brevo (SMTP via Nodemailer)            |
| 🚀  | Despliegue    | Vercel                                 |

---

## 📦 Módulos

| Módulo                    | Descripción                                                  | Roles con acceso                  |
| ------------------------- | ------------------------------------------------------------ | --------------------------------- |
| 📊 **Dashboard**          | Métricas, gráficos y próximas citas                          | Administrador                     |
| 📅 **Citas**              | CRUD completo con calendario visual y validación de horarios | Admin, Veterinario, Recepcionista |
| 🐶 **Mascotas**           | Registro y edición vinculada a clientes                      | Admin, Veterinario, Recepcionista |
| 👤 **Clientes**           | Gestión con creación de cuenta automática                    | Admin, Recepcionista              |
| 👥 **Usuarios**           | Administración de staff                                      | Administrador                     |
| 📋 **Historia clínica**   | Registro por cita                                            | Veterinario                       |
| 📈 **Reportes**           | Estadísticas por estado, veterinario, especie, día y origen  | Administrador                     |
| 🌐 **Portal del cliente** | Vista de citas, reprogramación y acceso vía token            | Cliente                           |
| 🔔 **Recordatorios**      | Envío automático de correo 24 h antes de cada cita           | Cron job automático               |

---

## 🔑 Roles y permisos

| Rol             | Permisos                                    |
| --------------- | ------------------------------------------- |
| `administrador` | Acceso total, reportes, gestión de usuarios |
| `veterinario`   | Citas, historia clínica, mascotas           |
| `recepcionista` | Citas, clientes, mascotas                   |
| `cliente`       | Solo portal: ver y reprogramar sus citas    |

---

## ⚙️ Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

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

# Cron job de recordatorios
CRON_SECRET=
```

> [!WARNING]
> Las variables `NEXT_PUBLIC_*` son visibles en el cliente. El resto son exclusivamente del servidor y **nunca deben exponerse ni commitearse**.

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🏗️ Build de producción

```bash
npm run build
npm run start
```

---

## 🗃️ Base de datos

El schema SQL completo se encuentra en `src/database/schema.sql`. Incluye tablas, relaciones, políticas RLS y la tabla `recordatorios_enviados` para el control de duplicados del cron job.

---

## 🔔 Cron job de recordatorios

El endpoint `POST /api/recordatorios` se ejecuta automáticamente cada día a las **08:00 hora Lima (13:00 UTC)** mediante Vercel Cron (configurado en `vercel.json`).

Para pruebas manuales con Thunder Client o Postman:

```
POST /api/recordatorios
x-cron-secret: <valor de CRON_SECRET>
```

> [!NOTE]
> El cron job solo se activa en producción. En desarrollo, el endpoint puede invocarse manualmente.

---

## ☁️ Despliegue en Vercel

El proyecto está configurado para desplegarse en Vercel con detección automática de Next.js. El cron job de recordatorios se activa automáticamente al estar en producción.

---

<div align="center">

Desarrollado con 🐾 por el **Grupo 01** · ASI · FISI-UNAP · 2026-I

</div>
