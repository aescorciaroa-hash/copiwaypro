# src/components/Navbar.tsx

## ¿Para qué sirve?
Es la **barra de navegación** flotante de la página de inicio: logo, enlaces (Menú, Nosotros,
Testimonios, Contacto), botón de tema claro/oscuro y botón "Ingresar". En el celular se convierte en
un menú desplegable.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/Landing.tsx` | Solo la página de inicio. |
| → usa | `useTheme()` de `context/ThemeContext.tsx` | `theme` y `toggleTheme` para el botón de sol/luna. |
| → usa | `rutaBase()` de `servicios/api.ts` | Para armar los enlaces `/` y `/login`. |
| → enlaces `#menu`, `#nosotros`... | secciones con ese `id` dentro de `Landing.tsx` | Bajan hasta esa parte de la página. |
| → usa | íconos de `lucide-react` | `Utensils`, `Sun`, `Moon`, `Menu`, `X`, `ArrowRight`. |

## Variables
| Variable | Qué es |
|---|---|
| `theme`, `toggleTheme` | Tema actual y la función para cambiarlo (de `useTheme()`). |
| `isOpen` (`useState`) | Si el menú del celular está abierto. |
| `handleLinkClick` | Cierra el menú del celular al tocar un enlace. |

## Partes del código
- **Logo:** enlace a la raíz. Si ya estás en la página de inicio, `e.preventDefault()` evita recargar y `window.scrollTo({ top: 0, behavior: 'smooth' })` sube suavemente.
- **Enlaces de escritorio:** `hidden md:flex` = ocultos en celular, visibles en pantallas medianas o más grandes.
- **Botón de tema:** `onClick={toggleTheme}`. Muestra la luna en modo claro y el sol en modo oscuro: `{theme === 'light' ? <Moon/> : <Sun/>}`.
- **Botón Ingresar:** `href={rutaBase() + '/login'}`.
- **Botón de menú (celular):** `onClick={() => setIsOpen(!isOpen)}` lo abre o lo cierra (`!` = lo contrario).
- **Menú del celular:** `{isOpen && (...)}` = solo se dibuja si `isOpen` es `true`.

Las clases cambian según el estado con plantillas de texto:
```tsx
className={`... ${isOpen ? 'rounded-[2rem] py-5' : 'rounded-full h-[72px]'}`}
```
