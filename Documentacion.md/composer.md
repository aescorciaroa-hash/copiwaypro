# composer.json

## ¿Para qué sirve?
Lista las **librerías de PHP** que necesita el proyecto. **Composer** es el programa que las
descarga (en la carpeta `vendor/`) con el comando:
```
composer install
```

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| → crea | `vendor/` y `vendor/autoload.php` | Las librerías descargadas. |
| ← lo carga | `public/index.php` (`require vendor/autoload.php`) | Para poder usar las librerías. |
| → `composer.lock` | (archivo generado) | Guarda la versión **exacta** que se instaló, para que todos tengan la misma. No se edita a mano. |

## Código explicado
```json
"require": {
    "php": ">=8.1",
    "minishlink/web-push": "^9.0",
    "phpmailer/phpmailer": "^7.1"
}
```
| Paquete | Para qué | Quién lo usa |
|---|---|---|
| `php >=8.1` | Exige PHP 8.1 o más nuevo. | — |
| `minishlink/web-push` | Enviar notificaciones push cifradas. | `PushNotificationService.php` |
| `phpmailer/phpmailer` | Enviar correos por SMTP. | `CorreoService.php` |

`^9.0` = "versión 9.0 o cualquier 9.x más nueva, pero no la 10".

```json
"config": { "optimize-autoloader": true, "sort-packages": true }
```
Opciones de Composer: cargar las clases más rápido y mantener la lista ordenada.

Si no se ejecuta `composer install`, la app funciona igual, pero sin correos ni notificaciones push.
