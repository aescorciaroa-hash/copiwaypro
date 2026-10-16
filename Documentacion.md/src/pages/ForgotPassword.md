# src/pages/ForgotPassword.tsx

## ¿Para qué sirve?
Permite a un cliente **recuperar su contraseña** (`/forgot-password`) en 2 pasos:
1. Escribe su correo → se le envía un código de 6 dígitos.
2. Escribe el código y la nueva contraseña.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="forgot-password"` (`views/paginas/recuperar.php`) | |
| → usa | `useForm` (dos veces: un formulario por paso) | |
| → paso 1 llama a | `POST /api/auth/forgot-password/request` → `AuthController` → `CodigoVerificacion::crearParaCliente()` + `CorreoService` | Enviar el código. |
| → paso 2 llama a | `POST /api/auth/forgot-password/reset` → `AuthController` → `Cliente::actualizarContrasena()` | Cambiar la contraseña. |

## Variables
| Variable | Qué es |
|---|---|
| `step` (`useState<1 \| 2>`) | En qué paso va. Solo puede valer 1 o 2. |
| `resetSuccess` | `true` cuando la contraseña se cambió (muestra el mensaje final y el enlace al login). |
| `showNewPassword`, `showConfirmPassword` | Mostrar u ocultar contraseñas. |
| `form1` | Formulario del paso 1: campo `identifier` (el correo). |
| `form2` | Formulario del paso 2: `code`, `newPassword`, `confirmPassword`. |

## Paso 1
```tsx
await api.post('/auth/forgot-password/request', { email: values.identifier });
setStep(2);
```
PHP responde lo mismo exista o no el correo (para no revelar qué correos están registrados), así que
siempre pasa al paso 2.

El texto del campo dice "correo o teléfono", pero el servidor solo busca por **correo**.

## Paso 2
```tsx
await api.post('/auth/forgot-password/reset', {
  email: form1.values.identifier,   // el correo del paso 1
  code: values.code,
  newPassword: values.newPassword,
});
setResetSuccess(true);
```
Reglas: código obligatorio, nueva contraseña de 8 o más caracteres y la confirmación igual
(`matchField: 'newPassword'`). Si el código está mal o venció, PHP responde 422 y el mensaje se
muestra debajo del campo del código.

**En modo local:** si el correo no está configurado, PHP responde el código en `debugCode`. Esta
pantalla no lo muestra; se puede ver en las herramientas del navegador (F12 → Red).

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../ForgotPassword"` porque lo importan: `src/main.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
