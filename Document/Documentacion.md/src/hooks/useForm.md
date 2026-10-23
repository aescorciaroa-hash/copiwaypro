# src/hooks/useForm.ts

## ¿Para qué sirve?
Es un **hook propio** (una función reutilizable de React) que maneja un **formulario completo**:
guarda lo que escribe el usuario, valida cada campo con reglas y muestra los errores.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usan | `pages/Login.tsx`, `pages/Register.tsx`, `pages/ForgotPassword.tsx` |

## Cómo se usa
```tsx
const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm({
  initialValues: { email: '', password: '' },
  validationRules: {
    email: { required: true, email: true },
    password: { required: true, minLength: 8 },
  },
  onSubmit: async (values) => { await api.post('/auth/login', values); },
});

<input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
{touched.email && errors.email && <p>{errors.email}</p>}
```

## Reglas de validación (`ValidationRules`)
| Regla | Qué revisa |
|---|---|
| `required` | Que no esté vacío. |
| `email` | Que tenga formato de correo (expresión regular). |
| `minLength` / `maxLength` | Mínimo / máximo de caracteres. |
| `matchField` | Que sea igual a otro campo (ej: "confirmar contraseña"). |
| `mustBeTrue` | Que una casilla esté marcada (ej: aceptar términos). |
| `pattern` | Que cumpla una expresión regular. |
| `custom` | Una función propia que devuelve el mensaje de error o `null`. |

Cada regla tiene su mensaje opcional (`requiredMessage`, `emailMessage`...). Si no se pone, usa uno por defecto.

Estas validaciones son para **ayudar al usuario**; PHP vuelve a validar todo en el servidor (por ejemplo en `AuthController.php`).

## Estados internos
| Estado | Qué guarda |
|---|---|
| `values` | Lo que hay escrito en cada campo. |
| `errors` | El mensaje de error de cada campo. |
| `touched` | Qué campos ya tocó el usuario (para no mostrar errores antes de tiempo). |
| `isSubmitting` | `true` mientras se envía (para desactivar el botón). |

## Funciones que devuelve
| Función | Qué hace |
|---|---|
| `handleChange` | Se pone en `onChange`. Guarda el valor (en casillas usa `checked`). Si el campo ya fue tocado, lo valida en el momento. |
| `handleBlur` | Se pone en `onBlur` (al salir del campo). Lo marca como tocado y lo valida. |
| `handleSubmit` | Se pone en el `onSubmit` del `<form>`. `e.preventDefault()` evita que la página se recargue; valida todo; si no hay errores, llama a `onSubmit`. |
| `resetForm` | Vuelve a los valores iniciales. |
| `setFieldValue`, `setFieldError`, `setFieldTouched` | Cambiar un campo a mano (por ejemplo, para mostrar un error que vino de PHP). |
| `isValid` | `true` si no hay ningún error. |

`useCallback` guarda cada función para que no se cree de nuevo en cada dibujo de la pantalla.
`{ ...prev, [name]: val }` crea un objeto nuevo con todo lo anterior y cambia solo ese campo.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../useForm"` porque lo importan: `src/pages/ForgotPassword.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
