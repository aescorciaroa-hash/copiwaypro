# 11. Notificaciones y correo

Las dos funciones son **opcionales**: si no están configuradas, el sistema funciona igual.
Las dos necesitan las librerías de Composer: `composer install`.

## Notificaciones push (al celular del cliente)
### Qué hace
Cuando el domiciliario confirma la entrega, al cliente le llega una **notificación del sistema**
("¡Tu pedido ha llegado! Cuéntanos, ¿cómo estuvo tu comida?"), **aunque tenga la página cerrada**. Al
tocarla, se abre el sistema directamente en la ventana para calificar el pedido.

### Cómo funciona
```
1. El cliente toca "Activar" en su panel
      → el navegador pide permiso
      → se instala public/sw.js (Service Worker)
      → se crea una suscripción y se guarda en la tabla PUSH_SUSCRIPCION
2. El domiciliario entrega el pedido
      → PedidoService::confirmarEntrega()
      → PushNotificationService envía el aviso a cada dispositivo del cliente
3. El celular recibe el aviso
      → public/sw.js lo muestra
      → al tocarlo abre /?calificarPedido=ID
```

### Configurarlo
1. `composer install`
2. Generar un par de claves VAPID (una sola vez por instalación):
   ```powershell
   php -r "require 'vendor/autoload.php'; print_r(Minishlink\WebPush\VAPID::createVapidKeys());"
   ```
3. Copiar las claves en las constantes de `models/PushNotificationService.php`:
   ```php
   const VAPID_PUBLIC_KEY = '...';
   const VAPID_PRIVATE_KEY = '...';
   const VAPID_SUBJECT = 'mailto:tu-correo@ejemplo.com';
   ```
4. **Solo en Windows con Apache/Laragon:** definir la variable de entorno de Windows `OPENSSL_CONF`
   apuntando al `openssl.cnf` de tu PHP (ej: `C:\laragon\bin\php\php-8.3.8-nts-Win32-vs16-x64\extras\ssl\openssl.cnf`)
   y reiniciar Laragon.

### Requisitos del navegador
Las notificaciones push necesitan `localhost` o **HTTPS**. Funcionan en Chrome, Edge y Firefox; en
iPhone, solo si la página se agregó a la pantalla de inicio.

Cada envío queda registrado en la tabla `NOTIFICACION` (enviado o fallido).

## Correo (recuperar contraseña)
### Qué hace
Envía el **código de 6 dígitos** para recuperar la contraseña.

### Configurarlo
1. `composer install` (instala PHPMailer).
2. Poner los datos del servidor de correo en las constantes de `models/CorreoService.php`. Ejemplo con **Gmail**:
   ```php
   const HOST = 'smtp.gmail.com';
   const PUERTO = 587;
   const CIFRADO = 'tls';
   const USUARIO = 'tucuenta@gmail.com';
   const CLAVE = 'xxxx xxxx xxxx xxxx';
   const REMITENTE = 'tucuenta@gmail.com';
   const REMITENTE_NOMBRE = 'CopiwayPRO';
   ```
   Con Gmail, `CLAVE` **no es tu contraseña normal**: es una **contraseña de aplicación** (se crea en
   la cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones).

### Probar sin correo
Si el correo no está configurado y en `config/app.php` está `'entorno' => 'local'`, la respuesta de `POST /api/auth/forgot-password/request`
trae el código en `debugCode`. Para verlo: en el navegador **F12 → Red (Network)** → la petición
`request` → **Respuesta**.

### Si no llega el correo
- Revisa la carpeta de spam.
- Revisa el log de PHP (`C:\laragon\tmp\php_errors.log`): ahí queda "No se pudo enviar el correo a ...".
- Verifica que `HOST` y `REMITENTE` (en `models/CorreoService.php`) no estén vacíos.
