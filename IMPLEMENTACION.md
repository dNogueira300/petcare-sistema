# 📋 Resumen de Implementación — PetCare Sistema

**Fecha de generación:** 27 de mayo de 2026  
**Versión del proyecto:** 0.1.0  
**Estado:** En desarrollo

---

## 📌 Descripción General

**PetCare** es un sistema integral de gestión para clínicas veterinarias, desarrollado como proyecto académico para la materia Arquitectura de Sistemas de Información (ASI) en la FISI-UNAP 2026-I.

El sistema permite administrar:

- **Citas** con veterinarios
- **Historias clínicas** de mascotas
- **Clientes** y sus mascotas
- **Usuarios** (staff interno)
- **Reportes** y estadísticas
- **Portal de cliente** para autogestionarse
- **Recordatorios automáticos** por correo

---

## 🛠️ Stack Tecnológico

| Capa                          | Tecnología                           | Versión             |
| ----------------------------- | ------------------------------------ | ------------------- |
| **Framework Web**             | Next.js                              | 16.2.4 (App Router) |
| **Lenguaje**                  | TypeScript                           | 5.x                 |
| **Runtime**                   | React                                | 19.2.4              |
| **Base de datos**             | Supabase (PostgreSQL)                | 2.104.0             |
| **Autenticación**             | JWT personalizado + Cookies httpOnly | —                   |
| **Estilos**                   | Tailwind CSS                         | 4.x + PostCSS 4     |
| **Formularios**               | React Hook Form + Zod                | 7.72.1 + 4.3.6      |
| **Iconografía**               | Lucide React                         | 1.8.0               |
| **Correos**                   | Brevo (SMTP)                         | 5.0.4               |
| **Generación PDF**            | jsPDF + jsPDF-AutoTable              | 4.2.1 + 5.0.7       |
| **Validación de contraseñas** | bcryptjs                             | 3.0.3               |
| **Manejo de fechas**          | date-fns + date-fns-tz               | 4.1.0 + 3.2.0       |
| **Despliegue**                | Vercel                               | —                   |

---

## 📁 Estructura del Proyecto

### Raíz

```
.
├── AGENTS.md                    # Documentación de agentes (custom instructions)
├── CLAUDE.md                    # Referencia de breaking changes en Next.js 16
├── README.md                    # Documentación principal
├── IMPLEMENTACION.md            # Este archivo (resumen de implementación)
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración TypeScript
├── next.config.ts               # Configuración Next.js
├── vercel.json                  # Configuración del cron job en Vercel
├── .env.example                 # Variables de entorno de ejemplo
├── eslint.config.mjs            # Configuración ESLint
├── postcss.config.mjs           # Configuración PostCSS
├── tailwind.config.js           # Configuración Tailwind
├── public/                      # Activos estáticos
└── src/                         # Código fuente
```

### Estructura de `/src`

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Grupo de rutas: Autenticación
│   │   ├── login/               # Página de login
│   │   ├── register/            # Registro de clientes
│   │   ├── forgot-password/     # Recuperación de contraseña
│   │   └── reset-password/      # Reinicio de contraseña
│   │
│   ├── (dashboard)/             # Grupo de rutas: Dashboard principal
│   │   ├── dashboard/           # Página de inicio (admin)
│   │   ├── citas/               # Módulo de citas
│   │   ├── clientes/            # Módulo de clientes
│   │   ├── mascotas/            # Módulo de mascotas
│   │   ├── usuarios/            # Gestión de usuarios (admin)
│   │   ├── veterinarios/        # Gestión de veterinarios
│   │   ├── historia-clinica/    # Historias clínicas
│   │   └── reportes/            # Reportes y estadísticas
│   │
│   ├── portal/                  # Portal del cliente (acceso por token)
│   │   └── mascotas/            # Vista de mascotas y citas del cliente
│   │
│   ├── api/                     # API Routes (servidor)
│   │   ├── auth/                # Endpoints de autenticación
│   │   ├── citas/               # Endpoints CRUD y lógica de citas
│   │   ├── clientes/            # Endpoints de clientes
│   │   ├── mascotas/            # Endpoints de mascotas
│   │   ├── usuarios/            # Endpoints de usuarios
│   │   ├── veterinarios/        # Endpoints de veterinarios
│   │   ├── historia-clinica/    # Endpoints de historias clínicas
│   │   ├── reportes/            # Endpoints de reportes
│   │   ├── dashboard/           # Endpoints de datos para dashboard
│   │   ├── horarios-veterinario/# Gestión de horarios disponibles
│   │   ├── vacunas/             # Endpoints de vacunas
│   │   ├── esquemas-vacuna/     # Esquemas de vacunación
│   │   ├── recordatorios/       # Cron job de recordatorios por correo
│   │   ├── public/              # Endpoints públicos (registro sin auth)
│   │   └── portal/              # Endpoints del portal del cliente
│   │
│   ├── layout.tsx               # Layout principal (raíz)
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Estilos globales
│   └── favicon.ico              # Favicon
│
├── components/                  # Componentes React reutilizables
│   ├── layout/
│   │   ├── DashboardLayout.tsx  # Wrapper con sidebar + navbar
│   │   ├── Navbar.tsx           # Barra de navegación superior
│   │   └── Sidebar.tsx          # Menú lateral
│   │
│   ├── forms/                   # Formularios validados con Hook Form + Zod
│   │   ├── CitaForm.tsx         # CRUD de citas
│   │   ├── ClienteForm.tsx      # CRUD de clientes
│   │   ├── MascotaForm.tsx      # CRUD de mascotas
│   │   ├── HistoriaClinicaForm.tsx
│   │   ├── UsuarioForm.tsx      # Formulario de usuarios (admin)
│   │   ├── VacunaForm.tsx       # Gestión de vacunas
│   │   └── ChangePasswordForm.tsx
│   │
│   ├── tables/                  # Tablas de datos
│   │   └── .gitkeep             # (No hay implementadas aún)
│   │
│   ├── charts/                  # Gráficos del dashboard
│   │   └── .gitkeep             # (No hay implementados aún)
│   │
│   └── ui/                      # Componentes base sin lógica
│       ├── button.tsx           # Botones estilizados
│       ├── input.tsx            # Inputs
│       ├── select.tsx           # Select personalizado
│       ├── textarea.tsx         # Textareas
│       ├── card.tsx             # Tarjetas
│       ├── badge.tsx            # Etiquetas
│       ├── alert.tsx            # Alertas
│       ├── modal.tsx            # Modales
│       ├── avatar.tsx           # Avatares
│       ├── loading.tsx          # Spinner de carga
│       ├── password-strength.tsx # Indicador de fuerza de contraseña
│       ├── availability-calendar.tsx # Calendario de disponibilidad
│       ├── time-picker-12h.tsx  # Selector de hora (12h)
│       └── time-slots-grid.tsx  # Grid de horarios disponibles
│
├── context/                     # Context API de React
│   └── (Gestión de estado global)
│
├── hooks/                       # Custom hooks personalizados
│   └── (Hooks reutilizables)
│
├── database/                    # Configuración y esquema de BD
│   └── schema.sql               # SQL con tablas, relaciones, RLS y políticas
│
├── lib/                         # Utilidades y librerías
│   └── supabase/                # Cliente de Supabase configurado
│
├── utils/                       # Funciones utilitarias
│   ├── supabase/                # Funciones de acceso a Supabase
│   ├── datetime.ts              # Manejo de fechas y timezones
│   ├── password.ts              # Hash de contraseñas con bcrypt
│   ├── cartillaPdf.ts           # Generación PDF de cartilla de vacunas
│   ├── historialPdf.ts          # Generación PDF de historia clínica
│   ├── reportePdf.ts            # Generación de reportes en PDF
│   └── reportes.ts              # Lógica de estadísticas y reportes
│
├── types/                       # Definiciones TypeScript
│   ├── index.ts                 # Tipos principales (Usuario, Cita, Mascota, etc.)
│   └── reportes.ts              # Tipos para reportes
│
└── proxy.ts                     # Proxy para renderizado en servidor (SSR)
```

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

1. **Registro de cliente** → Correo de verificación → Activación
2. **Login** → JWT generado → Cookie httpOnly
3. **Session** → Verificación de token en cada solicitud
4. **Logout** → Limpieza de cookie y sesión

### Roles y Permisos

| Rol             | Permisos                                    | Acceso             |
| --------------- | ------------------------------------------- | ------------------ |
| `administrador` | Acceso total, gestión de usuarios, reportes | Dashboard completo |
| `veterinario`   | Citas, historia clínica, mascotas           | Dashboard limitado |
| `recepcionista` | Citas, clientes, mascotas                   | Dashboard limitado |
| `cliente`       | Ver y reprogramar sus citas                 | Portal único       |

### Seguridad

- **JWT Secret:** Criptografía de 64 bytes (generado con `crypto.randomBytes()`)
- **Contraseñas:** Hasheadas con bcryptjs
- **Cookies:** httpOnly, Secure, SameSite
- **RLS (Row Level Security):** Habilitado en Supabase para restricciones a nivel BD
- **Variables de entorno:** Separadas entre públicas y privadas

---

## 📊 Módulos Implementados

### 1. 📅 **Citas**

- CRUD completo con validación
- Calendario visual con disponibilidad
- Asignación a veterinarios
- Cálculo automático de horarios disponibles
- Cambio de estado (confirmada, cancelada, completada)
- Portal: Cliente puede ver y reprogramar sus citas

**Archivos clave:**

- `src/app/(dashboard)/citas/`
- `src/app/api/citas/`
- `src/components/forms/CitaForm.tsx`

### 2. 🐶 **Mascotas**

- Registro vinculado a cliente
- CRUD completo
- Cartilla de vacunas
- Historia clínica por mascota

**Archivos clave:**

- `src/app/(dashboard)/mascotas/`
- `src/app/api/mascotas/`
- `src/utils/cartillaPdf.ts`

### 3. 👤 **Clientes**

- CRUD de clientes
- Creación automática de cuenta si no existe
- Contacto y datos de emergencia
- Portal de acceso autogestionado

**Archivos clave:**

- `src/app/(dashboard)/clientes/`
- `src/app/api/clientes/`

### 4. 👥 **Usuarios (Staff)**

- Gestión de usuarios administrativos (admin solamente)
- Asignación de roles
- Gestión de veterinarios y sus horarios

**Archivos clave:**

- `src/app/(dashboard)/usuarios/`
- `src/app/api/usuarios/`

### 5. 👨‍⚕️ **Veterinarios**

- Registro de veterinarios
- Gestión de horarios disponibles
- Horarios por especialidad
- Cálculo de disponibilidad

**Archivos clave:**

- `src/app/(dashboard)/veterinarios/`
- `src/app/api/horarios-veterinario/`

### 6. 📋 **Historia Clínica**

- Registro por cita
- Diagnóstico, tratamiento, observaciones
- Visualización en PDF (cartilla)
- Historial completo por mascota

**Archivos clave:**

- `src/app/(dashboard)/historia-clinica/`
- `src/app/api/historia-clinica/`
- `src/utils/historialPdf.ts`

### 7. 📈 **Reportes**

- Estadísticas por estado de cita
- Reportes por veterinario
- Análisis por especie de mascota
- Reportes por día y origen
- Exportación a PDF

**Archivos clave:**

- `src/app/(dashboard)/reportes/`
- `src/app/api/reportes/`
- `src/utils/reportePdf.ts`
- `src/utils/reportes.ts`

### 8. 🌐 **Portal del Cliente**

- Acceso mediante token único
- Vista de mascotas
- Vista de citas
- Reprogramación de citas
- Descarga de cartilla de vacunas
- Acceso a historia clínica

**Archivos clave:**

- `src/app/portal/`
- `src/app/api/portal/`

### 9. 🔔 **Recordatorios Automáticos**

- Cron job ejecutado cada día a las **08:00 Lima (13:00 UTC)**
- Envío de recordatorios 24h antes de cada cita
- Control de duplicados con tabla `recordatorios_enviados`
- Solo activo en producción (Vercel)
- Integración con Brevo para correos

**Archivos clave:**

- `src/app/api/recordatorios/`
- `vercel.json` (configuración del cron)

### 10. 📊 **Dashboard**

- Métricas generales (solo admin)
- Próximas citas
- Gráficos y estadísticas
- Resumen de actividad

---

## 🗄️ Base de Datos

### Tecnología

- **Motor:** PostgreSQL vía Supabase
- **Seguridad:** Row Level Security (RLS) habilitado
- **Schema:** Definido en `src/database/schema.sql`

### Tablas Principales

| Tabla                    | Descripción                                     |
| ------------------------ | ----------------------------------------------- |
| `usuarios`               | Staff interno (admin, vet, recepcionista)       |
| `clientes`               | Clientes que usan la app                        |
| `mascotas`               | Mascotas vinculadas a clientes                  |
| `citas`                  | Citas veterinarias con estado                   |
| `historia_clinica`       | Registros médicos por cita                      |
| `veterinarios`           | Perfil de veterinarios (staff)                  |
| `horarios_veterinario`   | Horarios disponibles por veterinario            |
| `vacunas`                | Catálogo de vacunas                             |
| `esquema_vacunas`        | Esquemas de vacunación por especie              |
| `recordatorios_enviados` | Control de recordatorios para evitar duplicados |
| `verificaciones`         | Tokens de verificación para clientes            |

### Características de Seguridad

- Políticas RLS por rol
- Encriptación de datos sensibles (contraseñas con bcrypt)
- Foreign keys con on_delete cascade
- Timestamps automáticos (created_at, updated_at)

---

## 🔧 Configuración

### Variables de Entorno (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyxx...
SUPABASE_SERVICE_ROLE_KEY=eyxx...

# Autenticación
JWT_SECRET=<64 bytes aleatorios en hex>

# Aplicación
NEXT_PUBLIC_APP_NAME=PetCare
NEXT_PUBLIC_APP_URL=http://localhost:3000 (o URL de producción)
NEXT_PUBLIC_TIMEZONE=America/Lima

# Brevo (Correos transaccionales)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<usuario Brevo>
BREVO_SMTP_PASS=<contraseña Brevo>
BREVO_FROM_EMAIL=noreply@petcare.com
BREVO_FROM_NAME=PetCare

# Cron job de recordatorios
CRON_SECRET=<secreto para validar cron requests>
```

### TypeScript

- **Target:** ES2017
- **Modo estricto:** Habilitado
- **Path alias:** `@/*` → `./src/*`

### ESLint

- Configuración: `eslint.config.mjs` (ESLint 9+)
- Integrado con Next.js

### Tailwind CSS v4

- PostCSS v4
- Configuración personalizada en `tailwind.config.js`

---

## 🚀 Despliegue

### Desarrollo

```bash
npm install
npm run dev
```

Acceso: http://localhost:3000

### Build de producción

```bash
npm run build
npm run start
```

### Vercel

- **Detección automática:** Configurado para Next.js
- **Cron jobs:** Habilitado en `vercel.json`
  - Ruta: `/api/recordatorios`
  - Horario: Diario a las 13:00 UTC (08:00 Lima)
- **Despliegue:** Automático desde repositorio

---

## 📝 Scripts npm

| Script          | Descripción                                 |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Inicia servidor de desarrollo (puerto 3000) |
| `npm run build` | Compila el proyecto para producción         |
| `npm run start` | Inicia servidor de producción               |
| `npm run lint`  | Ejecuta ESLint                              |

---

## 🔌 Integraciones Externas

### Supabase

- Base de datos PostgreSQL
- Autenticación (con JWT personalizado)
- Storage (si es necesario)
- Row Level Security (RLS)

### Brevo

- Envío de correos transaccionales
- Recordatorios automáticos
- Emails de verificación
- SMTP via configuración en `.env.local`

### Vercel

- Hosting y despliegue
- Cron jobs para recordatorios
- CI/CD automático

---

## 📦 Dependencias Principales

### Runtime

- `next`: 16.2.4 — Framework web
- `react`: 19.2.4 — UI library
- `react-dom`: 19.2.4 — DOM binding
- `@supabase/supabase-js`: 2.104.0 — Cliente Supabase
- `@supabase/ssr`: 0.10.2 — SSR helpers

### Autenticación & Validación

- `react-hook-form`: 7.72.1 — Gestión de formularios
- `@hookform/resolvers`: 5.2.2 — Resolvers para validación
- `zod`: 4.3.6 — Validación de esquemas TypeScript
- `bcryptjs`: 3.0.3 — Hash de contraseñas

### Estilos & UI

- `tailwindcss`: 4.x — CSS framework
- `@tailwindcss/postcss`: 4.x — Integración PostCSS
- `lucide-react`: 1.8.0 — Iconografía

### Utilidades

- `date-fns`: 4.1.0 — Manejo de fechas
- `date-fns-tz`: 3.2.0 — Timezones
- `clsx`: 2.1.1 — Condicionales de classes
- `tailwind-merge`: 3.5.0 — Merge de clases Tailwind
- `react-day-picker`: 9.14.0 — Date picker
- `jspdf`: 4.2.1 — Generación de PDFs
- `jspdf-autotable`: 5.0.7 — Tablas en PDFs
- `@getbrevo/brevo`: 5.0.4 — Cliente Brevo

### DevDependencies

- `typescript`: 5.x — Lenguaje
- `eslint`: 9.x — Linting
- `eslint-config-next`: 16.2.4 — Config ESLint Next.js

---

## 🎯 Estado de Implementación

### ✅ Completado

- [x] Estructura base con Next.js 16 + App Router
- [x] Autenticación (login, registro, JWT)
- [x] CRUD de citas con validación de horarios
- [x] CRUD de clientes y mascotas
- [x] CRUD de usuarios (admin)
- [x] CRUD de veterinarios y horarios
- [x] Historia clínica por cita
- [x] Cartilla de vacunas (PDF)
- [x] Portal del cliente con token
- [x] Reportes y estadísticas
- [x] Recordatorios automáticos (cron job)
- [x] Correos transaccionales (Brevo)
- [x] Validación de formularios (Hook Form + Zod)
- [x] Estilos con Tailwind CSS v4
- [x] RLS en Supabase
- [x] Despliegue en Vercel

### 🔄 En Progreso / Mejoras Futuras

- [ ] Gráficos del dashboard (charts: recharts o chart.js)
- [ ] Tablas avanzadas con paginación
- [ ] Tests unitarios e integración
- [ ] Componentes chart implementados
- [ ] Analytics y métricas avanzadas
- [ ] Sincronización offline

---

## 📞 Contacto y Responsables

**Proyecto académico:**

- Materia: Arquitectura de Sistemas de Información (ASI)
- Universidad: UNAP - FISI
- Periodo: 2026-I
- Grupo: Grupo 01

---

## 📄 Licencia

Proyecto académico sin licencia específica.

---

**Última actualización:** 27 de mayo de 2026
