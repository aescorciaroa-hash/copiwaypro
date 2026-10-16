# models/IntentoLogin.php

## ¿Para qué sirve?
Protege el login contra quien intenta adivinar contraseñas: registra cada intento y bloquea si hubo
**demasiados fallos seguidos** (tabla `INTENTO_LOGIN`).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `AuthController.php` (acción `login`) |
| → usa | Sus constantes `MAXIMO_INTENTOS` y `VENTANA_MINUTOS` |
| → tabla | `INTENTO_LOGIN` |

## Constantes de la clase
| Variable | Por defecto | Para qué |
|---|---|---|
| `MAXIMO_INTENTOS` | 5 | Cuántos fallos se permiten. |
| `VENTANA_MINUTOS` | 15 | En cuántos minutos se cuentan. |

## Métodos
| Método | Qué hace |
|---|---|
| `registrar($identificador, $ip, $exitoso)` | Guarda un intento: correo, IP y si funcionó (1) o no (0). |
| `contarFallosRecientes($identificador, $ip)` | Cuenta los fallos de ese correo **o** esa IP en los últimos minutos. |
| `excedeLimite($identificador, $ip)` | `true` si los fallos llegan al máximo. Entonces el login responde **429**. |

```sql
WHERE (identificador = ? OR ip = ?)
  AND exitoso = 0
  AND fecha_hora > (NOW() - INTERVAL ? MINUTE)
```
"Fallos de este correo o de esta IP, desde hace X minutos hasta ahora."
