# src/global.d.ts

## ¿Para qué sirve?
Le explica a **TypeScript** que existen dos variables globales que no se crean en JavaScript sino en
el HTML que genera PHP: `window.__APP_BASE__` y `window.__DATOS__`. Sin este archivo, TypeScript
diría "esa variable no existe".

No genera código: solo **describe tipos** (`.d.ts` = archivo de declaraciones).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| Las variables las crea | `views/layouts/cabecera.php` (`<script>window.__APP_BASE__=...;window.__DATOS__=...;</script>`) |
| Los datos los arma | `controllers/PaginaController.php` (`$datos`) |
| Las leen | `servicios/api.ts` (`__APP_BASE__`, `__DATOS__.csrfToken`), `components/SyncDatos.tsx` (`__DATOS__.settings`) |

## Código explicado
```ts
interface DatosIniciales {
  usuario: Record<string, unknown> | null;
  rol: string | null;
  csrfToken: string;
  settings: { openTime: string; closeTime: string; isOpen?: boolean; ... };
}
```
Describe la forma de `window.__DATOS__`. Es **exactamente** el arreglo `$datos` de `PaginaController.php`:

| Campo TypeScript | Campo PHP (`$datos`) |
|---|---|
| `usuario` | `'usuario' => Auth::usuarioActual()` |
| `rol` | `'rol' => Auth::rol()` |
| `csrfToken` | `'csrfToken' => Session::csrf()` |
| `settings` | `'settings' => $configModel->obtener()` |

```ts
interface Window {
  __APP_BASE__?: string;
  __DATOS__?: DatosIniciales;
}
```
Agrega esas dos propiedades al objeto `window` del navegador. El `?` dice que pueden no existir
(con `npm run dev` no hay PHP, así que no existen).

`declare global { ... }` = "esto aplica a todo el proyecto". `export {}` hace que TypeScript trate el
archivo como un módulo (requisito para usar `declare global`).

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | Nadie lo importa con `import`: revisa su ficha para ver cómo se usa. |
