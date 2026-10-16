# 5. Roles y usuarios

## Los 5 roles
| Rol | Nombre interno | Tabla en MySQL | Cómo entra | Panel |
|---|---|---|---|---|
| **Programador** | — (es un admin con `nivel_acceso = 'programador'`) | ADMINISTRADOR | **No entra por la web.** Solo usa la consola. | — |
| **Administrador** | `admin` | ADMINISTRADOR (`nivel_acceso = 'maestro'`) | Correo + contraseña | `/admin` |
| **Ayudante de cocina** | `kitchen` | AYUDANTE_COCINA | Correo + contraseña, y después **usuario + PIN** | `/kitchen` |
| **Domiciliario** | `delivery` | DOMICILIARIO | Correo + contraseña, y después **usuario + PIN** | `/delivery` |
| **Cliente** | `client` | CLIENTE | Correo + contraseña | `/client` |

## Quién crea a quién
```
Programador  ──(php bin/create-admin.php)──►  Administrador
Administrador ──(panel → Equipo y Personal)──►  Ayudante de cocina y Domiciliario
Cliente      ──(se registra solo en /register)
```
- El **administrador no se puede registrar** desde la web: la única forma es `bin/create-admin.php`.
- El **personal** lo crea el administrador, con contraseña y **PIN de 4 dígitos**.
- El **cliente** se registra solo y debe aceptar el tratamiento de datos (Habeas Data). El sistema guarda la fecha y su IP.

## Qué puede hacer cada uno
### Administrador (`/admin`)
| Pestaña | Puede |
|---|---|
| Tablero Analítico | Ver ventas, gráficas, productos más vendidos y el estado de la operación. |
| Comandas Activas | Ver todos los pedidos, el mapa, soltar un pedido de un domiciliario. |
| Rutas & Zonas | Ver la flota y los pedidos en reparto en el mapa. |
| Gestión de Menú | Crear, editar, ocultar y eliminar productos; recetas; categorías; fotos. |
| Inventario Express | Registrar insumos, sumar stock, ver el historial. |
| Equipo y Personal | Crear, editar y dar de baja a cocina y domiciliarios; asignar PIN; exportar a Excel. |
| Directorio Clientes | Ver los clientes, sus pedidos y puntos. |
| Ajustes y Caja | Horario, tarifa de domicilio, margen de ganancia, abrir/cerrar la tienda, pausa de emergencia y **cierre de caja**. |

### Ayudante de cocina (`/kitchen`)
- Ve los pedidos en 3 columnas: **Pendientes → En preparación → Listos**.
- Mueve cada pedido a la siguiente columna.
- Imprime la comanda.
- Ve el inventario crítico y un resumen de cuánto debe preparar de cada producto.
- Escucha una campana cuando llega un pedido nuevo.

### Domiciliario (`/delivery`)
- Ve los pedidos **listos** para repartir.
- **Toma** un pedido (queda asignado a él) o lo **suelta**.
- **Inicia la ruta** (el pedido pasa a "En Camino") y ve el camino en el mapa.
- Le escribe al cliente por WhatsApp (el teléfono del cliente solo aparece cuando va en camino).
- **Entrega** escribiendo el PIN que le dice el cliente.
- Puede ponerse **Disponible** o **Desconectado**.

### Cliente (`/client`)
- Ve el menú, personaliza productos, arma su hamburguesa en el **Creador Interactivo**.
- Paga en efectivo o digital.
- Sigue sus pedidos en vivo y ve el **PIN de entrega**.
- Califica los pedidos entregados y vuelve a pedir con un clic.
- Edita su perfil y su contraseña, y activa las notificaciones.

## El PIN: dos PIN distintos
| PIN | De quién | Para qué | Dónde se guarda |
|---|---|---|---|
| **PIN de acceso** (4 dígitos) | Cocina y domiciliario | Entrar a su panel en terminales compartidas | Columna `pin` (cifrada) de AYUDANTE_COCINA / DOMICILIARIO |
| **PIN de entrega** (4 dígitos) | Cada pedido | Que el domiciliario compruebe que entregó a la persona correcta | Columna `pin_entrega` de PEDIDO (lo genera MySQL al crear el pedido) |

El PIN de entrega solo lo ve el **cliente**. El domiciliario se lo pide en la puerta.

## Iniciar sesión con usuario en vez de correo
En los paneles de cocina y domiciliario se puede escribir solo lo que va antes del `@`
(ej: `santiago` en vez de `santiago@gmail.com`). Si dos cuentas activas tienen el mismo usuario con
distinto dominio, hay que escribir el correo completo.

## Cuentas inactivas
Al **dar de baja** a alguien no se borra: queda con `activo = 0` para conservar su historial. Una
cuenta inactiva no puede iniciar sesión, y si tenía la sesión abierta la pierde en la siguiente
petición (el sistema vuelve a revisar la cuenta en cada una).

## Bloqueo por intentos
Después de **5 intentos fallidos en 15 minutos** (por correo o por IP), el login responde
"Demasiados intentos fallidos" hasta que pase el tiempo. Se configura en el `.env`
(ver [Configuración](08-configuracion.md)).
