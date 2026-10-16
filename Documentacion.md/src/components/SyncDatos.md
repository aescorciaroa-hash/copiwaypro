# src/components/SyncDatos.tsx

## ¿Para qué sirve?
Es un componente **invisible** (no dibuja nada, devuelve `null`) que mantiene los datos al día:
cada pocos segundos le pregunta a PHP "¿cambió algo?" y, si cambió, guarda los datos nuevos en el
almacén. Así, cuando cocina marca un pedido como listo, el cliente lo ve sin recargar.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo incluye | `src/main.tsx` | Está en **todas** las pantallas. |
| → llama a | `fetchSync()` de `servicios/api.ts` → `GET /api/sync` → `SyncController.php` | Pedir datos. |
| → guarda en | `store/almacenAplicacion.ts` (`setProducts`, `setOrders`...) | Las pantallas se actualizan solas. |
| ← lee | `window.__DATOS__` (de `cabecera.php`) | Token CSRF y ajustes iniciales. |
| → si no hay `__DATOS__` | `GET /api/auth/csrf` | Conseguir el token (solo en `npm run dev`). |

## Constantes (cada cuánto pregunta)
| Constante | Valor | Cuándo |
|---|---|---|
| `POLL_ACTIVE_MS` | 2,5 segundos | Pestaña visible y con cambios recientes. |
| `POLL_IDLE_MS` | 6 segundos | Después de 6 respuestas seguidas sin cambios. |
| `POLL_HIDDEN_MS` | 20 segundos | La pestaña está oculta (el usuario está en otra). |
| `IDLE_AFTER_UNCHANGED` | 6 | Cuántas respuestas sin cambios antes de ir más lento. |

## Variables
| Variable | Tipo | Para qué |
|---|---|---|
| `setProducts`, `setOrders`... | Funciones del almacén | Guardar cada tipo de dato. |
| `timerRef` | `useRef` | El temporizador actual (para poder cancelarlo). |
| `stoppedRef` | `useRef` | `true` cuando el componente se quita (para dejar de preguntar). |
| `unchangedRef` | `useRef` | Cuántas respuestas seguidas sin cambios. |

Se usa `useRef` y no `useState` porque estos valores **no** deben redibujar la pantalla.

## Paso a paso (dentro del `useEffect`)
1. **Token y ajustes iniciales:** si existe `window.__DATOS__`, toma de ahí el token CSRF y los ajustes.
2. **Función `poll()`:**
   - Llama a `fetchSync()`.
   - Si llegaron datos (`data` no es `null`), guarda cada parte que venga: `if (data.orders) setOrders(data.orders)`...
   - Si falla la red, no hace nada (lo intenta de nuevo en el siguiente ciclo).
   - En `finally`, programa la siguiente consulta con `setTimeout(poll, delay)` usando el tiempo que corresponda.
3. **Al volver a la pestaña** (`visibilitychange`): pregunta de inmediato, sin esperar.
4. **Limpieza** (`return () => ...`): al quitar el componente, detiene el temporizador y el evento.

`finally` = se ejecuta siempre, haya funcionado el `try` o no.
