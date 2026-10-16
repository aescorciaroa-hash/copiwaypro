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

## Otra forma: sin Apache (`start.bat`)
Útil si no quieres usar Apache. MySQL de Laragon **sí** debe estar encendido.
1. Doble clic en **`start.bat`**.
2. Abre **http://localhost:8000/**
3. Para detenerlo: en la ventana negra, **Ctrl + C**.

Usa el servidor que trae PHP (`php -S`) con `public/server-router.php`.

## Modo desarrollo de React (`npm run dev`)
Solo si vas a **cambiar pantallas** y quieres ver los cambios al guardar, sin compilar cada vez.
1. Enciende el backend: `start.bat` (o Apache, cambiando `VITE_API_PROXY_TARGET` en `.env`).
2. En otra terminal: `npm run dev`
3. Abre **http://localhost:3000/?pagina=admin** (cambia `admin` por `login`, `client`, `kitchen`, `delivery`...).

En este modo PHP no genera la página, por eso la pantalla se elige con `?pagina=`.

## ¿Cambié algo y no se ve?
| Cambiaste | Qué hacer |
|---|---|
| Un archivo **PHP** (`app/`, `config/`) | Nada: recarga la página. PHP se lee en cada petición. |
| Un archivo de **React** (`src/`) | Ejecuta `npm run build` y recarga (o usa `npm run dev`). |
| El **`.env`** | Recarga la página. |
| La **base de datos** (`schema.sql`) | Hay que volver a importarla (ver [Base de datos](07-base-de-datos.md)). |

Si el navegador sigue mostrando lo viejo: **Ctrl + F5** (recarga sin caché).
