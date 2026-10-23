# src/servicios/api.ts

## ¿Para qué sirve?
Es la **única puerta de React para hablar con PHP**. Todas las peticiones a `/api/...` pasan por aquí.
Se encarga de: armar la dirección, enviar la cookie de sesión, enviar el token CSRF, convertir el JSON
y manejar los errores.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| → llama a | las rutas de `config/rutas.php` (PHP) | Todas las peticiones. |
| ← lee | `window.__APP_BASE__` y `window.__DATOS__` (de `cabecera.php`) | Carpeta del proyecto y primer token CSRF. |
| ← lo usan | `store/almacenAplicacion.ts` (la mayoría de llamadas), `components/SyncDatos.tsx`, `lib/pasarela.ts`, `lib/pushNotifications.ts`, `pages/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, los 4 paneles (logout) | |
| ← `subirArchivo` lo usan | `admin/MenuSection.tsx`, `admin/InventorySection.tsx` | Subir fotos. |
| ← `irA` lo usan | las pantallas | Cambiar de página. |

## Variables del archivo
| Variable | Qué guarda | De dónde sale |
|---|---|---|
| `BASE_URL` | `'/copiwaypro/api'` | `window.__APP_BASE__` + `'/api'` |
| `csrfToken` | El token CSRF actual | Primero de `window.__DATOS__.csrfToken`; después se actualiza con cada respuesta que traiga uno. |
| `syncEtag` | La "huella" de la última sincronización | La cabecera `ETag` que responde `SyncController.php` |

## Funciones
| Función | Qué hace |
|---|---|
| `setCsrfToken(token)` | Cambia el token guardado. La usan `SyncDatos.tsx` y la propia `request()`. |
| `rutaBase()` | Devuelve la carpeta del proyecto (`'/copiwaypro'`). |
| `irA(ruta)` | Navega a otra página: `window.location.href = rutaBase() + ruta`. Recarga la página. |
| `class ApiError` | Un error con el mensaje de PHP, el código HTTP (`status`) y los errores por campo (`errors`). Las pantallas lo usan para mostrar mensajes. |
| `request(method, path, body)` | **La función principal** (ver abajo). |
| `api.get/post/put/patch/delete` | Atajos de `request()` para cada método HTTP. |
| `subirArchivo(path, campo, file)` | Envía un archivo con `FormData` (no JSON). |
| `fetchSync()` | Pide `/api/sync` enviando la huella anterior; si PHP responde 304, devuelve `null`. |

## `request()` paso a paso
```ts
if (body !== undefined) headers['Content-Type'] = 'application/json';
if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
```
- Si hay datos, avisa que van en JSON (PHP los lee con `entrada()`).
- Si no es GET, envía el token CSRF (PHP lo revisa con `verificarCsrf()`).

```ts
const res = await fetch(BASE_URL + path, { method, headers, credentials: 'include', body: JSON.stringify(body) });
```
- `fetch` es la función del navegador para hacer peticiones.
- `credentials: 'include'` envía la **cookie de sesión** (así PHP sabe quién eres).
- `JSON.stringify` convierte el objeto en texto JSON.

Manejo de respuestas:
| Caso | Qué hace |
|---|---|
| 204 o 304 | No hay datos: devuelve `undefined`. |
| **419** (token CSRF vencido) | Pide un token nuevo a `/auth/csrf` y **repite la petición una vez**, sin que el usuario lo note. |
| **401** (sesión perdida) fuera de `/auth/` | Recarga la página: PHP lo manda al login. |
| Otro error | Lanza `ApiError` con el mensaje que envió PHP (`data.error`). |
| Respuesta con `csrfToken` | Lo guarda (login y registro traen uno nuevo). |

`request<T>` usa un **genérico** `<T>`: quien llama dice qué tipo de dato espera recibir,
por ejemplo `api.post<Product>('/products', datos)` devuelve un `Product`.

## `fetchSync()`
```ts
if (syncEtag) headers['If-None-Match'] = syncEtag;
const res = await fetch(BASE_URL + '/sync', ...);
if (res.status === 304) return null;
syncEtag = res.headers.get('ETag');
```
Envía la huella anterior. Si PHP dice que nada cambió (304), devuelve `null` y no se procesa nada.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../api"` porque lo importan: `src/components/Footer.tsx`, `src/components/Navbar.tsx`, `src/components/SyncDatos.tsx`, `src/lib/pasarela.ts`, `src/lib/pushNotifications.ts`, `src/pages/AdminDashboard.tsx`, `src/pages/ClientDashboard.tsx`, `src/pages/DeliveryDashboard.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/KitchenDashboard.tsx`, `src/pages/Landing.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/admin/InventorySection.tsx`, `src/pages/admin/MenuSection.tsx`, `src/pages/admin/SettingsSection.tsx`, `src/pages/admin/StaffSection.tsx`, `src/store/almacenAplicacion.ts`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
