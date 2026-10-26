# 11. Notificaciones y correo

Las dos funciones son **opcionales**: si no están configuradas, el sistema funciona igual.
Las dos están hechas con **PHP puro**, sin librerías ni Composer: usan funciones que ya trae PHP
(`openssl`, `curl` y `stream_socket_client`).

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
      → PushNotificationService cifra el aviso (openssl), lo firma con las llaves VAPID
        y lo manda con curl al servicio push de cada dispositivo del cliente
3. El celular recibe el aviso
      → public/sw.js lo muestra
      → al tocarlo abre /?calificarPedido=ID
```

### Configurarlo
Las claves VAPID **ya vienen puestas**. Solo si quieres unas nuevas (por ejemplo, para otro dominio):
1. Generar un par de claves (una sola vez por instalación), con Node (el mismo que se usa para React):
   ```powershell
   npx web-push generate-vapid-keys
   ```
   (`npx` lo descarga y lo ejecuta una vez; no se agrega nada al proyecto.)
2. Copiar las claves en las constantes de `models/PushNotificationService.php`:
   ```php
   const VAPID_PUBLIC_KEY = '...';
   const VAPID_PRIVATE_KEY = '...';
   const VAPID_SUBJECT = 'mailto:tu-correo@ejemplo.com';
   ```
3. Al cambiar las claves, los clientes tienen que volver a tocar "Activar" (las suscripciones viejas
   se hicieron con la clave anterior).

Ya **no** hace falta configurar `OPENSSL_CONF` en Windows: la llave temporal de cada aviso se crea sin
leer el archivo `openssl.cnf`.

### Requisitos del navegador
Las notificaciones push necesitan `localhost` o **HTTPS**. Funcionan en Chrome, Edge y Firefox; en
iPhone, solo si la página se agregó a la pantalla de inicio.

Cada envío queda registrado en la tabla `NOTIFICACION` (enviado o fallido).

## Correo (recuperar contraseña)
### Qué hace
Envía el **código de 6 dígitos** para recuperar la contraseña.

### Configurarlo
1. Poner los datos del servidor de correo en las constantes de `models/CorreoService.php`. Ejemplo con **Gmail**:
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
- El log dice qué contestó Gmail. Ej.: `535 ... Username and Password not accepted` = la contraseña de
  aplicación está mal; `No se pudo conectar a smtp.gmail.com` = no hay internet o un antivirus bloquea
  el puerto 587.

### Cómo envía el correo (sin librerías)
`CorreoService::enviar()` se conecta a Gmail con `stream_socket_client()` y le habla en **SMTP**:
`EHLO` (hola) → `STARTTLS` (cifrar) → `AUTH LOGIN` (usuario y clave) → `MAIL FROM` / `RCPT TO` (de quién
y para quién) → `DATA` (el correo) → `QUIT`. Gmail contesta cada paso con un código (`220`, `250`,
`235`, `354`, `221`); si contesta otro, el envío se cancela y queda en el log.
