# SION - Sistema de Inscripcion y Admision Online

Plataforma web para gestionar el proceso de inscripcion y admision de aspirantes a programas academicos de pregrado de la Corporacion Universitaria Adventista (UNAC).

## Equipo

- Jose Barcenas
- Miguel Martinez
- Andres Dias
- Norbey Lopez
- Jose Cerda
- Diego Afanador

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
├── terraform/                  # Infraestructura en AWS (VPC, ASG, CloudWatch)
│   ├── main.tf                 # VPC, subnets, security group, IAM, AMI
│   ├── launch_template.tf      # Plantilla de lanzamiento
│   ├── autoscaling.tf          # Auto Scaling Group + escalado por CPU
│   ├── cloudwatch.tf           # Dashboard + alarmas
│   ├── user_data.sh.tpl        # Despliegue automatico de la app en EC2
│   └── outputs.tf              # URLs y comandos de salida
├── docker-compose.yml          # MongoDB + Backend + Frontend + n8n (local)
├── docker-compose.deploy.yml   # Override para AWS (puerto 80)
├── n8n/workflows/              # Workflows de ejemplo para importar en n8n
├── Dockerfile.frontend
├── nginx.conf
├── .gitlab-ci.yml              # Pipeline CI/CD (lint, test, build, deploy)
└── USER_STORIES.md
```

## Instrucciones de ejecucion

### Con Docker (Recomendado)

```bash
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# MongoDB: localhost:27017
# n8n: http://localhost:5678 (admin / sion-n8n-2026)
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

## El proyecto en breve (pitch)

**Problema:** la UNAC gestionaba las inscripciones y admisiones de aspirantes de forma manual: formatos en papel, pagos sin integración, documentos dispersos y cero trazabilidad del proceso; los aspirantes desconocían el estado de su admisión.

**Solución:** SION es una plataforma web que digitaliza el ciclo completo —registro, pago del derecho de inscripción, carga de documentos y publicación del resultado— con dashboard administrativo de KPIs, automatización de notificaciones con n8n y credenciales académicas verificables con registro inmutable (piloto blockchain).

**DevOps:** el proyecto se entrega con pipeline CI/CD en GitLab (lint → test → build → deploy), infraestructura como código con Terraform en AWS (VPC, Auto Scaling, Launch Template) y monitoreo con dashboard de CloudWatch en verde.

## Despliegue en AWS (Terraform)

Infraestructura como código en `terraform/`:

| Recurso | Descripción |
|---|---|
| VPC | `10.0.0.0/16` con 2 subnets públicas (2 zonas de disponibilidad), IGW y route table |
| Security Group | Puertos 22 (SSH), 80 (app), 5173 y 3000 |
| IAM | Rol + instance profile con políticas de CloudWatch y SSM Session Manager |
| Launch Template | Plantilla con AMI Ubuntu 22.04 (o Packer), 20 GB gp3 y user data |
| Auto Scaling Group | min 1 / desired 1 / max 2, con escalado automático al 60% de CPU |
| CloudWatch | Dashboard `SION-Production-Dashboard` + 3 alarmas |

Flujo del user data en la instancia:

```
arranque EC2 → swap 3G → docker + docker-compose → git clone del repo
→ docker-compose up (mongo + backend + frontend en :80 + n8n)
→ cron cada 1 min: curl /health → publica métrica SION/Application HealthCheck
```

### Pasos

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # ajustar valores
terraform init
terraform plan
terraform apply    # aprobar con yes
```

### Salidas

- `cloudwatch_dashboard_url` → dashboard de CloudWatch
- `get_app_ip_command` → comando para obtener la IP pública de la app (la app queda en `http://<IP>`)

> El backend de estado local está por defecto. Si en la cuenta de AWS ya existe el bucket
> `sion-unac-tfstate`, descomentar el bloque `backend "s3"` en `terraform/main.tf`.

## CI/CD (GitLab CI)

| Etapa | Job | Que hace |
|-------|-----|----------|
| lint | `lint-frontend` | `npm run lint` (oxlint) |
| test | `test-backend` | `mvn test` con MongoDB como servicio |
| build | `build-frontend` / `build-backend` | Build e push de imagenes Docker al registry (solo `main`) |
| deploy | `deploy-aws` | **Manual**: SSH a EC2, `git pull` y `docker-compose up` con override de producción |

Variables requeridas para el deploy (Settings → CI/CD → Variables):

| Variable | Valor |
|----------|-------|
| `SSH_PRIVATE_KEY` | Contenido completo de `Jose25.pem` (Type: File) |
| `EC2_HOST` | IP pública de la instancia EC2 |

## Monitoreo (CloudWatch)

Dashboard **`SION-Production-Dashboard`** con:

- **Widget de texto**: titulo, problema que resuelve y arquitectura (para la demo)
- **CPU del Auto Scaling Group** y **Status Checks EC2** (0 = sano)
- **Salud de la app**: metrica propia `SION/Application HealthCheck` (1 = responde `/health`)
- **Red** (entrante/saliente) y **estado de alarmas** (OK = verde)

Alarmas (todas en estado **OK** cuando todo funciona):

| Alarma | Dispara si |
|---|---|
| `sion-status-check` | El status check de EC2 falla |
| `sion-app-health` | `/health` deja de responder por 2 minutos |
| `sion-cpu-high` | CPU > 80% durante 15 minutos |

## Checklist para la entrega (reunión)

Pasos que requieren credenciales o acceso (no se pudieron hacer antes):

1. **AWS**: `aws configure` con el Access Key/Secret del profe (región `us-east-2`)
2. **Terraform**: `cd terraform && terraform init && terraform apply`
3. **Verificar**: abrir la app en `http://<IP>` (login debe funcionar) y el dashboard en CloudWatch (todo verde)
4. **GitLab**: subir el repo y agregar en Settings → CI/CD las variables `SSH_PRIVATE_KEY` y `EC2_HOST`; activar el job manual `deploy-aws`
5. **Permisos**: que el dueño del proyecto suba tu rol de Guest a Reporter (para ver pipelines)

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
| `N8N_BASE_URL` | `http://n8n:5678` | URL interna de n8n para enviar eventos |
| `N8N_ENABLED` | `true` | Habilita el envio de eventos a n8n |
| `N8N_BASIC_AUTH_USER` | `admin` | Usuario de acceso a la UI de n8n |
| `N8N_BASIC_AUTH_PASSWORD` | `sion-n8n-2026` | Contrasena de la UI de n8n |

## Automatizacion con n8n

El backend envia eventos (sincrono, con timeout corto, sin bloquear la operacion) a n8n:

| Evento | Disparado en | Webhook |
|---|---|---|
| `inscription-created` | `InscriptionService.create()` | `/webhook/inscription-created` |
| `payment-confirmed` | `PaymentService` (confirmacion de pago) | `/webhook/payment-confirmed` |
| `user-registered` | `UserService.register()` | `/webhook/user-registered` |
| `document-uploaded` | `DocumentService.upload()` | `/webhook/document-uploaded` |
| `admission-decided` | `AdmissionService.create()` / `update()` | `/webhook/admission-decided` |

Los 5 workflows viven en `n8n/workflows/` y ya vienen con `active: true`.

Para usarlo:

1. `docker-compose up -build` (incluye el servicio `n8n` en el puerto 5678)
2. Entrar a `http://localhost:5678` con `admin` / `sion-n8n-2026`
3. Si los workflows no aparecen, importarlos desde `n8n/workflows/*.json`
4. Conectar un nodo Email Send (SMTP/Gmail) y **activar** el workflow
5. Ver el historial en la pestaña **Executions**

Si n8n esta caido o no responde, el backend sigue funcionando normalmente (solo loguea un warning `[n8n]`).

## Credenciales academicas con registro inmutable (Fase Piloto blockchain)

Implementacion del piloto recomendado en la propuesta blockchain de la UNAC: emision de actas,
diplomas, certificados de notas y cartas de admision como **credenciales verificables** ancladas
en un ledger inmutable.

**Diseno (alineado a la propuesta institucional):**

| Principio | Implementacion |
|---|---|
| Off-chain / Habeas Data (Ley 1581) | Los datos del titular viven en la coleccion `credentials`. La cadena (`ledger_blocks`) **solo almacena hashes SHA-256** y un UUID opaco. |
| Proof of Authority | Cada bloque se firma con `HMAC-SHA256` usando la llave institucional (`BLOCKCHAIN_AUTHORITY_KEY`). Solo la autoridad puede anclar bloques. |
| Encadenamiento inmutable | Cada bloque guarda `previousHash`; el hash se recalcula como `SHA-256(index|timestamp|dataHash|previousHash|firma)`. |
| Verificacion publica | `GET /api/v1/credentials/verify/{codigo}` **sin autenticacion**. Recalcula toda la cadena y detecta alteraciones. |
| UX / QR | Cada credencial tiene una URL publica `/verify/{CODIGO}` que se imprime como QR en el certificado. |

**Emision:**
- **Automatica**: al registrar una decision `admitted` se emite la carta de admision.
- **Manual**: desde el dashboard admin (seccion "Credenciales academicas"), eligiendo tipo e inscripcion.
- **Revocacion**: ancla un bloque de tipo `revocation` sin romper la cadena historica.

**Endpoints nuevos:**

| Metodo | Ruta | Acceso |
|---|---|---|
| `POST` | `/credentials/issue` | admin |
| `POST` | `/credentials/{id}/revoke` | admin |
| `GET` | `/credentials` | admin |
| `GET` | `/credentials/me` | usuario |
| `GET` | `/credentials/ledger/status` | admin |
| `GET` | `/credentials/ledger/blocks` | admin |
| `GET` | `/credentials/ledger/validate` | admin |
| `GET` | `/credentials/verify/{code}` | **publico** |

**Probarlo:**

1. Login como admin en `http://localhost:5173`
2. Dashboard → seccion **Credenciales academicas**
3. Emitir una credencial (o admitir una inscripcion para que se emita sola)
4. Copiar el codigo (ej. `ACTA-Q3JRLSWS`) y abrir `http://localhost:5173/verify/ACTA-Q3JRLSWS`
5. Aparece el badge **"Credencial autentica"**, el hash SHA-256, el ancla del ledger y el QR

**Nota tecnica:** las fechas que entran en el hash se normalizan a milisegundos antes de
hashear, porque MongoDB trunca los nanosegundos de `LocalDateTime` al persistir. Sin esa
normalizacion el recalculo del hash fallaria al leer desde la BD.

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


