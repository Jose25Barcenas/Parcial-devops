# User Stories - Sion_unac (Entrega Final)

## US-1: Registro de Nuevo Usuario
**Como** aspirante al programa académico  
**Quiero** crear una cuenta en el sistema SION  
**Para** poder acceder al proceso de inscripción y admisión

### Criterios de Aceptación:
- [ ] El usuario puede ingresar nombre, correo, teléfono y contraseña
- [ ] El sistema valida que el correo tenga formato correcto
- [ ] La contraseña debe tener mínimo 6 caracteres
- [ ] El usuario acepta los términos y condiciones
- [ ] Al registrar, el sistema crea el perfil y redirige al login
- [ ] Validación en tiempo real de campos requeridos
- [ ] Mostrar mensaje de éxito y error appropriate

## US-2: Inicio de Sesión
**Como** usuario registrado  
**Quiero** iniciar sesión en el sistema SION  
**Para** poder acceder al portal de inscripción y admisión

### Criterios de Aceptación:
- [ ] El usuario puede ingresar correo y contraseña
- [ ] El sistema valida credenciales contra el backend
- [ ] Mostrar mensaje de error si las credenciales son inválidas
- [ ] Opción "Recordarme" para mantener sesión
- [ ] Enlace "¿Olvidó su contraseña?"
- [ ] Después de login exitoso, redirigir a la pantalla principal
- [ ] Bloqueo de cuenta después de 5 intentos fallidos