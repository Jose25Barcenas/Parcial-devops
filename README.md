# SION - Sistema de Inscripcion y Admision Online

Plataforma web para gestionar el proceso de inscripcion y admision de aspirantes a programas academicos de pregrado de la Corporacion Universitaria Adventista (UNAC).

## Tecnologias y dependencias

**Frontend**
- React 19.2, Vite 8.2, CSS Modules
- Linter: oxlint

**Backend**
- Java 17, Spring Boot 3.3.5
- Spring Security, Spring Data MongoDB, JJWT 0.12.6 (JWT)
- MongoDB 7

**Infraestructura local**
- Docker + Docker Compose
- Node.js 18+, Maven, MongoDB (si se corre sin Docker)

## Estructura

```
sion_unac/
├── src/                        # Frontend React
│   ├── App.jsx                 # Componente principal
│   ├── main.jsx                # Entry point
│   ├── context/AuthContext.jsx  # Estado de autenticacion
│   ├── services/               # Servicios API (api, auth, inscription, payment, document, admission, user, goal, analytics)
│   └── styles/                 # CSS Modules
├── backend/                    # API REST (Spring Boot)
│   └── src/main/java/com/sion/backend/
│       ├── config/             # Security, CORS, Mongo
│       ├── model/  dto/  repository/
│       ├── service/  controller/
│       └── security/  exception/
├── docker-compose.yml          # MongoDB + Backend + Frontend
├── Dockerfile.frontend
├── nginx.conf
├── .gitlab-ci.yml              # Pipeline CI/CD
└── USER_STORIES.md
```

## Instrucciones de ejecucion

### Con Docker (Recomendado)

```bash
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# MongoDB: localhost:27017
```

### Desarrollo local (sin Docker)

```bash
# 1. MongoDB corriendo en localhost:27017

# 2. Backend
cd backend
mvn spring-boot:run

# 3. Frontend (otra terminal)
npm install
npm run dev
```

### Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de produccion
npm run preview   # Previsualizar build
npm run lint      # Linter (oxlint)
```

### Pruebas

```bash
# Backend
cd backend && mvn test
```

## Seguridad

- JWT con expiracion de 7 dias; el secret se configura por variable de entorno `JWT_SECRET` (docker-compose lo toma del `.env` del host si existe).
- Roles `admin`/`aspirant` verificados en servidor con `@PreAuthorize` + chequeo de pertenencia de recursos (defensa en profundidad).
- Bloqueo de cuenta: 5 intentos fallidos -> 15 min; el codigo de recuperacion vence en 10 minutos.
- `DEMO_MODE` (default `false` en la app, `true` en docker-compose para la demostracion) decide si `forgot-password` devuelve el codigo en la respuesta.
- Subidas: tipos permitidos pdf/jpeg/png, extension sanitizada (solo alfanumerica) y nombre generado con UUID (sin path traversal).
- El frontend valida el perfil contra `GET /auth/me` al arrancar y limpia la sesion si el token ya no sirve.

## Variables de entorno

Configurables en `backend/.env` o en `docker-compose.yml`:

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `SPRING_DATA_MONGODB_URI` | `mongodb://localhost:27017/sion_db` | URI de MongoDB |
| `JWT_SECRET` | `sion-unac-secret-2026-change-in-production` | Clave JWT |
| `SERVER_PORT` | `3000` | Puerto del backend |
| `UPLOAD_DIR` | `./uploads` | Directorio de archivos subidos |
| `JWT_SECRET` | (ver compose/.env) | Clave de firma JWT |
| `DEMO_MODE` | `false` (`true` en compose) | Devuelve el codigo de recuperacion en la respuesta |

## Funcionalidades destacadas

- **Flujo completo de inscripcion**: datos personales -> pago -> documentos -> resultado de admision, con progreso persistido por usuario.
- **Dashboard admin**: KPIs de gestion (ingresos, metas, tiempos por etapa), charts de ingresos mensuales, avance de metas, tabla y diagrama de procesos activos.
- **Panel de admisiones**: el admin decide Admitir/Rechazar por inscription (y puede cambiar la decision); el aspirante la consulta en `/admissions/me` y en la pantalla de Resultados con **fechas reales** de cada etapa.
- **Gestion de usuarios**: listar, cambiar rol (admin/aspirant) y eliminar cuentas desde el dashboard.
- **Seguridad**: JWT, roles (`admin`/`aspirant`), bloqueo tras 5 intentos (15 min), recuperacion de contrasena, proteccion de recursos entre usuarios (401/403).

## API REST

Todos los endpoints usan prefijo `/api/v1`:

- **Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` (bloqueo tras 5 intentos fallidos durante 15 min; `reset-password` tambien desbloquea la cuenta); `GET /auth/me` (autenticado: devuelve el perfil vigente, se usa al iniciar sesion para validar el rol)
- **Users** (solo rol `admin`): `GET /users`, `GET /users/{id}`, `PUT /users/{id}` (cambio de rol), `DELETE /users/{id}`
- **Inscriptions**: `POST /inscriptions` y `GET /inscriptions/me` (aspirante); `GET /inscriptions`, `GET /inscriptions/{id}`, `PATCH /inscriptions/{id}/status` (solo `admin`)
- **Payments**: `POST /payments` y `GET /payments/inscription/{id}` (dueno o `admin`); `GET /payments/{id}`, `PATCH /payments/{id}/confirm`, `PATCH /payments/{id}/receipt` (dueno o `admin`); `GET /payments/...` listado general no existe
- **Documents**: `POST /documents/upload`, `GET /documents/{inscriptionId}`, `GET /documents/doc/{id}`, `DELETE /documents/{id}` (dueno de la inscripcion o `admin`)
- **Admissions**: `POST /admissions`, `GET /admissions`, `GET /admissions/{id}`, `PATCH /admissions/{id}` (solo `admin`); `GET /admissions/me` (aspirante)
- **Analytics** (solo rol `admin`): `GET /analytics/kpis`, `GET /analytics/revenue`, `GET /analytics/revenue-monthly`, `GET /analytics/goals-progress`, `GET /analytics/by-program`, `GET /analytics/by-decision`, `GET /analytics/by-stage`, `GET /analytics/stage-averages`, `GET /analytics/monthly`, `GET /analytics/timeline`
- **Goals** (solo rol `admin`): `GET /goals`, `GET /goals/{id}`, `POST /goals`, `PUT /goals/{id}`, `DELETE /goals/{id}`

Los endpoints con restriccion devuelven `403` si el rol no coincide o si el usuario intenta acceder a recursos de otro (pago o documento ajeno); el `401` queda reservado para sesion no valida/expirada. Archivos subidos se sirven desde `GET /api/v1/uploads/{archivo}`. `GET /health` responde con el estado real de MongoDB (`200` ok / `503` degraded).

## Flujo de la aplicacion

1. **Inscripcion** - Datos personales y seleccion de programa
2. **Pago** - Derecho de inscripcion ($80.000 COP)
3. **Documentos** - Carga de documentos requeridos
4. **Resultados** - Consulta de decision de admision

## Credenciales de prueba

| Usuario | Email | Contrasena | Rol |
|---------|-------|------------|-----|
| Admin | admin@sion.edu.co | admin123 | admin |
| Aspirante | maria.garcia@correo.com | maria123 | aspirant |
| Aspirante | carlos.lopez@correo.com | carlos123 | aspirant |

## Pruebas en Postman

1. Login: `POST /api/v1/auth/login` con email y password
2. Copiar el token de la respuesta
3. Header: `Authorization: Bearer <token>`
4. Probar los endpoints protegidos


