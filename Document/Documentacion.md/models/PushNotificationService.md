# models/PushNotificationService.php
¿No entiendes una palabra? Mira el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Envía la notificación "tu pedido llegó" al celular del cliente. La cifra y la firma con PHP puro (`openssl` y `curl`, que ya vienen en PHP), sin librerías.

## ¿Qué hace?
- avisa que el pedido llegó
- cifra el aviso para que solo el celular del cliente lo pueda leer
- lo firma con las llaves VAPID (prueba que viene de esta tienda)
- lo manda al servicio push del navegador (Chrome, Firefox…)
- borra los celulares que ya no existen y guarda si se envió

## Sus métodos
| Método | Qué hace | Lo usan |
|---|---|---|
| `notificarPedidoEntregado()` | avisa que el pedido llegó | `PedidoService::confirmarEntrega()` |
| `enviarATodosLosDispositivos()` (privado) | envía el aviso a todos los celulares del cliente | `PushNotificationService::notificarPedidoEntregado()` |
| `enviarUno()` (privado) | cifra y manda el aviso a un celular (con `curl`) | `PushNotificationService::enviarATodosLosDispositivos()` |
| `cabeceraVapid()` (privado) | arma la firma VAPID | `PushNotificationService::enviarUno()` |
| `cifrar()` (privado) | cifra el aviso (estándar Web Push, `aes128gcm`) | `PushNotificationService::enviarUno()` |
| `registrarEnvio()` (privado) | guarda que se envió el aviso | `PushNotificationService::enviarATodosLosDispositivos()` |
| `base64Url()`, `desdeBase64Url()` (privados) | pasan de bytes a texto y al revés | los de arriba |
| `llavePublicaPem()`, `llavePrivadaPem()` (privados) | ponen las llaves en el formato de openssl | `cifrar()`, `cabeceraVapid()` |
| `firmaDerACruda()` (privado) | cambia la firma al formato del token | `cabeceraVapid()` |

## ¿Con qué se conecta?
- **Lo cargan:** `controllers/PushController.php`, `models/PedidoService.php`.
- **Usa:** `PushSuscripcion`.
- **La base de datos:** con `global $conn;` en el constructor (la conexión de `config/database.php`).
- **Se conecta con:** el servicio push del navegador del cliente (la dirección `endpoint` guardada en `PUSH_SUSCRIPCION`), con `curl`.

**Cómo llega el aviso al celular, paso a paso:**
1. `cifrar()`: crea una llave temporal, calcula un secreto compartido con la llave del celular (`openssl_pkey_derive`) y cifra el mensaje (`openssl_encrypt`, AES-128-GCM).
2. `cabeceraVapid()`: firma un token con la llave privada VAPID (`openssl_sign`).
3. `enviarUno()`: manda el mensaje cifrado + la firma con `curl` (método `POST`).
4. El servicio push contesta `201` (enviado) o `404`/`410` (ese celular ya no existe → se borra).
5. El navegador del cliente lo descifra y `public/sw.js` muestra la notificación.

<!-- conexiones-y-preguntas:inicio -->

### Paso a paso: cómo se conecta
1. **Base de datos:** en el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.
2. **Tablas que toca:** NOTIFICACION.
3. **Quién lo usa:** `models/PedidoService.php` (al entregar un pedido) y `PushController`.
4. **Otros que usa:** `PushSuscripcion` (a qué celulares mandar), las llaves `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, y funciones de PHP: `openssl` (cifrar y firmar) y `curl` (enviar). **No usa librerías.**
5. **Sus métodos que otros pueden llamar:** `notificarPedidoEntregado()`.

```
React → /api/... → public/index.php → config/rutas.php → Controlador → PushNotificationService → MySQL
```

### Preguntas que te pueden hacer sobre este archivo

**¿Cómo se conecta `PushNotificationService` a la base de datos?**  
En el `__construct()` hace `global $conn;` y `$this->conn = $conn;` (la conexión que crea `config/database.php`). Después cada método usa `$this->conn->prepare(...)`.

**¿Con qué se conecta `PushNotificationService`?**  
Con la base de datos (tablas NOTIFICACION); con quien lo usa: `models/PedidoService.php` (al entregar un pedido) y `PushController`. Y con: `PushSuscripcion` (a qué celulares mandar), las llaves `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, y funciones de PHP: `openssl` (cifrar y firmar) y `curl` (enviar). **No usa librerías.**

**¿Dónde se crea la conexión que usa?**  
En `config/database.php` (`$conn = new mysqli(...)`). La carga `public/index.php` una sola vez.

**¿Con qué se conecta además de MySQL?**  
Con el servicio de notificaciones del navegador (Chrome, Firefox…): le manda el aviso con `curl` a la dirección (`endpoint`) que guardó el celular.

**¿Por qué hay que cifrar el aviso?**  
El estándar Web Push lo exige: el aviso pasa por los servidores de Google o Mozilla y solo el celular del cliente lo puede leer. Se cifra con `openssl_encrypt` (AES-128-GCM).

**¿Usa alguna librería?**  
No. Antes usaba `minishlink/web-push` (Composer); ahora lo hace con `openssl` y `curl`, que ya vienen en PHP.

**¿Qué pasa si el celular ya no existe?**  
El servicio push contesta `404` o `410` y la suscripción se borra (`eliminarPorEndpoint()`).

**¿Qué son las llaves VAPID?**  
Un par de llaves que prueban que el aviso viene de esta tienda. La pública también la usa React (`/api/push/public-key`).

**¿Qué pasa si se borra este archivo?**  
Los archivos que lo usan fallan con *"Failed opening required '...PushNotificationService.php'"* o *"Class 'PushNotificationService' not found"* (error 500).

Más preguntas generales: [¿Cómo se conecta todo?](../GuiasDelProyecto/General/16-conexiones-y-preguntas.md).

<!-- conexiones-y-preguntas:fin -->

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-6 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Envia notificaciones Web Push (VAPID) a los dispositivos del cliente, para que salgan como notificacion del sistema aunque el navegador este cerrado. Hecho con PHP puro (openssl + curl), sin librerias."* |
| 7 | `require_once __DIR__ . '/PushSuscripcion.php';` | Trae `models/PushSuscripcion.php` (los celulares suscritos). |
| 9 | `class PushNotificationService` | Crea la clase `PushNotificationService`: envía la notificación "tu pedido llegó" al celular del cliente. La usan `PedidoService` (al entregar) y `PushController` (la clave pública). |
| 10 | `{` | Abre la clase `PushNotificationService`. |
| 11 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Llaves VAPID. Cada instalacion (cada dominio) deberia tener su propio par."* |
| 12 | `const VAPID_PUBLIC_KEY = 'BPzLGFNPSprvi7FA4U_LsU0cIXXAOuNy1QC-6ay1KoW-Ua_Ad9oDDpsYNkKzVsm-ix-ALDVdgwPm8_QF5N1NsaE';` | Constante `VAPID_PUBLIC_KEY`: la clave pública (la necesita el navegador para suscribirse). |
| 13 | `const VAPID_PRIVATE_KEY = '36xY3qG43_1TDAFsBYBplslNz7zffuKmf7ZLPuLs2fI';` | Constante `VAPID_PRIVATE_KEY`: la clave privada (firma las notificaciones). No se comparte. |
| 14 | `const VAPID_SUBJECT = 'mailto:soporte@copiway.com';` | Constante `VAPID_SUBJECT`: un contacto del dueño del sistema. |
| 16 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Cuanto tiempo guarda el servicio push el aviso si el celular esta apagado (4 semanas)"* |
| 17 | `const TTL_SEGUNDOS = 2419200;` | Constante `TTL_SEGUNDOS`: si el celular está apagado, el servicio guarda el aviso hasta 4 semanas (2.419.200 segundos). |
| 19 | `private $conn;` | Cajita `$conn` de la clase: aquí se guarda la conexión a la base de datos. |
| 20 | `private $suscripcionModel;` | Cajita `$suscripcionModel` de la clase: aquí se guarda el modelo `PushSuscripcion`. |
| 22 | `public function __construct()` | Función `__construct()`: se ejecuta sola apenas se crea la clase (`new`). Prepara lo que se va a usar. |
| 23 | `{` | Abre la función `__construct()`. |
| 24 | `global $conn;` | Trae la conexión `$conn` (la que se crea en `config/database.php`). |
| 25 | `$this->conn = $conn;` | Guarda la conexión en `$this->conn`, para usarla en todas las consultas de esta clase. |
| 26 | `$this->suscripcionModel = new PushSuscripcion();` | Crea el modelo `PushSuscripcion` y lo guarda en `$this->suscripcionModel`, para usarlo en las funciones de abajo. |
| 27 | `}` | Cierra la función `__construct()`. |
| 29 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Avisa al cliente que su pedido llego, con enlace para calificarlo."* |
| 30 | `public function notificarPedidoEntregado($idPedido, $idCliente)` | Método `notificarPedidoEntregado($idPedido, $idCliente)`: avisa al cliente que su pedido llegó. Lo usa `PedidoService::confirmarEntrega()`. |
| 31 | `{` | Abre la función `notificarPedidoEntregado()`. |
| 32 | `$this->enviarATodosLosDispositivos($idCliente, $idPedido, [` | Lo envía a todos sus celulares (`enviarATodosLosDispositivos()` de abajo) con este contenido: |
| 33 | `'title' => '¡Tu pedido ha llegado!',` | el título "¡Tu pedido ha llegado!", |
| 34 | `'body'  => 'Cuéntanos, ¿cómo estuvo tu comida?',` | el texto "Cuéntanos, ¿cómo estuvo tu comida?", |
| 35 | `'tag'   => 'pedido-entregado-' . $idPedido,` | una etiqueta para no repetir la notificación, |
| 36 | `'url'   => rutaBase() . '/?calificarPedido=' . $idPedido,` | y la dirección que se abre al tocarla (para calificar el pedido). |
| 37 | `]);` | Cierra la lista y la instrucción. |
| 38 | `}` | Cierra la función `notificarPedidoEntregado()`. |
| 40 | `private function enviarATodosLosDispositivos($idCliente, $idPedido, $payload)` | Método `enviarATodosLosDispositivos(...)` (privado): envía la notificación a todos los celulares del cliente. |
| 41 | `{` | Abre la función `enviarATodosLosDispositivos()`. |
| 42 | `if (self::VAPID_PUBLIC_KEY === '' \|\| self::VAPID_PRIVATE_KEY === '') {` | Si falta alguna de las llaves VAPID... |
| 43 | `return; // VAPID sin configurar.` | ...sale sin enviar nada. |
| 44 | `}` | Cierra el `if`. |
| 46 | `$suscripciones = $this->suscripcionModel->listarPorCliente($idCliente);` | Trae los celulares suscritos del cliente (`listarPorCliente()` de `models/PushSuscripcion.php`). |
| 47 | `if (empty($suscripciones)) {` | Si no tiene ninguno... |
| 48 | `return;` | ...sale. |
| 49 | `}` | Cierra el `if`. |
| 51 | `$mensaje = json_encode($payload);` | Convierte el aviso (título, texto, enlace) a texto JSON. |
| 52 | `$huboEnvio = false;` | `$huboEnvio` empieza en `false`; pasa a `true` si al menos un celular lo recibe. |
| 53 | `foreach ($suscripciones as $s) {` | Recorre cada celular suscrito (`$s`). |
| 54 | `try {` | Intenta... |
| 55 | `$codigo = $this->enviarUno($s['endpoint'], $s['clave_p256dh'], $s['clave_auth'], $mensaje);` | ...mandar el aviso a ese celular (`enviarUno()` de abajo). Guarda en `$codigo` lo que contestó el servicio push. |
| 56 | `} catch (Exception $e) {` | Si falló... |
| 57 | `error_log('No se pudo enviar la notificacion push: ' . $e->getMessage());` | ...escribe el error en el log de PHP... |
| 58 | `continue;` | ...y sigue con el siguiente celular. |
| 59 | `}` | Cierra el `catch`. |
| 61 | `if ($codigo >= 200 && $codigo < 300) {` | Si contestó entre 200 y 299 (ej. `201`)... |
| 62 | `$huboEnvio = true;` | ...el aviso salió. |
| 63 | `} elseif ($codigo === 404 \|\| $codigo === 410) {` | Si contestó `404` o `410`, ese celular ya no existe o quitó el permiso... |
| 64 | *(comentario)* | Comentario: no se ejecuta. Dice: *"El navegador invalido la suscripcion: se borra."* |
| 65 | `$this->suscripcionModel->eliminarPorEndpoint($s['endpoint']);` | ...y se borra su suscripción (`eliminarPorEndpoint()` de `PushSuscripcion`). |
| 66 | `}` | Cierra el `elseif`. |
| 67 | `}` | Cierra el `foreach`. |
| 69 | `$this->registrarEnvio($idPedido, $huboEnvio);` | Guarda en `NOTIFICACION` si se envió o no (`registrarEnvio()` de abajo). |
| 70 | `}` | Cierra la función `enviarATodosLosDispositivos()`. |
| 72-75 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cifra el mensaje para un dispositivo y lo manda a su servicio push (el de Chrome, Firefox...). Devuelve el codigo HTTP que respondio."* |
| 76 | `private function enviarUno($endpoint, $claveP256dh, $claveAuth, $mensaje)` | Método privado `enviarUno(...)`: cifra el aviso y lo manda a un celular. `$endpoint` = la dirección del servicio push de ese celular. |
| 77 | `{` | Abre la función `enviarUno()`. |
| 78 | `$cuerpo = $this->cifrar($mensaje, $claveP256dh, $claveAuth);` | Cifra el mensaje (`cifrar()` de abajo): solo ese celular lo puede leer. |
| 80 | `$curl = curl_init($endpoint);` | Prepara una petición a la dirección del servicio push con `curl` (la herramienta de PHP para llamar a otras páginas). |
| 81 | `curl_setopt($curl, CURLOPT_POST, true);` | La petición es `POST`. |
| 82 | `curl_setopt($curl, CURLOPT_POSTFIELDS, $cuerpo);` | Lo que se manda: el mensaje cifrado. |
| 83 | `curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);` | Que no imprima la respuesta en la página. |
| 84 | `curl_setopt($curl, CURLOPT_TIMEOUT, 10);` | Espera máximo 10 segundos. |
| 85 | `curl_setopt($curl, CURLOPT_HTTPHEADER, [` | Las cabeceras de la petición: |
| 86 | `'Content-Type: application/octet-stream',` | El cuerpo son datos cifrados (no texto). |
| 87 | `'Content-Encoding: aes128gcm',` | El tipo de cifrado (`aes128gcm`, el del estándar Web Push). |
| 88 | `'TTL: ' . self::TTL_SEGUNDOS,` | Cuánto tiempo guardarlo si el celular está apagado. |
| 89 | `'Authorization: ' . $this->cabeceraVapid($endpoint),` | La firma VAPID que prueba que el aviso viene de esta tienda (`cabeceraVapid()` de abajo). |
| 90 | `]);` | Cierra la lista y la instrucción. |
| 91 | `curl_exec($curl);` | **Envía** la petición. |
| 92 | `$error = curl_error($curl);` | Si hubo un error de red, el texto queda en `$error`. |
| 93 | `$codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);` | El código que contestó el servicio push (ej. `201`). |
| 94 | `curl_close($curl);` | Cierra la petición. |
| 96 | `if ($codigo === 0) {` | Si el código es 0 (no contestó nadie)... |
| 97 | `throw new Exception('Sin respuesta del servicio push: ' . $error);` | ...lanza un error. |
| 98 | `}` | Cierra el `if`. |
| 99 | `return $codigo;` | Devuelve el código. |
| 100 | `}` | Cierra la función `enviarUno()`. |
| 102-105 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cabecera "Authorization" VAPID: un token (JWT) firmado con la llave privada, que prueba que el aviso viene de esta tienda."* |
| 106 | `private function cabeceraVapid($endpoint)` | Método privado `cabeceraVapid(...)`: arma la firma VAPID para la cabecera `Authorization`. |
| 107 | `{` | Abre la función `cabeceraVapid()`. |
| 108 | *(comentario)* | Comentario: no se ejecuta. Dice: *""aud" = el servidor del servicio push (ej. https://fcm.googleapis.com)"* |
| 109 | `$partes = parse_url($endpoint);` | Separa la dirección en partes (`https`, `fcm.googleapis.com`...). |
| 110 | `$audiencia = $partes['scheme'] . '://' . $partes['host'];` | Arma `https://fcm.googleapis.com`: el servicio al que va dirigida la firma. |
| 112 | `$encabezado = self::base64Url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));` | Primera parte del token (JWT): dice que se firma con `ES256`. Va en base64. |
| 113 | `$datos = self::base64Url(json_encode([` | Segunda parte del token: los datos. |
| 114 | `'aud' => $audiencia,` | `aud` = para qué servicio es. |
| 115 | `'exp' => time() + 12 * 3600,` | `exp` = vence en 12 horas. |
| 116 | `'sub' => self::VAPID_SUBJECT,` | `sub` = el correo de contacto de la tienda. |
| 117 | `], JSON_UNESCAPED_SLASHES));` | Cierra la lista. `JSON_UNESCAPED_SLASHES` = deja las `/` tal cual. |
| 118 | `$textoAFirmar = $encabezado . '.' . $datos;` | Une las dos partes con un punto: eso es lo que se firma. |
| 120 | `$llavePrivada = self::llavePrivadaPem(` | Prepara la llave privada VAPID en el formato que entiende openssl... |
| 121 | `self::desdeBase64Url(self::VAPID_PRIVATE_KEY),` | ...con la llave privada... |
| 122 | `self::desdeBase64Url(self::VAPID_PUBLIC_KEY)` | ...y la pública. |
| 123 | `);` | Cierra la instrucción. |
| 124 | `if (!openssl_sign($textoAFirmar, $firmaDer, $llavePrivada, OPENSSL_ALGO_SHA256)) {` | **Firma** el texto con la llave privada (`openssl_sign`). La firma queda en `$firmaDer`. Si no se pudo... |
| 125 | `throw new Exception('No se pudo firmar el token VAPID.');` | ...lanza un error. |
| 126 | `}` | Cierra el `if`. |
| 127 | `$firma = self::firmaDerACruda($firmaDer);` | Cambia la firma al formato que pide el token (`firmaDerACruda()` de abajo). |
| 129 | `return 'vapid t=' . $textoAFirmar . '.' . self::base64Url($firma) . ', k=' . self::VAPID_PUBLIC_KEY;` | Devuelve la cabecera: `vapid t=<token firmado>, k=<llave pública>`. |
| 130 | `}` | Cierra la lista. |
| 132-135 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Cifra el mensaje como pide el estandar Web Push (RFC 8291, "aes128gcm"): solo el navegador del cliente lo puede leer."* |
| 136 | `private function cifrar($mensaje, $claveP256dh, $claveAuth)` | Método privado `cifrar(...)`: cifra el aviso con las llaves del celular, como pide el estándar Web Push. |
| 137 | `{` | Abre la función `cifrar()`. |
| 138 | `$publicaCliente = self::desdeBase64Url($claveP256dh);  // 65 bytes` | La llave pública del celular (columna `clave_p256dh`). |
| 139 | `$secretoAuth = self::desdeBase64Url($claveAuth);        // 16 bytes` | El secreto del celular (columna `clave_auth`). |
| 141 | *(comentario)* | Comentario: no se ejecuta. Dice: *"1. Un par de llaves nuevo solo para este mensaje: la privada son 32 bytes al azar y"* |
| 142 | *(comentario)* | Comentario: no se ejecuta. Dice: *"openssl calcula la publica. (No se usa openssl_pkey_new() porque en Windows"* |
| 143 | *(comentario)* | Comentario: no se ejecuta. Dice: *"falla si PHP no encuentra el archivo openssl.cnf.)"* |
| 144 | `$llaveTemporal = false;` | `$llaveTemporal` = una llave nueva solo para este mensaje. Empieza en `false`. |
| 145 | `$intentos = 0;` | Cuenta los intentos. |
| 146 | `while ($llaveTemporal === false && $intentos < 3) {` | Mientras no haya llave y no se hayan hecho 3 intentos... |
| 147 | `$llaveTemporal = openssl_pkey_get_private(self::llavePrivadaPem(random_bytes(32), ''));` | ...crea una llave privada con 32 bytes al azar (`random_bytes`); openssl calcula la pública. |
| 148 | `$intentos++;` | Suma un intento. |
| 149 | `}` | Cierra el `while`. |
| 150 | `if ($llaveTemporal === false) {` | Si no se pudo crear... |
| 151 | `throw new Exception('No se pudo crear la llave temporal.');` | ...lanza un error. |
| 152 | `}` | Cierra el `if`. |
| 153 | `$detalles = openssl_pkey_get_details($llaveTemporal);` | Saca los datos de la llave (los números `x` y `y` de la parte pública). |
| 154 | `$publicaServidor = "\x04"` | Arma nuestra llave pública: empieza con el byte `04`... |
| 155 | `. str_pad($detalles['ec']['x'], 32, "\0", STR_PAD_LEFT)` | ...luego `x` (32 bytes)... |
| 156 | `. str_pad($detalles['ec']['y'], 32, "\0", STR_PAD_LEFT);` | ...y `y` (32 bytes). Total: 65 bytes. |
| 158 | *(comentario)* | Comentario: no se ejecuta. Dice: *"2. Secreto compartido entre nuestra llave temporal y la llave del cliente (ECDH)"* |
| 159 | `$secretoCompartido = openssl_pkey_derive(self::llavePublicaPem($publicaCliente), $llaveTemporal, 32);` | Calcula un **secreto compartido** entre nuestra llave y la del celular (ECDH). El celular puede calcular el mismo secreto; nadie más. |
| 160 | `if ($secretoCompartido === false) {` | Si no se pudo (llave del celular dañada)... |
| 161 | `throw new Exception('Llave del dispositivo invalida.');` | ...lanza un error. |
| 162 | `}` | Cierra el `if`. |
| 164 | *(comentario)* | Comentario: no se ejecuta. Dice: *"3. De ese secreto salen la llave y el "nonce" para cifrar (HKDF)"* |
| 165 | `$infoClave = "WebPush: info\0" . $publicaCliente . $publicaServidor;` | Texto fijo del estándar + las dos llaves públicas. |
| 166 | `$clave = hash_hkdf('sha256', $secretoCompartido, 32, $infoClave, $secretoAuth);` | Mezcla el secreto compartido con el secreto del celular (`hash_hkdf`) y saca una clave. |
| 167 | `$sal = random_bytes(16);` | 16 bytes al azar (la "sal"): así el mismo mensaje nunca se cifra igual. |
| 168 | `$llaveCifrado = hash_hkdf('sha256', $clave, 16, "Content-Encoding: aes128gcm\0", $sal);` | De la clave saca la llave para cifrar (16 bytes). |
| 169 | `$nonce = hash_hkdf('sha256', $clave, 12, "Content-Encoding: nonce\0", $sal);` | Y el `nonce` (12 bytes), un número que se usa una sola vez. |
| 171 | *(comentario)* | Comentario: no se ejecuta. Dice: *"4. Cifrar (AES-128-GCM). El "\x02" marca que es el ultimo (y unico) bloque."* |
| 172 | `$cifrado = openssl_encrypt($mensaje . "\x02", 'aes-128-gcm', $llaveCifrado, OPENSSL_RAW_DATA, $nonce, $etiqueta);` | **Cifra** el mensaje con AES-128-GCM. El `\x02` del final dice que es el último bloque. `$etiqueta` = un sello para detectar si alguien lo cambió. |
| 174 | *(comentario)* | Comentario: no se ejecuta. Dice: *"5. Cuerpo final: sal + tamano de bloque (4096) + nuestra llave publica + mensaje cifrado"* |
| 175 | `return $sal . pack('N', 4096) . chr(strlen($publicaServidor)) . $publicaServidor . $cifrado . $etiqueta;` | Devuelve el cuerpo: la sal + el tamaño de bloque (4096) + el largo y nuestra llave pública + el mensaje cifrado + el sello. |
| 176 | `}` | Cierra la función `cifrar()`. |
| 178 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Deja registro del envio en NOTIFICACION."* |
| 179 | `private function registrarEnvio($idPedido, $exito)` | Método `registrarEnvio($idPedido, $exito)` (privado): anota el envío en la tabla `NOTIFICACION`. |
| 180 | `{` | Abre la función `registrarEnvio()`. |
| 181 | `$estado = $exito ? 'enviado' : 'fallido';` | `'enviado'` si salió bien; si no, `'fallido'`. |
| 182 | `$stmt = $this->conn->prepare(` | Prepara la consulta: "guarda en `NOTIFICACION` que se envió un push para ese pedido, con su estado". |
| 183 | `"INSERT INTO NOTIFICACION (id_pedido, tipo, mensaje, estado_envio) VALUES (?, 'push', 'Tu pedido ha llegado', ?)"` | ↑ (sigue la misma instrucción) |
| 184 | `);` | Cierra la instrucción. |
| 185 | `$stmt->bind_param("is", $idPedido, $estado);` | Llena los `?` de la consulta, en orden: `$idPedido` (número entero), `$estado` (texto). |
| 186 | `$stmt->execute();` | Ejecuta la consulta. |
| 187 | `$stmt->close();` | Cierra la consulta. |
| 188 | `}` | Cierra la función `registrarEnvio()`. |
| 190 | *(comentario)* | Comentario: no se ejecuta. Dice: *"---- Ayudas para las llaves (formatos que entiende openssl) ----"* |
| 192 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"base64 "para direcciones": sin =, con - y _ en vez de + y /"* |
| 193 | `private static function base64Url($datos)` | Método privado `base64Url(...)`: convierte bytes a texto base64 "para direcciones". |
| 194 | `{` | Abre la función `base64Url()`. |
| 195 | `return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');` | Hace base64, cambia `+` y `/` por `-` y `_`, y quita los `=` del final. |
| 196 | `}` | Cierra la función `base64Url()`. |
| 198 | `private static function desdeBase64Url($texto)` | Método privado `desdeBase64Url(...)`: lo contrario: de texto base64 a bytes. |
| 199 | `{` | Abre la función `desdeBase64Url()`. |
| 200 | `return base64_decode(strtr($texto, '-_', '+/'));` | Cambia `-` y `_` por `+` y `/` y decodifica. |
| 201 | `}` | Cierra la función `desdeBase64Url()`. |
| 203 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte la llave publica cruda (65 bytes) en formato PEM."* |
| 204 | `private static function llavePublicaPem($publica)` | Método privado `llavePublicaPem(...)`: pone una llave pública en el formato PEM que entiende openssl. |
| 205 | `{` | Abre la función `llavePublicaPem()`. |
| 206 | *(comentario)* | Comentario: no se ejecuta. Dice: *"Prefijo fijo que dice "llave publica EC, curva P-256""* |
| 207 | `$prefijo = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200');` | Un prefijo fijo que significa "llave pública EC, curva P-256". |
| 208 | `return "-----BEGIN PUBLIC KEY-----\n"` | Devuelve el texto PEM: la línea de inicio... |
| 209 | `. chunk_split(base64_encode($prefijo . $publica), 64, "\n")` | ...el prefijo + la llave en base64, en líneas de 64 letras... |
| 210 | `. "-----END PUBLIC KEY-----\n";` | ...y la línea de final. |
| 211 | `}` | Cierra la función `llavePublicaPem()`. |
| 213-216 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte la llave privada cruda (32 bytes) + la publica en formato PEM. Si la publica va vacia ('') openssl la calcula sola al leer la llave."* |
| 217 | `private static function llavePrivadaPem($privada, $publica)` | Método privado `llavePrivadaPem(...)`: pone una llave privada en formato PEM. |
| 218 | `{` | Abre la función `llavePrivadaPem()`. |
| 219 | `if ($publica === '') {` | Si no se pasó la pública... |
| 220 | `$der = hex2bin('30310201010420') . $privada . hex2bin('a00a06082a8648ce3d030107');` | ...arma la llave solo con la privada (openssl calcula la pública al leerla). |
| 221 | `} else {` | Si sí se pasó... |
| 222 | `$der = hex2bin('30770201010420') . $privada` | ...arma la llave con la privada... |
| 223 | `. hex2bin('a00a06082a8648ce3d030107a144034200') . $publica;` | ...y la pública. |
| 224 | `}` | Cierra el `else`. |
| 225 | `return "-----BEGIN EC PRIVATE KEY-----\n"` | Devuelve el texto PEM: la línea de inicio... |
| 226 | `. chunk_split(base64_encode($der), 64, "\n")` | ...la llave en base64, en líneas de 64 letras... |
| 227 | `. "-----END EC PRIVATE KEY-----\n";` | ...y la línea de final. |
| 228 | `}` | Cierra la función `llavePrivadaPem()`. |
| 230 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"openssl firma en formato DER; el JWT necesita los dos numeros (r y s) pegados, 32 bytes cada uno."* |
| 231 | `private static function firmaDerACruda($der)` | Método privado `firmaDerACruda(...)`: openssl da la firma en formato DER; el token necesita los dos números de la firma (`r` y `s`) pegados. |
| 232 | `{` | Abre la función `firmaDerACruda()`. |
| 233 | `$posicion = 3; // salta 30 (secuencia), largo, 02 (entero)` | Empieza a leer en la posición 3 (salta los bytes de formato). |
| 234 | `$largoR = ord($der[$posicion]);` | Lee cuántos bytes mide `r`. |
| 235 | `$r = substr($der, $posicion + 1, $largoR);` | Saca `r`. |
| 236 | `$posicion = $posicion + 1 + $largoR + 1; // salta r y el 02 de s` | Salta `r` para llegar a `s`. |
| 237 | `$largoS = ord($der[$posicion]);` | Lee cuántos bytes mide `s`. |
| 238 | `$s = substr($der, $posicion + 1, $largoS);` | Saca `s`. |
| 240 | `$r = str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT);` | Deja `r` en 32 bytes exactos. |
| 241 | `$s = str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);` | Deja `s` en 32 bytes exactos. |
| 242 | `return $r . $s;` | Devuelve los dos pegados (64 bytes). |
| 243 | `}` | Cierra la función `firmaDerACruda()`. |
| 244 | `}` | Cierra la función `cabeceraVapid()`. |
| 245 | `?>` | Cierra el código PHP. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | recargar los pedidos después del cierre de caja, hacer pedidos (cliente), registrar pedidos por llamada o WhatsApp, cambiar la dirección de un pedido, guardar el destino en el mapa del domiciliario, pasar pedidos a "En preparación", pasar pedidos a "Listo", tomar pedidos (domiciliario), soltar pedidos (domiciliario), salir a entregar ("En camino"), entregar pedidos con el PIN, calificar pedidos, empezar un pago en línea, crear el pago, saber si el pago fue aprobado, activar las notificaciones | `Failed to open stream` |
| el método `notificarPedidoEntregado()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::notificarPedidoEntregado()` |
| el método `enviarUno()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::enviarUno()` |
| el método `cabeceraVapid()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::cabeceraVapid()` |
| el método `cifrar()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::cifrar()` |
| los métodos de ayuda (`base64Url()`, `desdeBase64Url()`, `llavePublicaPem()`, `llavePrivadaPem()`, `firmaDerACruda()`) | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::...()` |
| la constante `TTL_SEGUNDOS` | entregar pedidos con el PIN | `Undefined constant PushNotificationService::TTL_SEGUNDOS` |
| el método `enviarATodosLosDispositivos()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::enviarATodosLosDispositivos()` |
| el método `registrarEnvio()` | entregar pedidos con el PIN | `Call to undefined method PushNotificationService::registrarEnvio()` |
| la constante `VAPID_PUBLIC_KEY` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_PUBLIC_KEY` |
| la constante `VAPID_PRIVATE_KEY` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_PRIVATE_KEY` |
| la constante `VAPID_SUBJECT` | lo que la usa dentro de la clase | `Undefined constant PushNotificationService::VAPID_SUBJECT` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
