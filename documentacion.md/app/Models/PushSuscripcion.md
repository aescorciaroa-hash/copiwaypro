# app/Models/PushSuscripcion.php

## ¿Para qué sirve?
Guarda los **dispositivos** de cada cliente donde se pueden enviar notificaciones push
(tabla `PUSH_SUSCRIPCION`). Un cliente puede tener varios (celular, computador...).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `PushController.php` | Guardar y borrar suscripciones. |
| ← lo usa | `PushNotificationService.php` | Saber a qué dispositivos enviar y borrar las vencidas. |
| → tabla | `PUSH_SUSCRIPCION` | |

## Columnas
| Columna | Qué guarda |
|---|---|
| `endpoint` | Dirección única del navegador (la entrega el navegador al suscribirse). |
| `clave_p256dh`, `clave_auth` | Claves para cifrar el mensaje para ese navegador. |

## Métodos
| Método | Qué hace |
|---|---|
| `guardar($idCliente, $endpoint, $claveP256dh, $claveAuth)` | Inserta. Si el `endpoint` ya existe, actualiza los datos (`ON DUPLICATE KEY UPDATE`). |
| `eliminarPorEndpoint($endpoint)` | Borra esa suscripción. |
| `listarPorCliente($idCliente)` | Todos los dispositivos del cliente. |

`ON DUPLICATE KEY UPDATE` = "si ya existe una fila con esa llave única, en vez de dar error, actualízala".
