# Documentación lógica — AgroStock Pro (TiendaInsumo)

Un archivo `.md` por cada archivo real del proyecto, con la explicación palabra por palabra y las conexiones con el resto del sistema. La estructura de carpetas aquí abajo refleja exactamente la del proyecto (`config/`, `models/`, `controllers/`, `views/`, `sql/`, `public/`).

> `admin/` y `auth/` son la excepción a "un archivo por archivo real": son notas por **flujo completo** (varios archivos a la vez), no por archivo individual.

## Índice

### Configuración y datos
- [config/database.md](config/database.md) — conexión a MySQL (`$conn`)
- [sql/bdtienda.md](sql/bdtienda.md) — diseño de la base de datos

### Modelos
- [models/Usuario.md](models/Usuario.md) — `registrar`, `emailExiste`, `obtenerPorEmail`, `obtenerTodos`, `actualizar`, `eliminar`
- [models/Rol.md](models/Rol.md) — `obtenerTodos`

### Controladores
- [controllers/auth/authController.md](controllers/auth/authController.md) — login / logout
- [controllers/auth/registerController.md](controllers/auth/registerController.md) — registro público
- [controllers/registerController.md](controllers/registerController.md) — registro desde el panel admin
- [controllers/UsuarioController.md](controllers/UsuarioController.md) — editar / eliminar usuarios

### Vistas de autenticación
- [views/auth/login.md](views/auth/login.md)
- [views/auth/register.md](views/auth/register.md)

### Layouts (paneles internos)
- [views/layouts/header.md](views/layouts/header.md) — guardián de sesión
- [views/layouts/sidebaradmin.md](views/layouts/sidebaradmin.md) — menú según el rol
- [views/layouts/footer.md](views/layouts/footer.md)

### Vistas protegidas
- [views/admin/dashboard.md](views/admin/dashboard.md)
- [views/admin/gusuarios.md](views/admin/gusuarios.md) — listado + editar/eliminar
- [views/vendedor/dashboard.md](views/vendedor/dashboard.md)
- [views/cliente/dashboard.md](views/cliente/dashboard.md)

### Público
- [public/index.md](public/index.md) — landing page

### Flujos completos (varios archivos a la vez)
- [auth/login.md](auth/login.md) — login de principio a fin (formulario → controlador → modelo)
- [auth/registro.md](auth/registro.md) — registro público de principio a fin
- [admin/registro.md](admin/registro.md) — registro desde el panel admin, con 3 bugs reales documentados (rol ignorado, estado ignorado, redirect roto)

## Flujos completos

- **Login**: [[views/auth/login]] → [[controllers/auth/authController]] → [[models/Usuario]] → redirección por `id_rol` a `views/admin|vendedor|cliente/dashboard.php`.
- **Registro público**: [[views/auth/register]] → [[controllers/auth/registerController]] → [[models/Usuario]] → `views/auth/login.php`.
- **Admin crea usuario**: [[views/admin/gusuarios]] (modal Agregar) → [[controllers/registerController]] → [[models/Usuario]] → de vuelta a `gusuarios.php`.
- **Admin edita/elimina usuario**: [[views/admin/gusuarios]] (modales) → [[controllers/UsuarioController]] → [[models/Usuario]] → de vuelta a `gusuarios.php`.
- **Logout**: [[views/layouts/sidebaradmin]] → [[controllers/auth/authController]]`?accion=logout` → `views/auth/login.php`.
