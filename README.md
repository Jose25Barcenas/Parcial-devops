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
│   ├── services/               # Servicios API (api, auth, inscription, payment, document, admission)
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

## Variables de entorno

Configurables en `backend/.env` o en `docker-compose.yml`:

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `SPRING_DATA_MONGODB_URI` | `mongodb://localhost:27017/sion_db` | URI de MongoDB |
| `JWT_SECRET` | `sion-unac-secret-2026-change-in-production` | Clave JWT |
| `SERVER_PORT` | `3000` | Puerto del backend |
| `UPLOAD_DIR` | `./uploads` | Directorio de archivos subidos |

## API REST

Todos los endpoints usan prefijo `/api/v1`:

- **Auth**: `POST /auth/register`, `POST /auth/login`
- **Users**: `GET|PUT|DELETE /users`, `GET /users/{id}` (Admin)
- **Inscriptions**: `POST /inscriptions`, `GET /inscriptions/me`, `GET /inscriptions`, `GET /inscriptions/{id}`, `PATCH /inscriptions/{id}/status`
- **Payments**: `POST /payments`, `GET /payments/{id}`, `PATCH /payments/{id}/confirm`
- **Documents**: `POST /documents/upload`, `GET /documents/{inscriptionId}`, `GET /documents/doc/{id}`, `DELETE /documents/{id}`
- **Admissions**: `POST /admissions`, `GET /admissions/me`, `GET /admissions`, `GET /admissions/{id}`, `PATCH /admissions/{id}`

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


