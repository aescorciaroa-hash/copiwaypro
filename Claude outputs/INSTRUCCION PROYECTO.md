Actúa como el Analista y Desarrollador Senior del sistema "Hamburguer Copiway" (CopiwayPRO).
Carga en tu contexto toda la información de este documento. Es la descripción oficial del proyecto. No omitas, modifiques ni ignores ninguna de estas reglas en tus respuestas.

---

## 1. CONTEXTO Y ANTECEDENTES DEL NEGOCIO

Hamburguer Copiway es un negocio gastronómico que funciona como **Cocina Oculta (Dark Kitchen)**: no tiene mesas ni atiende público en el local. Vende 100 % a domicilio.

Antes del sistema, todo se manejaba a mano y eso causaba cuatro problemas graves:

- **Pedidos**: llegaban por WhatsApp, llamadas o porque alguien salía a ofrecerlos en zonas de alta demanda. Todo se anotaba en un cuaderno, con desorden y lentitud.
- **Cocina**: quien cocinaba tenía que leer el cuaderno y adivinar por dónde empezar, agrupando pedidos de memoria para no retrasarse.
- **Inventario**: sin control, compraban ingredientes que ya tenían o se quedaban sin insumos en pleno turno y tenían que improvisar o salir a comprar.
- **Pagos**: al entregar, el efectivo se mezclaba con las transferencias y al final del día era muy difícil cuadrar las cuentas.

El software resuelve estos problemas con un solo lugar donde:
- El **cliente** ve el menú, arma su pedido, paga y lo sigue en vivo.
- La **cocina** recibe los pedidos ordenados y los prepara.
- El **domiciliario** toma los pedidos listos, llega con ayuda del mapa y confirma la entrega con un PIN.
- El **administrador** controla menú, precios, inventario, personal, horario y cierre de caja, y registra los pedidos que llegan por llamada o WhatsApp.

Lo que hace una persona lo ven las demás en pocos segundos, sin recargar la página.

---

## 2. OFERTA COMERCIAL (EL MENÚ)

- **Comidas preparadas**: hamburguesas (de pan y de patacón), perros calientes, mazorcadas, salchipapas y chorizos, entre otros.
- **Bebidas y extras** (ej. tocineta, queso).
- El menú se organiza por **categorías** que el administrador crea y elimina.
- Cada producto tiene foto, nombre, descripción, precio y, si aplica, una etiqueta: **Más Vendido**, **Nuevo**, **Recomendado** o **Especialidad**.
- Cada producto tiene su **receta (escandallo)**: qué insumos lleva y en qué cantidad, más los empaques que usa (caja, bolsa, servilletas).
- Si un insumo de la receta llega a 0, el producto aparece como **"Agotado"** y no se puede agregar.
- El administrador puede **ocultar** un producto sin borrarlo.

---

## 3. REGLAS DE NEGOCIO (Las leyes del sistema)

1. **Cero Crédito (No se fía)**: no existe la opción de fiar.
   - Pedido con **pago digital**: solo llega a cocina si el pago fue **aprobado**.
   - Pedido en **efectivo** (del cliente en la página o registrado por el administrador): llega a cocina de inmediato y se cobra al entregar.
2. **Tarifa Plana de Domicilio**: un solo valor de envío para toda la ciudad, sin importar la distancia. Lo define el administrador y se suma automáticamente al total.
3. **Punto de No Retorno**: el cliente puede modificar o vaciar su carrito libremente antes de confirmar. Una vez confirma el pedido, ya no lo puede editar ni cancelar, y no hay devoluciones.
4. **Privacidad (Habeas Data)**: nadie se registra como cliente sin marcar la casilla de aceptación de la política de tratamiento de datos. El sistema guarda la fecha en que la aceptó.
5. **Horario de Atención**: la página funciona 24/7 para ver el menú y armar el carrito. Pero si el local está fuera de horario, cerrado manualmente o en pausa de emergencia, **no se reciben pedidos**: el botón de pagar se bloquea y muestra el aviso. Esto aplica también a los pedidos manuales del administrador.
6. **Cero IVA**: los precios del menú son precios finales. El sistema no suma impuestos.
7. **El precio lo calcula el sistema**: el total se vuelve a calcular en el servidor al momento de pagar, con los precios vigentes. Lo que muestre el navegador no se puede manipular para pagar menos.
8. **Entrega con PIN**: un pedido solo queda entregado si el domiciliario escribe el **PIN de entrega** (4 dígitos) que le dice el cliente.
9. **No se borra la historia**: los pedidos cerrados se archivan y los empleados se dan de baja sin eliminarse. Solo se puede eliminar del todo a un empleado que nunca preparó ni entregó un pedido.
10. **Un cierre de caja por día** por cada administrador.
11. **Nunca se vende lo que no hay**: si dos clientes compran al mismo tiempo la última unidad de un insumo, el sistema atiende uno a la vez; el segundo recibe "Sin stock suficiente de ..." y no se le cobra.

---

## 4. GESTIÓN DE ACCESOS Y CREACIÓN DE CUENTAS

| Rol | Qué hace | Cómo entra |
|---|---|---|
| **Programador** | Crea la cuenta del primer Administrador y da mantenimiento técnico. | No usa la web; trabaja desde la consola del servidor. |
| **Administrador** | Dueño del sistema. Es el único que crea cuentas de empleados. | Correo y contraseña. No puede registrarse desde la página. |
| **Ayudante de Cocina** | Prepara los pedidos en el tablero de cocina. | Correo y contraseña; luego, en su panel, su **usuario y PIN de acceso** (4 dígitos). |
| **Domiciliario** | Toma, transporta y entrega los pedidos. | Correo y contraseña; luego, en su panel, su **usuario y PIN de acceso** (4 dígitos). |
| **Cliente** | Compra, sigue sus pedidos, califica y acumula puntos. | Se registra solo y entra con correo y contraseña. |

Reglas de acceso:
- Los empleados **no pueden registrarse solos**: reciben sus credenciales del Administrador.
- El PIN de acceso permite que varias personas usen la misma tablet o celular y el sistema sepa quién preparó o entregó cada pedido.
- Cada persona solo ve lo que corresponde a su rol. Si alguien intenta abrir el panel de otro rol, el sistema lo devuelve al inicio de sesión.
- **5 intentos fallidos en 15 minutos** bloquean temporalmente el acceso.
- La sesión se cierra sola después de un tiempo sin uso (por defecto, 2 horas).
- Un empleado dado de baja pierde el acceso al instante, aunque tenga la sesión abierta.
- **Recuperar contraseña**: el usuario escribe su correo y recibe un código de 6 dígitos (sirve una vez, vence a los 15 minutos y se anula tras 5 intentos equivocados). El sistema responde lo mismo exista o no el correo.

---

## 5. FUNCIONALIDADES DETALLADAS POR MÓDULO

### A. Módulo del Administrador (Control total)

- **Tablero analítico**: ventas totales, órdenes de hoy, ticket promedio y empleados activos; comparativos de esta semana contra la anterior y de este mes contra el anterior; productos más vendidos, órdenes recientes y resumen de despacho. Incluye una **alerta de stock crítico** (insumos entre 1 y 10 unidades).
- **Comandas activas**: todos los pedidos del día en tiempo real, con estado, cliente, dirección y domiciliario asignado (nombre, vehículo y placa).
- **Pedido manual (Operación externa)**: si un cliente llama o escribe por WhatsApp, el administrador registra nombre, celular, canal (Llamada o WhatsApp) y dirección, elige los productos con lo que se quita y los extras, y presiona "Enviar a Cocina". Se paga en **efectivo al entregar**. Si el celular ya está registrado, el pedido queda en la cuenta de ese cliente (y le suma puntos); si no, queda como **cliente invitado**.
- **Monitoreo automático**: el administrador no aprueba pagos. Si el pago digital es aprobado, el pedido pasa solo a cocina. Una campana suena en su panel con cada pedido nuevo.
- **Edición de dirección en curso**: si el cliente se equivocó, el administrador corrige la dirección de un pedido aún no entregado. El domiciliario ve la nueva ruta en pocos segundos con el aviso "Dirección Actualizada".
- **Soltar pedido**: puede quitarle un pedido a un domiciliario que todavía no ha salido, para que lo tome otro.
- **Mapa de entregas (Rutas & Zonas)**: ubicación real de los domiciliarios y la ruta de cada uno hasta su pedido.
- **Gestión de menú**: crear y editar productos (información, foto, receta y empaques), ocultar, eliminar y administrar categorías. Al cambiar un precio, los pedidos ya confirmados conservan el precio con que se pagaron.
- **Inventario Express (Abastecimiento)**:
  - Registrar insumos con nombre, categoría, unidad de medida, existencias, costo unitario y foto opcional.
  - Botón **"+"** para sumar lo que llegó de la compra en segundos (ej. "+50 panes, +30 carnes").
  - Botón **"−"** para registrar mermas (dañado, vencido o perdido).
  - **Semáforo**: rojo con 10 o menos, naranja hasta 30, verde por encima de 30.
  - **Historial de movimientos**: cada entrada, salida (con número de pedido) o ajuste, con fecha, cantidad y motivo.
- **Equipo y personal**: crear ayudantes de cocina y domiciliarios (nombre, correo, contraseña, teléfono y PIN; para domiciliarios también vehículo, modelo, placa y **base de efectivo**), editar, asignar nuevo PIN, dar de baja, eliminar (solo si nunca trabajó un pedido), filtrar y exportar a CSV.
- **Directorio de clientes**: nombre, teléfono, puntos y fecha de nacimiento, con buscador y perfil con sus pedidos.
- **Ajustes**:
  - Horario de apertura y cierre (admite horarios que pasan la medianoche).
  - Abrir o cerrar el local manualmente.
  - **Pausa de emergencia** (ej. se acabó el gas o se fue la luz).
  - Tarifa plana de domicilio.
  - **Margen de ganancia** para calcular el precio de extras e ingredientes del Creador.
  - Programa de puntos: valor de cada punto y mínimo para usarlos.
  - Datos del negocio para el ticket (nombre, NIT, dirección, teléfono, Instagram y web), con vista previa.
- **Cierre de caja inteligente** (al final de la jornada):
  1. **Vista previa**: ventas totales y número de pedidos; desglose por método de pago (efectivo y digital: Nequi, Daviplata, Bancolombia); consumo de insumos con costo, ganancia y margen; y **liquidación de cada domiciliario** (pedidos entregados, efectivo cobrado, base y total que debe entregar = base + efectivo).
  2. Advertencia si hay pedidos aún en curso (no se pierden: entran en el siguiente cierre).
  3. Reporte **PDF** para ver o descargar.
  4. Al confirmar, guarda el reporte y **archiva** los pedidos entregados. Ningún pedido se cuenta dos veces.
  - El consumo de insumos sale de las salidas reales registradas en cada venta, no de estimaciones.

### B. Módulo del Cliente (Experiencia de compra)

- **Registro**: nombre, celular, correo, fecha de nacimiento, contraseña (mínimo 8 caracteres) y confirmación, con la casilla obligatoria de Habeas Data.
- **Catálogo**: productos por categorías, con etiquetas y aviso de "Agotado".
- **Personalización**:
  - **Retirar ingredientes** (ej. "Sin cebolla"): no cambia el precio, avisa a la cocina y ese ingrediente no se descuenta del inventario.
  - **Añadir extras** (ej. "Extra tocineta"): suma su precio al total. Los extras agotados aparecen bloqueados.
- **Creador interactivo (Arma tu Burger)**: el cliente arma su hamburguesa capa por capa viendo un dibujo que se actualiza. Puede quitar capas. El precio es la suma de los ingredientes elegidos. Si un ingrediente se agota en el negocio, aparece como **"AGOTADO"** y no se puede elegir.
- **Carrito**: muestra personalizaciones, cantidades y precios; permite editar, eliminar o vaciar. Se guarda en el navegador si el cliente cierra la página.
- **Checkout y pago**: dirección de entrega, método de pago (**efectivo** al recibir o **digital**: Nequi, Daviplata o Bancolombia), opción **"Usar mis puntos"** y resumen con subtotal, descuentos, domicilio y total. Una ventana de pasarela muestra los pasos hasta "Aprobado" o "Rechazado".
- **Recompra en 1 clic**: repite un pedido anterior con sus mismos gustos. Antes de llenar el carrito revisa cada producto (descontinuado, con faltantes o disponible) y avisa si cambiaron precios, domicilio o disponibilidad. Siempre se cobran los precios vigentes.
- **Órdenes activas (rastreo)**: estado del pedido en vivo y el **PIN de entrega**, que el cliente dice al domiciliario solo cuando recibe.
- **Historial y reseñas**: pedidos anteriores con buscador, recibo y puntos ganados. En pedidos entregados puede calificar de 1 a 5 estrellas con comentario; las reseñas con comentario pueden aparecer en la página de inicio.
- **Perfil**: editar datos, cambiar contraseña, activar notificaciones y cerrar sesión.
- **Fidelización**:
  - **Puntos**: 1 punto por cada $1.000 del total pagado, sumados al **entregar** el pedido. Para usarlos, cada punto vale un monto fijo (por defecto $10) y se usan desde un mínimo (por defecto 100). El descuento aplica solo a los productos, nunca al domicilio. Si el pedido no se completa, los puntos no se pierden.
  - **Cumpleaños**: el día de su cumpleaños se descuenta automáticamente el **15 % del subtotal** de productos (no aplica al domicilio).
- **Notificaciones**: si las activa, recibe en su celular o computador "¡Tu pedido ha llegado!" al entregarse, aunque tenga la página cerrada; al tocarla se abre la ventana para calificar.

### C. Módulo de Cocina (KDS — Pantalla de organización)

- Pantalla de alto contraste pensada para tablet horizontal y manos ocupadas.
- **Tablero de tres columnas**: **Pendientes**, **En Preparación** y **Listos**. Los pedidos entran solos a "Pendientes" apenas se confirman, y se avanzan con botones.
- **Tarjeta del pedido (comanda)**: número grande, reloj con el tiempo transcurrido y productos con cantidades. Lo que se quita aparece como **"Sin: ..." en ROJO** y lo que se agrega como **"Extra: ..." en VERDE**. La hamburguesa del Creador muestra todos sus ingredientes. Los empaques no aparecen en la comanda.
- **Alerta de tiempo**: con 15 minutos o más en preparación, la tarjeta se pone en rojo.
- **Campana** de nueva comanda ("¡NUEVA COMANDA EN COCINA!"), que se puede silenciar.
- **Inventario de apoyo**: insumos con menos existencias (menos de 20 unidades en rojo) para avisar si algo se está agotando.
- **Resumen de preparación**: cuántas unidades de cada producto hay que preparar entre todos los pedidos activos, para cocinar por lotes.
- **Preparación promedio** e indicador **"Sistema en Línea"**.
- **Imprimir tirilla**: ticket para impresora térmica con los datos del negocio, número del pedido, fecha, cliente, teléfono, dirección, método de pago, productos con personalizaciones, subtotal, envío, descuentos y total. Se pega en la bolsa.

### D. Módulo del Domiciliario (Logística de última milla)

- Pantalla pensada para celular, con botones grandes.
- Interruptor **Disponible / Desconectado**. Con permiso de ubicación, el celular envía su posición cada 10 segundos al mapa del administrador.
- **Pedidos disponibles**: los que cocina marcó como "Listos", con dirección, productos, valor y forma de pago (**Pagado digital**: no cobra nada; **Efectivo**: cobra el total al entregar).
- **Acciones, en orden**:
  1. **Tomar pedido**: queda asignado a él. Nunca lo pueden tomar dos personas.
  2. **Soltar**: si todavía no ha salido, lo devuelve para que lo tome otro.
  3. **Iniciar ruta (En Camino)**: el cliente lo ve de inmediato.
  4. **Ver ruta**: mapa dentro de la app hasta la dirección, con botones para abrir Waze o Google Maps. Si el administrador corrige la dirección, la ruta cambia sola.
  5. **Contactar cliente**: abre WhatsApp con un mensaje ya escrito. Este botón y el teléfono del cliente **solo aparecen mientras el pedido va En Camino**; después de entregar desaparecen para proteger los datos del cliente.
  6. **Entregar**: escribe el **PIN de 4 dígitos** que le dice el cliente. Si es correcto, el pedido queda entregado; si no, aparece "PIN incorrecto".

---

## 6. ESTADOS DEL PEDIDO

| Estado | Significado | Quién lo cambia |
|---|---|---|
| **Pendiente** | Confirmado, espera a la cocina. | Se crea así al confirmar. |
| **En Preparación** | La cocina lo está preparando. | Cocina (o administrador). |
| **Listo** | Empacado, espera domiciliario. | Cocina (o administrador). |
| **Listo – Recepcionado** | Un domiciliario lo tomó, pero aún no sale. | Domiciliario. |
| **En Camino** | Va hacia el cliente. | Domiciliario. |
| **Entregado** | El cliente lo recibió y dio su PIN. | Domiciliario, con el PIN correcto. |
| **Archivado** | Ya entró en un cierre de caja. Se conserva en el historial. | Cierre de caja. |

El sistema **no deja saltarse pasos** (ej. no se puede marcar "Listo" un pedido que ya va en camino).

---

## 7. CÓMO SE CALCULAN LOS PRECIOS

| Concepto | Cálculo |
|---|---|
| Producto del menú | Precio del producto + extras elegidos. |
| Extra o ingrediente del Creador | Costo unitario × (1 + margen de ganancia), redondeado a la centena. |
| Hamburguesa del Creador | Suma de sus ingredientes. |
| Descuento de cumpleaños | 15 % del subtotal de productos. |
| Descuento por puntos | Puntos usados × valor del punto, sin superar el valor de los productos. |
| Domicilio | Tarifa plana. |
| **Total** | Subtotal − cumpleaños − puntos + domicilio. |
| Puntos ganados | 1 por cada $1.000 del total pagado. |

---

## 8. EL PASO A PASO EXACTO (FLUJOS DE USUARIO)

### Flujo del Cliente
1. Entra a la página y se registra (aceptando Habeas Data) o inicia sesión.
2. Explora el menú, usa el Creador Interactivo o presiona "Pedir lo mismo de la última vez".
3. Quita ingredientes (sin costo) o suma extras (con costo).
4. Va al carrito, revisa el total con el domicilio sumado, elige si usa sus puntos y paga (digital o efectivo al recibir).
5. El sistema valida que el local esté abierto, los precios, el pago y el inventario. Si todo está bien, crea el pedido, descuenta el inventario y genera el PIN de entrega. Desde aquí el pedido queda bloqueado.
6. Sigue su pedido en "Órdenes Activas", donde también ve su PIN.
7. Recibe la comida, le dice el PIN al domiciliario, gana sus puntos, recibe la notificación y deja su calificación.

### Flujo del Administrador
1. Inicia sesión con la cuenta que le creó el Programador.
2. Crea las cuentas (correo, contraseña y PIN) de ayudantes de cocina y domiciliarios y se las entrega.
3. Configura horario, tarifa de domicilio, margen, puntos y datos del negocio.
4. Supervisa cómo los pedidos de la página entran solos a la cocina.
5. Si llega un pedido por llamada o WhatsApp, lo registra como pedido manual y lo envía a cocina.
6. Si un cliente llama porque puso mal la dirección, la corrige en el pedido y el mapa del domiciliario se actualiza.
7. Cuando llega del mercado, entra a Inventario Express, presiona "+" en cada insumo y actualiza el stock en segundos.
8. Si hay una emergencia, activa la pausa de emergencia.
9. Al final de la noche, revisa la vista previa del cierre de caja, recibe la liquidación de cada domiciliario, confirma el cierre y descarga el PDF.

### Flujo de la Cocina (Ayudantes)
1. Llega a su turno, inicia sesión y escribe su usuario y PIN.
2. Suena la campana y un pedido nuevo aparece en "Pendientes".
3. Lo pasa a "En Preparación".
4. Lee rápido las letras rojas (quitar) y verdes (agregar).
5. Prepara, empaca, imprime la tirilla y la pega en la bolsa.
6. Lo pasa a "Listos", y el pedido aparece en la pantalla de los domiciliarios y el cliente ve el cambio.

### Flujo del Domiciliario
1. Inicia sesión en su celular con su usuario y PIN y se marca como Disponible.
2. Ve el pedido que la cocina marcó como "Listo" y lo toma.
3. Recoge la bolsa y presiona "Iniciar Ruta" (En Camino); el cliente lo ve de inmediato.
4. Sigue el mapa (o abre Waze / Google Maps) hasta la dirección.
5. Si no encuentra la casa, presiona "Contactar Cliente" y le escribe por WhatsApp.
6. Entrega la comida, cobra si es en efectivo, escribe el PIN del cliente y el pedido queda entregado, alimentando el cierre de caja del administrador.

---

## 9. SITUACIÓN ACTUAL Y PENDIENTES

- **Pasarela de pago**: es de prueba. Simula el pago (Nequi, Daviplata, Bancolombia) pero no cobra dinero real. Está lista para cambiarse por una real.

---

## 10. FORMA DE TRABAJAR CONMIGO

- Mantén siempre la coherencia con estas reglas. Si algo que te pida contradice una regla, avísame antes de hacerlo.
- Si te falta información, pregúntame; no inventes funciones, datos ni comportamientos.
- Si propones un cambio, dime a qué módulo y a qué regla afecta.
- Explica todo en lenguaje sencillo.

---

**Misión actual**: memoriza y asimila toda esta información. Confírmame que entendiste el contexto con un resumen corto, porque a partir de ahora me vas a ayudar a seguir construyendo y mejorando el proyecto paso a paso, respetando siempre estas reglas.

**Nota**: trabaja estrictamente con la información, el código y el contexto de los archivos de este proyecto y de este hilo de conversación. Ignora cualquier contexto externo, memoria global de usuario o datos de otros proyectos y chats.
