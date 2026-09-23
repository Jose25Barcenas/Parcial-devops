# SION - Sistema de Inscripcion y Admision Online

Plataforma web para gestionar el proceso de inscripcion y admision de aspirantes a programas academicos de pregrado de la Corporacion Universitaria Adventista (CUA).

## Tecnologias

- **Frontend**: React 19.2, Vite 8.2, CSS Modules
- **Backend**: Java 17, Spring Boot 3.3.5, Spring Security, Spring Data MongoDB
- **Base de datos**: MongoDB 7
- **Auth**: JWT (JJWT 0.12.6)
- **Containerizacion**: Docker + Docker Compose
- **Linter**: oxlint

## Estructura

```
sion_unac/
├── src/                        # Frontend React
│   ├── App.jsx                 # Componente principal (1225 lineas)
│   ├── main.jsx                # Entry point
│   ├── context/AuthContext.jsx  # Estado de autenticacion
│   ├── services/               # Servicios API
│   │   ├── api.js              # Cliente HTTP centralizado
│   │   ├── authService.js      # Login/Registro
│   │   ├── inscriptionService.js
│   │   ├── paymentService.js
│   │   ├── documentService.js
│   │   └── admissionService.js
│   ├── styles/                 # CSS Modules
│   └── index.css
├── backend/                    # API REST (Spring Boot)
│   ├── pom.xml
│   ├── Dockerfile
│   ├── .env
│   ├── uploads/
│   └── src/
│       ├── main/java/com/sion/backend/
│       │   ├── SionApplication.java
│       │   ├── config/             # Security, CORS, Mongo
│       │   ├── model/              # Entidades MongoDB
│       │   ├── dto/                # Request/Response DTOs
│       │   ├── repository/         # Repositorios MongoDB
│       │   ├── service/            # Logica de negocio
│       │   ├── controller/         # Endpoints REST
│       │   ├── security/           # JWT, Filtros
│       │   └── exception/          # Manejo de errores
│       └── test/                   # Tests unitarios
├── docker-compose.yml          # MongoDB + Backend + Frontend
├── Dockerfile.frontend         # Build del frontend
├── nginx.conf                  # Proxy reverso
├── packer/                     # AMI image (Packer)
│   └── app.pkr.hcl            # Template para AMI en AWS
├── terraform/                  # Infraestructura AWS (VPC, EC2, AMI, SG)
├── .gitlab-ci.yml              # Pipeline CI/CD
├── vite.config.js
└── USER_STORIES.md             # Historias de usuario
```

## Como correr

### Con Docker (Recomendado)

```bash
# Levantar todo (MongoDB + Backend + Frontend)
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# MongoDB: localhost:27017
```

### Desarrollo local (sin Docker)

**Requisitos**: Java 17, Maven, MongoDB instalado, Node.js 18+

```bash
# 1. MongoDB debe estar corriendo en localhost:27017

# 2. Backend
cd backend
mvn spring-boot:run

# 3. Frontend (otra terminal)
npm install
npm run dev
```

### Scripts disponibles

```bash
npm run dev       # Iniciar servidor de desarrollo
npm run build     # Build de produccion
npm run preview   # Previsualizar build
npm run lint      # Ejecutar linter (oxlint)
```

## API REST (23 endpoints)

Todos los endpoints usan prefijo `/api/v1`

### Auth
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Login + JWT |

### Users
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/users` | Listar usuarios (Admin) |
| GET | `/api/v1/users/{id}` | Obtener usuario |
| PUT | `/api/v1/users/{id}` | Actualizar usuario |
| DELETE | `/api/v1/users/{id}` | Eliminar usuario (Admin) |

### Inscriptions
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/inscriptions` | Crear inscripcion |
| GET | `/api/v1/inscriptions/me` | Mis inscripciones |
| GET | `/api/v1/inscriptions` | Todas (Admin) |
| GET | `/api/v1/inscriptions/{id}` | Inscripcion por ID |
| PATCH | `/api/v1/inscriptions/{id}/status` | Cambiar estado (Admin) |

### Payments
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/payments` | Crear pago |
| GET | `/api/v1/payments/{id}` | Pago por ID |
| PATCH | `/api/v1/payments/{id}/confirm` | Confirmar pago (Admin) |

### Documents
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/documents/upload` | Subir documento |
| GET | `/api/v1/documents/{inscriptionId}` | Documentos de inscripcion |
| GET | `/api/v1/documents/doc/{id}` | Documento por ID |
| DELETE | `/api/v1/documents/{id}` | Eliminar documento |

### Admissions
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/admissions` | Crear resultado (Admin) |
| GET | `/api/v1/admissions/me` | Mi resultado |
| GET | `/api/v1/admissions` | Todos (Admin) |
| GET | `/api/v1/admissions/{id}` | Resultado por ID |
| PATCH | `/api/v1/admissions/{id}` | Actualizar resultado (Admin) |

## Flujo de la aplicacion

La app guia al aspirante through 4 etapas:

1. **Inscripcion** - Registro de datos personales y seleccion de programa
2. **Pago** - Pago de derecho de inscripcion ($80.000 COP)
3. **Documentos** - Carga de documentos requeridos (5 tipos)
4. **Resultados** - Consulta de decision de admision

## Credenciales de prueba

| Usuario | Email | Contrasena | Rol |
|---------|-------|------------|-----|
| Admin | admin@sion.edu.co | admin123 | admin |
| Aspirante | maria.garcia@correo.com | maria123 | aspirant |
| Aspirante | carlos.lopez@correo.com | carlos123 | aspirant |

## Pruebas en Postman

1. **Login**: POST `/api/v1/auth/login` con email y password
2. **Copiar token** de la respuesta
3. **En Headers**: `Authorization: Bearer <token>`
4. **Probar endpoints** protegidos

## Pruebas Backend

```bash
cd backend
mvn test
```

## Configuracion

Las variables de entorno del backend se pueden configurar en `backend/.env`:

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `SPRING_DATA_MONGODB_URI` | `mongodb://localhost:27017/sion_db` | URI de MongoDB |
| `JWT_SECRET` | `mySecretKeyForSionUnac2026MustBe32Chars` | Clave JWT |
| `SERVER_PORT` | `3000` | Puerto del backend |
| `UPLOAD_DIR` | `./uploads` | Directorio de archivos |

## Infraestructura (Packer + Terraform)

La infraestructura en la nube esta definida en [`packer/`](packer/) y [`terraform/`](terraform/).

### AMI con Packer

Packer construye una AMI personalizada con Docker y la app pre-configurada:

```bash
cd packer

# Requiere AWS credentials configuradas (env o ~/.aws)
export AWS_ACCESS_KEY_ID="tu-access-key"
export AWS_SECRET_ACCESS_KEY="tu-secret-key"

# Validar template
packer init .
packer validate .

# Construir AMI
packer build -var "aws_region=us-east-1" app.pkr.hcl

# El output ami_id se usa en Terraform
```

| Paso | Comando | Resultado |
|------|---------|-----------|
| 1. Init | `packer init .` | Descarga plugins de AWS |
| 2. Validate | `packer validate .` | Verifica sintaxis |
| 3. Build | `packer build app.pkr.hcl` | Crea AMI en AWS |
| 4. Copiar AMI ID | output `ami_id` | Para Terraform |

**Que incluye la AMI:**
- Ubuntu 22.04 LTS
- Docker + Docker Compose
- Nginx
- Archivos de la app (`docker-compose.yml`, Dockerfiles, `nginx.conf`)

### Componentes Terraform

| Recurso | Descripcion |
|---------|-------------|
| VPC | Red privada `10.0.0.0/16` con subnet publica |
| Internet Gateway | Salida a Internet para la subnet |
| Security Group | Puertos 22 (SSH), 80 (HTTP), 5173 (front), 3000 (API) |
| EC2 | Instancia con AMI de Packer (o Ubuntu oficial si no hay AMI) |
| AMI | Creada por Packer (`packer/app.pkr.hcl`) |
| Key Pair | Clave SSH para acceso a la instancia |

### Como desplegar

```bash
# Opcional: primero crear AMI con Packer
cd packer && packer build app.pkr.hcl && cd ..

# Terraform
cd terraform

# 1. Copiar y editar variables
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars (ami_id de Packer, IP SSH, region, etc.)

# 2. Inicializar proveedores
terraform init

# 3. Revisar el plan
terraform plan -out=tfplan

# 4. Aplicar
terraform apply tfplan

# 5. Ver outputs (IP publica, AMI, etc.)
terraform output

# 6. Destruir cuando ya no se necesite
terraform destroy
```

### Salidas principales (`terraform output`)

- `public_ip` / `public_dns` → donde correr la app
- `ami_id` → AMI utilizada
- `instance_id` → ID de la EC2
- `security_group_id` / `vpc_id` → red

### Arquitectura

```
Internet
   │
   ▼
Internet Gateway ──► Route Table (0.0.0.0/0)
   │
   ▼
Public Subnet 10.0.1.0/24
   │
   ▼
EC2 (AMI Packer: Ubuntu 22.04 + Docker)
   ├── Frontend :5173
   ├── Backend  :3000
   └── MongoDB  :27017
```

## CI/CD (GitLab CI)

Pipeline definido en `.gitlab-ci.yml`:

| Etapa | Job | Que hace |
|-------|-----|----------|
| lint | `lint-frontend` | `npm run lint` (oxlint) |
| test | `test-backend` | `mvn test` (JUnit) |
| build | `build-frontend` | Build imagen Docker del front |
| build | `build-backend` | Build imagen Docker del back |
| image | `build-ami` | Construye AMI con Packer (manual) |
| deploy | `deploy-terraform` | `terraform plan` (manual) |

## Git

```bash
git clone https://github.com/Jose25Barcenas/Parcial-devops.git
cd Parcial-devops

# Frontend
npm install
npm run dev

# Backend
cd backend && mvn spring-boot:run

# Todo con Docker
docker-compose up --build
```
