<?php
/**
 * Envia notificaciones Web Push (VAPID) a los dispositivos del cliente,
 * para que salgan como notificacion del sistema aunque el navegador este cerrado.
 * Hecho con PHP puro (openssl + curl), sin librerias.
 */
require_once __DIR__ . '/PushSuscripcion.php';

class PushNotificationService
{
    // Llaves VAPID. Cada instalacion (cada dominio) deberia tener su propio par.
    const VAPID_PUBLIC_KEY = 'BPzLGFNPSprvi7FA4U_LsU0cIXXAOuNy1QC-6ay1KoW-Ua_Ad9oDDpsYNkKzVsm-ix-ALDVdgwPm8_QF5N1NsaE';
    const VAPID_PRIVATE_KEY = '36xY3qG43_1TDAFsBYBplslNz7zffuKmf7ZLPuLs2fI';
    const VAPID_SUBJECT = 'mailto:soporte@copiway.com';

    // Cuanto tiempo guarda el servicio push el aviso si el celular esta apagado (4 semanas)
    const TTL_SEGUNDOS = 2419200;

    private $conn;
    private $suscripcionModel;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
        $this->suscripcionModel = new PushSuscripcion();
    }

    /** Avisa al cliente que su pedido llego, con enlace para calificarlo. */
    public function notificarPedidoEntregado($idPedido, $idCliente)
    {
        $this->enviarATodosLosDispositivos($idCliente, $idPedido, [
            'title' => '¡Tu pedido ha llegado!',
            'body'  => 'Cuéntanos, ¿cómo estuvo tu comida?',
            'tag'   => 'pedido-entregado-' . $idPedido,
            'url'   => rutaBase() . '/?calificarPedido=' . $idPedido,
        ]);
    }

    private function enviarATodosLosDispositivos($idCliente, $idPedido, $payload)
    {
        if (self::VAPID_PUBLIC_KEY === '' || self::VAPID_PRIVATE_KEY === '') {
            return; // VAPID sin configurar.
        }

        $suscripciones = $this->suscripcionModel->listarPorCliente($idCliente);
        if (empty($suscripciones)) {
            return;
        }

        $mensaje = json_encode($payload);
        $huboEnvio = false;
        foreach ($suscripciones as $s) {
            try {
                $codigo = $this->enviarUno($s['endpoint'], $s['clave_p256dh'], $s['clave_auth'], $mensaje);
            } catch (Exception $e) {
                error_log('No se pudo enviar la notificacion push: ' . $e->getMessage());
                continue;
            }

            if ($codigo >= 200 && $codigo < 300) {
                $huboEnvio = true;
            } elseif ($codigo === 404 || $codigo === 410) {
                // El navegador invalido la suscripcion: se borra.
                $this->suscripcionModel->eliminarPorEndpoint($s['endpoint']);
            }
        }

        $this->registrarEnvio($idPedido, $huboEnvio);
    }

    /**
     * Cifra el mensaje para un dispositivo y lo manda a su servicio push
     * (el de Chrome, Firefox...). Devuelve el codigo HTTP que respondio.
     */
    private function enviarUno($endpoint, $claveP256dh, $claveAuth, $mensaje)
    {
        $cuerpo = $this->cifrar($mensaje, $claveP256dh, $claveAuth);

        $curl = curl_init($endpoint);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $cuerpo);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 10);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'TTL: ' . self::TTL_SEGUNDOS,
            'Authorization: ' . $this->cabeceraVapid($endpoint),
        ]);
        curl_exec($curl);
        $error = curl_error($curl);
        $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($codigo === 0) {
            throw new Exception('Sin respuesta del servicio push: ' . $error);
        }
        return $codigo;
    }

    /**
     * Cabecera "Authorization" VAPID: un token (JWT) firmado con la llave privada,
     * que prueba que el aviso viene de esta tienda.
     */
    private function cabeceraVapid($endpoint)
    {
        // "aud" = el servidor del servicio push (ej. https://fcm.googleapis.com)
        $partes = parse_url($endpoint);
        $audiencia = $partes['scheme'] . '://' . $partes['host'];

        $encabezado = self::base64Url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $datos = self::base64Url(json_encode([
            'aud' => $audiencia,
            'exp' => time() + 12 * 3600,
            'sub' => self::VAPID_SUBJECT,
        ], JSON_UNESCAPED_SLASHES));
        $textoAFirmar = $encabezado . '.' . $datos;

        $llavePrivada = self::llavePrivadaPem(
            self::desdeBase64Url(self::VAPID_PRIVATE_KEY),
            self::desdeBase64Url(self::VAPID_PUBLIC_KEY)
        );
        if (!openssl_sign($textoAFirmar, $firmaDer, $llavePrivada, OPENSSL_ALGO_SHA256)) {
            throw new Exception('No se pudo firmar el token VAPID.');
        }
        $firma = self::firmaDerACruda($firmaDer);

        return 'vapid t=' . $textoAFirmar . '.' . self::base64Url($firma) . ', k=' . self::VAPID_PUBLIC_KEY;
    }

    /**
     * Cifra el mensaje como pide el estandar Web Push (RFC 8291, "aes128gcm"):
     * solo el navegador del cliente lo puede leer.
     */
    private function cifrar($mensaje, $claveP256dh, $claveAuth)
    {
        $publicaCliente = self::desdeBase64Url($claveP256dh);  // 65 bytes
        $secretoAuth = self::desdeBase64Url($claveAuth);        // 16 bytes

        // 1. Un par de llaves nuevo solo para este mensaje: la privada son 32 bytes al azar y
        //    openssl calcula la publica. (No se usa openssl_pkey_new() porque en Windows
        //    falla si PHP no encuentra el archivo openssl.cnf.)
        $llaveTemporal = false;
        $intentos = 0;
        while ($llaveTemporal === false && $intentos < 3) {
            $llaveTemporal = openssl_pkey_get_private(self::llavePrivadaPem(random_bytes(32), ''));
            $intentos++;
        }
        if ($llaveTemporal === false) {
            throw new Exception('No se pudo crear la llave temporal.');
        }
        $detalles = openssl_pkey_get_details($llaveTemporal);
        $publicaServidor = "\x04"
            . str_pad($detalles['ec']['x'], 32, "\0", STR_PAD_LEFT)
            . str_pad($detalles['ec']['y'], 32, "\0", STR_PAD_LEFT);

        // 2. Secreto compartido entre nuestra llave temporal y la llave del cliente (ECDH)
        $secretoCompartido = openssl_pkey_derive(self::llavePublicaPem($publicaCliente), $llaveTemporal, 32);
        if ($secretoCompartido === false) {
            throw new Exception('Llave del dispositivo invalida.');
        }

        // 3. De ese secreto salen la llave y el "nonce" para cifrar (HKDF)
        $infoClave = "WebPush: info\0" . $publicaCliente . $publicaServidor;
        $clave = hash_hkdf('sha256', $secretoCompartido, 32, $infoClave, $secretoAuth);
        $sal = random_bytes(16);
        $llaveCifrado = hash_hkdf('sha256', $clave, 16, "Content-Encoding: aes128gcm\0", $sal);
        $nonce = hash_hkdf('sha256', $clave, 12, "Content-Encoding: nonce\0", $sal);

        // 4. Cifrar (AES-128-GCM). El "\x02" marca que es el ultimo (y unico) bloque.
        $cifrado = openssl_encrypt($mensaje . "\x02", 'aes-128-gcm', $llaveCifrado, OPENSSL_RAW_DATA, $nonce, $etiqueta);

        // 5. Cuerpo final: sal + tamano de bloque (4096) + nuestra llave publica + mensaje cifrado
        return $sal . pack('N', 4096) . chr(strlen($publicaServidor)) . $publicaServidor . $cifrado . $etiqueta;
    }

    /** Deja registro del envio en NOTIFICACION. */
    private function registrarEnvio($idPedido, $exito)
    {
        $estado = $exito ? 'enviado' : 'fallido';
        $stmt = $this->conn->prepare(
            "INSERT INTO NOTIFICACION (id_pedido, tipo, mensaje, estado_envio) VALUES (?, 'push', 'Tu pedido ha llegado', ?)"
        );
        $stmt->bind_param("is", $idPedido, $estado);
        $stmt->execute();
        $stmt->close();
    }

    // ---- Ayudas para las llaves (formatos que entiende openssl) ----

    /** base64 "para direcciones": sin =, con - y _ en vez de + y / */
    private static function base64Url($datos)
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    private static function desdeBase64Url($texto)
    {
        return base64_decode(strtr($texto, '-_', '+/'));
    }

    /** Convierte la llave publica cruda (65 bytes) en formato PEM. */
    private static function llavePublicaPem($publica)
    {
        // Prefijo fijo que dice "llave publica EC, curva P-256"
        $prefijo = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200');
        return "-----BEGIN PUBLIC KEY-----\n"
            . chunk_split(base64_encode($prefijo . $publica), 64, "\n")
            . "-----END PUBLIC KEY-----\n";
    }

    /**
     * Convierte la llave privada cruda (32 bytes) + la publica en formato PEM.
     * Si la publica va vacia ('') openssl la calcula sola al leer la llave.
     */
    private static function llavePrivadaPem($privada, $publica)
    {
        if ($publica === '') {
            $der = hex2bin('30310201010420') . $privada . hex2bin('a00a06082a8648ce3d030107');
        } else {
            $der = hex2bin('30770201010420') . $privada
                . hex2bin('a00a06082a8648ce3d030107a144034200') . $publica;
        }
        return "-----BEGIN EC PRIVATE KEY-----\n"
            . chunk_split(base64_encode($der), 64, "\n")
            . "-----END EC PRIVATE KEY-----\n";
    }

    /** openssl firma en formato DER; el JWT necesita los dos numeros (r y s) pegados, 32 bytes cada uno. */
    private static function firmaDerACruda($der)
    {
        $posicion = 3; // salta 30 (secuencia), largo, 02 (entero)
        $largoR = ord($der[$posicion]);
        $r = substr($der, $posicion + 1, $largoR);
        $posicion = $posicion + 1 + $largoR + 1; // salta r y el 02 de s
        $largoS = ord($der[$posicion]);
        $s = substr($der, $posicion + 1, $largoS);

        $r = str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);
        return $r . $s;
    }
}
?>
