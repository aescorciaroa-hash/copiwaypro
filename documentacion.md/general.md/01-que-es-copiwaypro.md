# 1. Qué es CopiwayPRO

## El negocio
**Hamburguer Copiway** es una **dark kitchen**: una cocina que solo vende a domicilio (no tiene mesas
para atender público). CopiwayPRO es el sistema que maneja todo el negocio:

- Los **clientes** ven el menú, arman su hamburguesa, pagan y siguen su pedido.
- La **cocina** recibe los pedidos y los prepara.
- Los **domiciliarios** los reparten y confirman la entrega con un PIN.
- El **administrador** controla el menú, el inventario, el personal, los ajustes y el cierre de caja.

## Qué puede hacer el sistema
| Área | Funciones |
|---|---|
| Menú | Productos por categoría, fotos, etiquetas ("Más vendido", "Nuevo"...), receta de cada producto. |
| Pedidos | Carrito, personalizar (quitar o agregar ingredientes), **creador interactivo** de hamburguesas, recompra en un clic, **pedido manual** del administrador (llamada o WhatsApp), incluso para personas sin cuenta. |
| Pagos | Efectivo o digital (Nequi, Daviplata, Bancolombia) con una **pasarela de prueba**. |
| Cocina | Tablero con 3 columnas (Pendientes → En preparación → Listos), campana de pedido nuevo, impresión de comanda. |
| Reparto | Tomar pedidos, mapa con la ruta, WhatsApp al cliente, entrega con **PIN de 4 dígitos**. |
| Inventario | Stock de insumos, descuento automático por cada venta, historial de movimientos. |
| Clientes | Registro con aceptación de tratamiento de datos (Habeas Data), puntos de fidelidad que se **canjean al pagar**, 15 % de descuento el día de su cumpleaños. |
| Administración | Tablero con gráficas, personal, clientes, horario, tarifa de domicilio, margen de ganancia, pausa de emergencia, programa de puntos y datos del negocio para el ticket. |
| Cierre de caja | Ventas del día (efectivo vs digital), cuánto entrega cada domiciliario, consumo de insumos, PDF del reporte. |
| Notificaciones | Aviso en el celular del cliente cuando su pedido llega. |

## Con qué está hecho
| Parte | Tecnología | Carpeta |
|---|---|---|
| Pantallas | React 19 + TypeScript + Tailwind CSS (compilado con Vite) | `src/` |
| Servidor | PHP 8 sin framework | `app/`, `config/`, `public/` |
| Base de datos | MySQL 8 | `database/` |
| Entorno local | Laragon (Apache + PHP + MySQL) | — |
| Librerías extra | PHPMailer (correo), web-push (notificaciones), Leaflet (mapas), Recharts (gráficas), jsPDF (PDF) | `vendor/`, `node_modules/` |

## Cómo se ve por dentro (en una frase)
**React** dibuja las pantallas y le pide los datos a **PHP**; PHP los busca en **MySQL** y responde en
formato **JSON**. Los detalles están en [Cómo funciona por dentro](04-como-funciona.md).
