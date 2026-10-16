# src/pages/Login.tsx

## ¿Para qué sirve?
Es la pantalla de **inicio de sesión** (`/login`) con correo y contraseña. Después de entrar, envía a
cada usuario a su panel según su rol.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="login"` (`views/paginas/login.php`) | |
| → usa | `useForm` (`hooks/useForm.ts`) | Validar el formulario. |
| → llama a | `api.post('/auth/login')` → `AuthController.php` acción `login` → `Auth::intentarLogin()` | Iniciar sesión. |
| → usa | `irA()` de `servicios/api.ts` | Ir al panel. |
| → guarda en | `localStorage`: `copiway_auth_user_id` y `copiway_auth_role` | Los leen otros componentes (por ejemplo `ThemeContext.tsx`). La sesión **real** está en la cookie de PHP. |
| → usa | `useTheme()` | Botón de tema. |
| → enlaces | `/register`, `/forgot-password`, `/` | |

## Variables
| Variable | Qué es |
|---|---|
| `submitSuccess` | `true` cuando el login funcionó (muestra el mensaje de éxito). |
| `loginError` | El mensaje de error que devolvió PHP (o `null`). |
| `showPassword` | Mostrar u ocultar la contraseña (botón del ojo). |
| `values`, `errors`, `touched`, `isSubmitting`, `handleChange`, `handleBlur`, `handleSubmit` | Lo que devuelve `useForm`. |

## Reglas del formulario
| Campo | Reglas |
|---|---|
| `email` | Obligatorio y con formato de correo. |
| `password` | Obligatoria, mínimo 8 caracteres. |
| `remember` | Casilla "recordarme" (no tiene reglas). |

## `onSubmit` paso a paso
```tsx
const { user } = await api.post('/auth/login', { email, password });
localStorage.setItem('copiway_auth_user_id', user.id);
localStorage.setItem('copiway_auth_role', user.role);
setSubmitSuccess(true);
setTimeout(() => irA(routes[user.role] || '/client'), 1500);
```
1. Envía correo y contraseña a PHP.
2. PHP responde `{ user: { id, role, name, email }, csrfToken }`. `api.ts` guarda el token nuevo solo.
3. Guarda el id y el rol en el navegador.
4. Espera 1,5 segundos (mostrando el éxito) y va al panel:

| `user.role` | Va a |
|---|---|
| `admin` | `/admin` |
| `kitchen` | `/kitchen` |
| `delivery` | `/delivery` |
| `client` | `/client` |

Si falla: `err instanceof ApiError ? err.message : '...'` → muestra el mensaje que envió PHP
(ej: "Correo o contraseña incorrectos.") o uno genérico si fue un error de red.

## Diseño
- Fondo decorativo con cuadrícula y círculos de color.
- Botón de tema en la esquina.
- En pantallas grandes, una columna lateral con la marca; a la derecha, el formulario.
