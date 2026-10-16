# 8. Configuración

Hay dos tipos de configuración:
1. **El archivo `.env`**: datos técnicos (base de datos, claves, correo). Lo cambia el programador.
2. **Los ajustes de la tienda**: horario, tarifa, margen... Los cambia el administrador desde el panel.

## 1. El archivo `.env`
Está en la raíz del proyecto. Se crea copiando `.env.example`. **No se sube a GitHub** (tiene claves).
Formato: `CLAVE=valor`, una por línea; las líneas con `#` son comentarios.

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `APP_ENV` | `local` | `local` o `production`. En `local`, si el correo no sale, la recuperación de contraseña devuelve el código para probar. |
| `APP_DEBUG` | `true` | Mostrar el detalle de los errores. **`false` en producción.** |
| `APP_KEY` | (cámbialo) | Clave secreta para firmar los pagos. Pon un texto largo al azar. |
| `APP_BASE_PATH` | vacío | Carpeta del proyecto. Vacío = se detecta sola (recomendado). |
| `APP_TIMEZONE` | `America/Bogota` | Zona horaria (no viene en el ejemplo; se puede agregar). |
| `DB_HOST`, `DB_PORT` | `127.0.0.1`, `3306` | Dónde está MySQL. |
| `DB_NAME` | `hamburguer_copiway` | Nombre de la base de datos. |
| `DB_USER`, `DB_PASS` | `root`, vacío | Usuario y contraseña de MySQL (así viene Laragon). |
| `SESSION_NAME` | `copiway_session` | Nombre de la cookie de sesión. |
| `SESSION_LIFETIME` | `120` | Minutos que dura la sesión. |
| `RATE_LIMIT_LOGIN_MAX_ATTEMPTS` | `5` | Intentos de login fallidos permitidos. |
| `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | `15` | En cuántos minutos se cuentan. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | vacíos | Claves para notificaciones push (ver [Notificaciones](11-notificaciones-y-correo.md)). |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_ENCRYPTION`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_FROM_NAME` | vacíos / `587` / `tls` | Servidor de correo (ver [Notificaciones](11-notificaciones-y-correo.md)). |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Solo para `npm run dev`: a dónde enviar las llamadas `/api`. |

**¿Cómo lo lee PHP?** `config/database.php` lee `.env.example` y encima `.env`, y cualquier archivo
puede pedir un valor con `env('NOMBRE', 'valor por defecto')`.

Los cambios en el `.env` se aplican al recargar la página (no hay que reiniciar nada).

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
