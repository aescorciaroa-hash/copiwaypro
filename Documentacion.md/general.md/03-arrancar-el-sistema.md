# 3. Arrancar y detener el sistema

## Forma normal: con Laragon
1. Abre **Laragon**.
2. Haz clic en **Iniciar todo** (*Start All*). Se encienden **Apache** (el servidor web) y **MySQL** (la base de datos).
3. Abre en el navegador: **http://localhost/copiwaypro/**

Para apagar: en Laragon, **Detener** (*Stop*).

> ⚠️ `http://localhost/` solo (sin `/copiwaypro/`) **no es el sistema**: es la página de Laragon que
> lista los proyectos. Si ves un error 404 en `/login`, revisa que la dirección tenga `/copiwaypro/`.

Si tienes activado "Auto Virtual Hosts" en Laragon, también funciona **http://copiwaypro.test/**.

## Las direcciones del sistema
| Dirección | Pantalla | Quién entra |
|---|---|---|
| `/copiwaypro/` | Página de inicio y menú | Cualquiera |
| `/copiwaypro/login` | Iniciar sesión | Cualquiera |
| `/copiwaypro/register` | Crear cuenta de cliente | Cualquiera |
| `/copiwaypro/forgot-password` | Recuperar contraseña | Cualquiera |
| `/copiwaypro/admin` | Panel del administrador | Administrador |
| `/copiwaypro/client` | Panel del cliente | Cliente |
| `/copiwaypro/kitchen` | Panel de cocina | Ayudante de cocina |
| `/copiwaypro/delivery` | Panel del domiciliario | Domiciliario |

Si entras a un panel sin sesión o con otro rol, el sistema te manda a `/login`.

## Modo desarrollo de React (`npm run dev`)
Solo si vas a **cambiar pantallas** y quieres ver los cambios al guardar, sin compilar cada vez.
1. Enciende Laragon (Apache y MySQL). Vite le pasa las llamadas `/api` a `http://localhost/copiwaypro`.
2. En otra terminal: `npm run dev`
3. Abre **http://localhost:3000/?pagina=admin** (cambia `admin` por `login`, `client`, `kitchen`, `delivery`...).

En este modo PHP no genera la página, por eso la pantalla se elige con `?pagina=`.

## ¿Cambié algo y no se ve?
| Cambiaste | Qué hacer |
|---|---|
| Un archivo **PHP** (`config/`, `controllers/`, `models/`, `views/`) | Nada: recarga la página. PHP se lee en cada petición. |
| Un archivo de **React** (`src/`) | Ejecuta `npm run build` y recarga (o usa `npm run dev`). |
| La **base de datos** (`schema.sql`) | Hay que volver a importarla (ver [Base de datos](07-base-de-datos.md)). |

Si el navegador sigue mostrando lo viejo: **Ctrl + F5** (recarga sin caché).
