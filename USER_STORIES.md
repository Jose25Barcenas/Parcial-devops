# User Stories - Sion_unac (Entrega Final)

## US-1: Registro de Nuevo Usuario
**Como** aspirante al programa académico  
**Quiero** crear una cuenta en el sistema SION  
**Para** poder acceder al proceso de inscripción y admisión

### Criterios de Aceptación:
- [x] El usuario puede ingresar nombre, correo, teléfono y contraseña
- [x] El sistema valida que el correo tenga formato correcto
- [x] La contraseña debe tener mínimo 6 caracteres
- [x] El usuario acepta los términos y condiciones
- [x] Al registrar, el sistema crea el perfil y redirige al login
- [x] Validación en tiempo real de campos requeridos
- [x] Mostrar mensaje de éxito y error appropriate

## US-2: Inicio de Sesión
**Como** usuario registrado  
**Quiero** iniciar sesión en el sistema SION  
**Para** poder acceder al portal de inscripción y admisión

### Criterios de Aceptación:
- [x] El usuario puede ingresar correo y contraseña
- [x] El sistema valida credenciales contra el backend
- [x] Mostrar mensaje de error si las credenciales son inválidas
- [x] Opción "Recordarme" para mantener sesión
- [x] Enlace "¿Olvidó su contraseña?"
- [x] Después de login exitoso, redirigir a la pantalla principal
- [x] Bloqueo de cuenta después de 5 intentos fallidos
