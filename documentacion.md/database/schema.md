# database/schema.sql

## ¿Para qué sirve?
Crea **toda la base de datos** desde cero: la base `hamburguer_copiway`, sus 23 tablas, sus relaciones
y un "trigger" que genera el PIN de entrega.

⚠️ La primera línea útil es `DROP DATABASE IF EXISTS hamburguer_copiway;`: **borra** la base si ya
existe. Solo se debe ejecutar para instalar desde cero. Para agregar columnas nuevas a una base que
ya tiene datos se usan las **migraciones** de `database/migraciones/` (ver
[migraciones](migraciones/001_pedido_manual_puntos_ticket.md)).

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo ejecuta | `install.bat` | Paso [2/5]. |
| → después se carga | `database/seed.sql` | Datos de ejemplo (opcional). |
| → lo usan | todos los modelos de `app/Models/` | Cada modelo consulta estas tablas. |

## Conceptos de SQL que aparecen
| Concepto | Significado |
|---|---|
| `INT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Id numérico que MySQL asigna solo (1, 2, 3...). Es la llave de la tabla. |
| `VARCHAR(120)` | Texto de hasta 120 caracteres. |
| `DECIMAL(10,2)` | Número con 2 decimales (dinero). |
| `BOOLEAN` | Verdadero/falso (se guarda como 1/0). |
| `DATETIME` / `DATE` / `TIME` | Fecha y hora / solo fecha / solo hora. |
| `ENUM('a','b')` | Solo acepta esos valores. |
| `JSON` | Texto con formato JSON. |
| `NOT NULL` | Obligatorio. |
| `DEFAULT x` | Valor si no se envía. |
| `UNIQUE` | No se puede repetir. |
| `FOREIGN KEY (x) REFERENCES T(y)` | **Relación**: `x` debe existir en la tabla `T`. |
| `ON DELETE CASCADE` | Si se borra el "padre", se borran sus "hijos". |
| `ON DELETE SET NULL` | Si se borra el padre, el hijo queda con `NULL`. |
| `INDEX` | Hace más rápidas las búsquedas por esa columna. |

## Las tablas por grupos

### Paso 1: configuración
| Tabla | Qué guarda | Modelo PHP |
|---|---|---|
| `CONFIGURACION_SISTEMA` | Una sola fila: horario, tarifa, margen, pausa, programa de puntos (`valor_punto`, `minimo_puntos_canje`) y datos del negocio para el ticket (`negocio_nombre`, `negocio_nit`, `negocio_direccion`, `negocio_telefono`, `negocio_instagram`, `negocio_web`). | `Configuracion` |
| `CATEGORIA` | Categorías. `ambito`: `menu`, `insumo_alimenticio` o `empaque_desechable`. | `Configuracion`, `Producto`, `Ingrediente` |

### Paso 2: cuentas
| Tabla | Qué guarda | Modelo / archivo |
|---|---|---|
| `ADMINISTRADOR` | Admins y programadores. | `Usuario`, `Auth` |
| `AYUDANTE_COCINA` | Personal de cocina (con PIN). | `Personal`, `Auth` |
| `DOMICILIARIO` | Repartidores (vehículo, placa, base de efectivo, ubicación GPS). | `Personal`, `Auth` |
| `CLIENTE` | Clientes (con datos de Habeas Data, tema y carrito guardado). | `Cliente`, `Auth` |
| `CLIENTE_NOTIFICACION` | Avisos dentro de la app para el cliente. | `Cliente` |
| `PUSH_SUSCRIPCION` | Dispositivos para notificaciones push. | `PushSuscripcion` |
| `CODIGO_VERIFICACION` | Códigos para recuperar la contraseña. | `CodigoVerificacion` |
| `INTENTO_LOGIN` | Intentos de inicio de sesión (para bloquear ataques). | `IntentoLogin` |

### Paso 3: menú e inventario
| Tabla | Qué guarda | Modelo |
|---|---|---|
| `PRODUCTO` | Productos del menú. | `Producto` |
| `INGREDIENTE` | Insumos con stock y costos. | `Ingrediente` |
| `RECETA` | Qué insumos lleva cada producto y cuánto. Une PRODUCTO con INGREDIENTE. | `Producto` |

### Paso 4: caja
| Tabla | Qué guarda | Modelo |
|---|---|---|
| `REPORTE_CAJA` | Cada cierre de caja. `UNIQUE (id_admin, fecha)`: uno por admin por día. | `Caja`, `CajaService` |

### Paso 5: pedidos
| Tabla | Qué guarda | Modelo |
|---|---|---|
| `PEDIDO` | El pedido: cliente, domiciliario, estado, pago, PIN, totales. `id_cliente` puede quedar vacío (**cliente invitado** de un pedido manual); en ese caso se usan `nombre_contacto` y `telefono_contacto`. `id_admin_registro` dice qué admin registró un pedido manual y `canal_origen` por dónde llegó (`web`, `llamada`, `whatsapp`). `puntos_canjeados` y `descuento_puntos` guardan el canje de puntos. | `Pedido`, `PedidoService` |
| `PAGO_TRANSACCION` | Pagos de prueba de la pasarela. | `PagoService` |
| `DETALLE_PEDIDO` | Los productos del pedido. Guarda el nombre y el precio **del momento de la compra**. | `Pedido`, `PedidoService` |
| `PERSONALIZACION` | Extras agregados o ingredientes quitados de cada producto. | `Pedido`, `PedidoService` |
| `NOTIFICACION` | Registro de notificaciones enviadas por pedido. | `PushNotificationService` |
| `RESENA` | Calificación (1 a 5) de un pedido. | `PedidoService` |

### Paso 6: inventario y auditoría
| Tabla | Qué guarda | Modelo |
|---|---|---|
| `MOVIMIENTO_INVENTARIO` | Cada entrada o salida de stock (con el pedido o admin que la causó). | `Ingrediente` |
| `DETALLE_AUDITORIA` | Insumos consumidos en un cierre y su stock real. | `CajaService` |
| `LIQUIDACION_DOMICILIARIO` | Efectivo que entrega cada domiciliario en un cierre. | `CajaService` |

## Paso 7: el trigger del PIN
```sql
CREATE TRIGGER trg_pedido_pin
BEFORE INSERT ON PEDIDO
FOR EACH ROW
BEGIN
    IF NEW.pin_entrega = '' THEN
        SET NEW.pin_entrega = LPAD(FLOOR(RAND()*10000), 4, '0');
    END IF;
END$$
```
- Un **trigger** es código que MySQL ejecuta solo, en un momento dado: aquí, **antes de insertar** cada pedido.
- `RAND()*10000` = número al azar de 0 a 9999. `FLOOR` quita los decimales.
- `LPAD(..., 4, '0')` rellena con ceros a la izquierda: `42` → `0042`.
- Por eso PHP nunca genera el PIN: lo hace MySQL al crear el pedido.
- `DELIMITER $$` cambia temporalmente el fin de instrucción de `;` a `$$`, porque el trigger tiene `;` adentro.

## Última línea
```sql
INSERT INTO CONFIGURACION_SISTEMA (id_config) VALUES (DEFAULT);
```
Crea la única fila de configuración con los valores por defecto.
