# app/Models/IntentoLogin.php

## ¿Para qué sirve?
Protege el login contra quien intenta adivinar contraseñas: registra cada intento y bloquea si hubo
**demasiados fallos seguidos** (tabla `INTENTO_LOGIN`).

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| ← lo usa | `AuthController.php` (acción `login`) |
| → usa | `env('RATE_LIMIT_LOGIN_MAX_ATTEMPTS')` y `env('RATE_LIMIT_LOGIN_WINDOW_MINUTES')` del `.env` |
| → tabla | `INTENTO_LOGIN` |

## Variables del `.env`
| Variable | Por defecto | Para qué |
|---|---|---|
| `RATE_LIMIT_LOGIN_MAX_ATTEMPTS` | 5 | Cuántos fallos se permiten. |
| `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | 15 | En cuántos minutos se cuentan. |

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
