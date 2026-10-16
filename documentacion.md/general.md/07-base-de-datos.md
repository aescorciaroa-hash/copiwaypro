# 7. Base de datos

- **Nombre:** `hamburguer_copiway`
- **Motor:** MySQL 8 (InnoDB), caracteres `utf8mb4` (tildes, ñ y emojis).
- **Estructura:** `database/schema.sql` (23 tablas). **Datos de ejemplo:** `database/seed.sql`.
- **Conexión:** `config/database.php`, con los datos del `.env` (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).

Detalle tabla por tabla en [documentacion.md/database/schema.md](../database/schema.md).

## Las tablas por grupos
```
CONFIGURACIÓN          CUENTAS                      MENÚ E INVENTARIO
CONFIGURACION_SISTEMA  ADMINISTRADOR                PRODUCTO ──┐
CATEGORIA              AYUDANTE_COCINA              RECETA ────┤ (qué insumos lleva cada producto)
                       DOMICILIARIO                 INGREDIENTE┘
                       CLIENTE                      MOVIMIENTO_INVENTARIO (entradas y salidas)
                       CLIENTE_NOTIFICACION
                       PUSH_SUSCRIPCION
                       CODIGO_VERIFICACION
                       INTENTO_LOGIN

PEDIDOS                                     CAJA
PEDIDO ──┬── DETALLE_PEDIDO ── PERSONALIZACION    REPORTE_CAJA ──┬── LIQUIDACION_DOMICILIARIO
         ├── RESENA                                              └── DETALLE_AUDITORIA
         └── NOTIFICACION
PAGO_TRANSACCION
```

## Relaciones más importantes
| Relación | Significa |
|---|---|
| PEDIDO → CLIENTE | De qué cliente es el pedido. Puede estar vacío en un pedido manual de un **cliente invitado** (sin cuenta); entonces se guardan su nombre y celular en `nombre_contacto` y `telefono_contacto`. |
| PEDIDO → ADMINISTRADOR | En un pedido manual, qué administrador lo registró (`id_admin_registro`). |
| PEDIDO → DOMICILIARIO / AYUDANTE_COCINA | Quién lo repartió / quién lo preparó (pueden estar vacíos). |
| PEDIDO → REPORTE_CAJA | En qué cierre quedó archivado (vacío hasta el cierre). |
| DETALLE_PEDIDO → PEDIDO, PRODUCTO | Los productos de cada pedido. Guarda el nombre y el precio **del momento de la compra**, así un cambio de precio no altera pedidos viejos. |
| PERSONALIZACION → DETALLE_PEDIDO, INGREDIENTE | "Agregar queso", "quitar cebolla". |
| RECETA → PRODUCTO, INGREDIENTE | Cuánto de cada insumo gasta un producto. |
| PRODUCTO / INGREDIENTE → CATEGORIA | `ambito`: `menu`, `insumo_alimenticio` o `empaque_desechable`. |

## Reglas que cumple la base de datos
- **Ids numéricos automáticos** (`AUTO_INCREMENT`): 1, 2, 3... El número del pedido que se ve (`#ORD-12`) es su id.
- **Nada importante se borra:** personal, insumos y pedidos se "dan de baja" o se archivan (`activo = 0`, `id_reporte`). La única excepción es el personal **sin historial** (nunca preparó ni repartió un pedido), que el administrador sí puede eliminar.
- **Contraseñas, PIN de acceso y códigos de recuperación** se guardan **cifrados** (hash).
- **Trigger `trg_pedido_pin`:** genera solo el PIN de entrega de 4 dígitos de cada pedido.
- **Un cierre por día por admin:** `UNIQUE (id_admin, fecha)` en REPORTE_CAJA.

## Ver la base de datos
- **Desde Laragon:** botón **Base de datos** (abre HeidiSQL), o Menú → MySQL.
- **Desde la terminal:**
  ```powershell
  "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root hamburguer_copiway
  ```
  Ejemplos: `SHOW TABLES;` · `SELECT * FROM PEDIDO ORDER BY id_pedido DESC LIMIT 5;`

## Respaldar y restaurar
**Hacer un respaldo** (copia completa en un archivo):
```powershell
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe" -u root --routines --triggers hamburguer_copiway > respaldo.sql
```
`--triggers` es importante para no perder el trigger del PIN.

**Restaurar un respaldo:**
```powershell
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS hamburguer_copiway CHARACTER SET utf8mb4"
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 hamburguer_copiway < respaldo.sql
```

## Empezar de cero
⚠️ **Borra todos los datos.** Haz un respaldo antes.
```powershell
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root --default-character-set=utf8mb4 < database\schema.sql
```
`schema.sql` empieza con `DROP DATABASE IF EXISTS hamburguer_copiway;`.

## Agregar una columna o tabla
1. Escribe el cambio (`ALTER TABLE ...`) en un archivo nuevo de `database/migraciones/` (ej.
   `002_...sql`) y ejecútalo en tu base. Así quien ya tenía el sistema instalado puede actualizarse
   sin perder datos.
2. Agrégalo también a `database/schema.sql`, para que una instalación nueva lo tenga.
3. Usa la columna en el modelo correspondiente de `app/Models/` y, si React la necesita, en la función de `app/Views/json/`.

Más en [Cómo hacer cambios](12-como-hacer-cambios.md).
