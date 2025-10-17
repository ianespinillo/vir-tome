// docs/DEMO.md
# 🎭 Demo Tenant

## Acceso al Demo

### Opción 1: Subdomain
```
https://demo.tuapp.com
```

### Opción 2: Header (desarrollo)
```bash
curl -H "X-Tenant-ID: 1" http://localhost:3000/books
```

## Credenciales

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| Admin | admin@demo.com | demo123 | Acceso completo al sistema |
| Bibliotecario | bibliotecario@demo.com | demo123 | Gestión de libros y préstamos |
| Profesor | profesora@demo.com | demo123 | Consulta y solicitudes |
| Estudiante | estudiante1@demo.com | demo123 | Consulta del catálogo |

## Características

- ✅ 10 libros de ejemplo
- ✅ 5 usuarios con diferentes roles
- ✅ 5 préstamos de ejemplo (activos y devueltos)
- ✅ Categorías y editoriales precargadas
- ✅ Reset automático diario a las 2 AM UTC
- ⚠️ Los cambios se pierden en el próximo reset

## Limitaciones

- No se pueden eliminar los usuarios principales (admin, bibliotecario, profesora)
- Los datos se resetean automáticamente cada día
- Pensado solo para demostración y pruebas

## Reset Manual

Solo el admin del tenant demo puede forzar un reset:
```bash
POST /demo/reset
Authorization: Bearer {admin_token}
X-Tenant-ID: 1
```

## Detección de Demo

Todas las respuestas del tenant demo incluyen estos headers:
```
X-Demo-Mode: true
X-Demo-Tenant: demo
```

Puedes usarlos en el frontend para mostrar un banner o advertencia.