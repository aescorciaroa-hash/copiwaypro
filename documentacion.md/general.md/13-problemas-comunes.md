# 13. Problemas comunes

## Dónde mirar primero
| Qué | Dónde |
|---|---|
| Errores de PHP | `C:\laragon\tmp\php_errors.log` |
| Qué respondió el servidor | Navegador → **F12 → Red (Network)** → toca la petición `/api/...` → **Respuesta** |
| Errores de React | Navegador → **F12 → Consola** |
| ¿MySQL está encendido? | Laragon debe mostrar MySQL en verde |

Con `APP_DEBUG=true` (en el `.env`), los errores de la API traen el mensaje real y el `trace`.

---

## La página no abre / error 404
| Síntoma | Causa | Solución |
|---|---|---|
| 404 en `http://localhost/login` | Falta la carpeta en la dirección | Usa `http://localhost/copiwaypro/login`. |
| Aparece la página de Laragon con la lista de proyectos | Abriste `http://localhost/` | Agrega `/copiwaypro/`. |
| "No se puede acceder a este sitio" | Apache apagado | Laragon → **Iniciar todo**. |
| Con `start.bat`, 404 en todo | Abriste otra dirección | Usa `http://localhost:8000/`. |

## Pantalla en blanco
| Causa | Solución |
|---|---|
| React no está compilado (falta `public/assets/main.js`) | `npm run build` |
| Error de JavaScript | F12 → Consola. |
| Error de PHP antes de dibujar | Revisa `php_errors.log`. |

## "Ocurrió un error interno" o un JSON con `"error"`
| Mensaje | Causa | Solución |
|---|---|---|
| `Ocurrio un error interno. Intenta de nuevo mas tarde.` (al abrir cualquier página) | No conecta con MySQL | Enciende MySQL en Laragon y revisa `DB_*` en el `.env`. |
| `Class "X" not found` | Falta un `require_once` del archivo de esa clase, o el archivo cambió de nombre | Agrega `require_once __DIR__ . '/../Models/X.php';` en el archivo que la usa. |
| `Call to undefined function ...` | Se usa una función que no existe o no está cargada | Revisa el nombre y que `helpers.php` esté cargado. |
| `Unknown column ...` | La base de datos no tiene esa columna | Importa de nuevo `schema.sql` o agrega la columna con `ALTER TABLE`. |

## Problemas de inicio de sesión
| Síntoma | Causa | Solución |
|---|---|---|
| "Correo o contraseña incorrectos" con datos correctos | La cuenta está **inactiva** (`activo = 0`) | El admin la reactiva en Equipo y Personal, o en MySQL: `UPDATE AYUDANTE_COCINA SET activo = 1 WHERE correo = '...';` |
| "Demasiados intentos fallidos" | 5 fallos en 15 minutos | Espera 15 minutos, o borra los intentos: `DELETE FROM INTENTO_LOGIN WHERE identificador = 'correo';` |
| La cocina o el domiciliario no puede entrar a su panel con el PIN | La cuenta no tiene PIN | El admin le asigna uno en Equipo y Personal. |
| "Usuario o PIN incorrectos" escribiendo solo el usuario | Hay dos cuentas con el mismo usuario y distinto dominio | Escribe el correo completo. |
| Entras y te saca al login | La sesión venció o la cuenta fue desactivada | Vuelve a iniciar sesión. |
| Error **419** | El token de seguridad venció | Recarga la página (normalmente `api.ts` lo arregla solo). |
| Olvidé la contraseña del admin | — | Crea otro con `php bin\create-admin.php` o cambia el hash en MySQL: `UPDATE ADMINISTRADOR SET contrasena = '<hash>' WHERE correo = '...';` (el hash se genera con `php -r "echo password_hash('NuevaClave123', PASSWORD_DEFAULT);"`). |

## Problemas con pedidos
| Mensaje | Causa |
|---|---|
| "La tienda está cerrada o pausada" | Fuera del horario, cerrada a mano o en pausa. Revisa **Ajustes y Caja**. |
| "Sin stock suficiente de X" | No hay inventario de ese insumo. Súmalo en **Inventario Express**. |
| "Uno de los productos del carrito ya no está disponible" | El producto se ocultó o se borró. |
| "Transición de estado no permitida" | Se intentó saltar un paso (ej: marcar listo un pedido entregado). |
| "Este pedido ya no está disponible para reparto" | Otro domiciliario lo tomó primero. |
| "PIN incorrecto" | El PIN de entrega no coincide. El cliente lo ve en "Órdenes Activas". |
| "Ya se generó un cierre de caja hoy" | Solo se permite un cierre por día por admin. |
| "Tu saldo de puntos cambió..." | Mientras el cliente pagaba, su saldo de puntos bajó (por ejemplo, pagó otro pedido al tiempo). Que revise el pedido e intente de nuevo. |
| "Este colaborador ya tiene pedidos en su historial y no se puede eliminar" | Solo se puede eliminar a quien nunca preparó ni repartió un pedido. Usa **Dar de baja**. |
| "Este pedido ya fue entregado y no se puede cambiar su dirección" | La dirección solo se corrige mientras el pedido está en curso. |
| `Unknown column 'puntos_canjeados'` (u otra columna nueva) | La base de datos es anterior a la migración 001. Ejecútala (ver [Instalación](02-instalacion.md)). |

## React: cambié algo y no se ve
1. ¿Ejecutaste `npm run build`?
2. Recarga sin caché: **Ctrl + F5**.
3. ¿El build terminó sin errores? Ejecuta `npm run lint`.

## `npm install` o `npm run build` fallan
- Verifica Node.js: `node -v` (versión 18 o más nueva).
- Borra `node_modules` y vuelve a instalar: `rmdir /s /q node_modules` y `npm install`.

## Las tildes salen raras (Ã©, Ã±)
La base de datos se importó sin `--default-character-set=utf8mb4`. Vuelve a importarla con ese flag.

## Los mapas no cargan
Necesitan internet (OpenStreetMap). Revisa la conexión o F12 → Consola.

## No llegan las notificaciones ni el correo
Ver [Notificaciones y correo](11-notificaciones-y-correo.md). Lo más común: no se ejecutó
`composer install`, faltan las claves en el `.env`, o en Windows falta `OPENSSL_CONF`.

## Comportamientos conocidos (no son errores de configuración)
- No hay pantalla para **cancelar** un pedido (el estado existe en la base de datos).
- La **pasarela de pagos** es de prueba: no cobra dinero real (ver [Pagos](10-pagos.md)).
- Si el domiciliario no da permiso de ubicación, su mapa simula el recorrido, pero esa posición no
  se envía: el mapa del administrador muestra la última ubicación real que tenga.
