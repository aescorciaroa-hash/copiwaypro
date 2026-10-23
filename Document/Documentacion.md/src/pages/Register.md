# src/pages/Register.tsx

## ¿Para qué sirve?
Es el formulario para que un **cliente nuevo cree su cuenta** (`/register`). Al terminar, queda con
la sesión iniciada y va a su panel.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="register"` (`views/paginas/registro.php`) | |
| → usa | `useForm` | Validación. |
| → usa | `CustomDatePicker` | Fecha de nacimiento. |
| → llama a | `api.post('/auth/register')` → `AuthController.php` acción `register` → `Cliente::crear()` | Crear la cuenta. |
| → guarda en | `localStorage` (`copiway_auth_user_id`, `copiway_auth_role = 'client'`) | |
| → va a | `irA('/client')` | Panel del cliente. |

## Campos y reglas
| Campo (React) | Regla | Se envía a PHP como |
|---|---|---|
| `nombres` + `apellidos` | Obligatorios | `name` (se unen: `` `${nombres} ${apellidos}` ``) |
| `email` | Obligatorio y con formato de correo | `email` |
| `telefono` | Obligatorio, mínimo 10, solo números, `+`, espacios, `-` y paréntesis | `phone` |
| `nacimiento` | Obligatoria | `birthday` |
| `password` | Obligatoria, mínimo 8 | `password` |
| `confirmPassword` | Igual a `password` (`matchField`) | `confirmPassword` |
| `terms` | Debe estar marcada (`mustBeTrue`): acepta la política de datos (Habeas Data) | `terms` |

PHP vuelve a revisar todo (ver `AuthController.md`).

## Variables
| Variable | Qué es |
|---|---|
| `submitSuccess` | `true` cuando se creó la cuenta (muestra el mensaje). |
| `showPassword`, `showConfirmPassword` | Mostrar u ocultar cada contraseña. |
| `setFieldError` | (de `useForm`) Para mostrar debajo de un campo un error que vino de PHP. |

## Manejo de errores
```tsx
if (err instanceof ApiError && err.status === 409) {
  setFieldError('email', 'Este correo o teléfono ya está registrado...');
}
if (err instanceof ApiError && err.errors) {
  const firstField = Object.keys(err.errors)[0];
  setFieldError(firstField, err.errors[firstField][0]);
}
```
| Respuesta de PHP | Qué muestra |
|---|---|
| **409** | "Este correo o teléfono ya está registrado" debajo del correo. |
| **422** con `errors` | El primer error que mandó PHP, debajo del campo correspondiente. |
| Otro | El mensaje general debajo del correo. |

`Object.keys(err.errors)[0]` = el nombre del primer campo con error.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../Register"` porque lo importan: `src/main.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
