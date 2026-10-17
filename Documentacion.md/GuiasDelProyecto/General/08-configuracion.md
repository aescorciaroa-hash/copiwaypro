# 8. Configuración

Hay dos tipos de configuración:
1. **Datos técnicos** (base de datos, claves, correo): están escritos en el código PHP. Los cambia el programador.
2. **Los ajustes de la tienda**: horario, tarifa, margen... Los cambia el administrador desde el panel.

## 1. Datos técnicos (en el código)
Cada dato está en el archivo que lo usa:

| Qué | Archivo | Valor por defecto |
|---|---|---|
| Conexión a MySQL: `$host`, `$user`, `$password`, `$bd`, `$port` | `config/database.php` | `127.0.0.1`, `root`, vacío, `hamburguer_copiway`, `3306` (así viene Laragon) |
| `'entorno'` | `config/app.php` | `'local'`. En `local`, si el correo no sale, la recuperación de contraseña devuelve el código para probar. |
| `'debug'` | `config/app.php` | `true`: muestra el detalle de los errores. **`false` en producción.** |
| `'zona_horaria'` | `config/app.php` | `'America/Bogota'` |
| `'ruta_base'` | `config/app.php` | vacío = la carpeta del proyecto se detecta sola (recomendado). |
| `NOMBRE`, `DURACION_MINUTOS` (sesión) | `config/Session.php` | `'copiway_session'`, `120` minutos |
| `MAXIMO_INTENTOS`, `VENTANA_MINUTOS` (login) | `models/IntentoLogin.php` | `5` intentos fallidos en `15` minutos |
| `CLAVE_FIRMA` (pagos) | `models/PagoService.php` | Cámbiala por un texto largo al azar. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `models/PushNotificationService.php` | Claves para notificaciones push (ver [Notificaciones](11-notificaciones-y-correo.md)). |
| `HOST`, `PUERTO`, `CIFRADO`, `USUARIO`, `CLAVE`, `REMITENTE`, `REMITENTE_NOMBRE` | `models/CorreoService.php` | Servidor de correo (ver [Notificaciones](11-notificaciones-y-correo.md)). Vacíos = no se envían correos. |

Las constantes de una clase se leen con `self::NOMBRE` dentro de la clase. El arreglo de
`config/app.php` queda en la variable `$config` (la carga `public/index.php`).

Para `npm run dev`, el destino del proxy `/api` se cambia con la variable de entorno
`VITE_API_PROXY_TARGET` (por defecto `http://localhost/copiwaypro`).

Los cambios se aplican al recargar la página (no hay que reiniciar nada).

## 2. Ajustes de la tienda (panel del administrador)
En **Ajustes y Caja**. Se guardan en la tabla `CONFIGURACION_SISTEMA` (una sola fila).

| Ajuste | Columna | Qué controla |
|---|---|---|
| Hora de apertura y cierre | `horario_apertura`, `horario_cierre` | Fuera de este horario no se aceptan pedidos. Acepta horarios que pasan la medianoche (ej: 18:00 a 02:00). |
| Tienda abierta / cerrada (manual) | `tienda_abierta_manual` | Cerrar la tienda aunque esté dentro del horario. |
| Pausa de emergencia | `pausa_emergencia_activa` | Detener los pedidos de inmediato (ej: se acabó el gas). |
| Tarifa de domicilio | `tarifa_plana_domicilio` | Lo que se cobra por envío en cada pedido. |
| Margen de ganancia | `margen_ganancia_defecto` | Porcentaje que se suma al costo de cada ingrediente extra para calcular su precio. |
| Valor de 1 punto | `valor_punto` | Pesos que descuenta cada punto cuando el cliente los canjea (por defecto $10, o sea el 1 % de lo comprado). |
| Mínimo para canjear | `minimo_puntos_canje` | Desde cuántos puntos el cliente puede usarlos (por defecto 100). |
| Datos del negocio | `negocio_nombre`, `negocio_nit`, `negocio_direccion`, `negocio_telefono`, `negocio_instagram`, `negocio_web` | Lo que se imprime en el ticket de cocina. El nombre es obligatorio; los vacíos no se imprimen. |
| Categorías del menú | tabla `CATEGORIA` | Se administran en **Gestión de Menú**. |

**La tienda acepta pedidos solo si:** está abierta a mano **y** no está en pausa **y** la hora actual
está dentro del horario. Se revisa en el servidor (`Configuracion::tiendaAbiertaAhora()`) y también en
la pantalla del cliente.

### Ejemplo del margen
Un ingrediente cuesta $1.500 y el margen es 35 %:
`1.500 × 1,35 = 2.025` → redondeado a la centena → **$2.000** de precio extra.
