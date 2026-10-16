# src/context/ThemeContext.tsx

## ¿Para qué sirve?
Maneja el **tema claro u oscuro** de toda la aplicación y lo comparte con cualquier componente. Si el
usuario es un cliente con sesión, también guarda su preferencia en la base de datos.

**¿Qué es un Context?** Una forma de React para compartir un dato con **todos** los componentes que
estén "adentro", sin pasarlo como prop uno por uno.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← `ThemeProvider` lo usa | `src/main.tsx` (envuelve toda la app) | |
| ← `useTheme()` lo usan | `Navbar.tsx`, `Landing.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx` y los 4 paneles | Leer el tema y el botón de cambiarlo. |
| → pone la clase `dark` en | `<html>` | Activa las clases `dark:` de Tailwind (`index.css`). |
| → guarda en | `localStorage` (navegador) con la clave `theme` | Recordarlo al volver. |
| → guarda en | la base de datos con `updateClient()` del almacén → `PUT /api/clients/{id}` → columna `tema_preferido` | Recordarlo en otros dispositivos. |
| ← lee | `localStorage.getItem('copiway_auth_user_id')` | Saber si hay un cliente conectado. |

## Variables
| Variable | Qué es |
|---|---|
| `ThemeContext` | El "canal" que comparte `{ theme, toggleTheme }`. |
| `theme` (`useState`) | `'light'` u `'dark'`. |
| `currentUserId` | Id del cliente conectado (o `null`). |

## Código explicado

### Valor inicial del tema
```tsx
const [theme, setTheme] = useState<Theme>(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});
```
1. Si el navegador ya tenía un tema guardado, usa ese.
2. Si no, usa el del sistema operativo (`prefers-color-scheme`).

### Primer `useEffect`: tema del cliente en la base de datos
Si hay un cliente conectado y tiene `preferences.theme` guardado, usa ese tema.

### `useLayoutEffect`: aplicar el tema
Se ejecuta **antes** de que el navegador pinte la pantalla (por eso `useLayoutEffect` y no `useEffect`: evita un parpadeo).
1. Pone la clase `no-transitions` (de `index.css`) para que el cambio sea instantáneo.
2. Agrega o quita la clase `dark` en `<html>`.
3. Lo guarda en `localStorage`.
4. Si es un cliente y el tema cambió, lo guarda en la base de datos con `updateClient`.
5. Quita `no-transitions` justo después.

### `toggleTheme()`
Cambia de claro a oscuro o al revés. Aplica la clase de inmediato para que no haya ningún parpadeo.

### `useTheme()`
```tsx
const { theme, toggleTheme } = useTheme();
```
Así lo usan los componentes. Si alguien lo usa fuera de `ThemeProvider`, lanza un error explicativo.
