# MANUAL DE USUARIO Y LÓGICA DE NEGOCIO — HAMBURGUER COPIWAY
## Sistema Integrado de Automatización para Dark Kitchen (CopiwayPRO)

Este documento explica qué hace el sistema **Hamburguer Copiway**, cómo lo usa cada persona, qué reglas sigue y qué pasa detrás de cada botón. Está escrito en lenguaje sencillo: no hace falta saber programar para entenderlo.

---

## 0. CÓMO USAR ESTE MANUAL

| Si eres... | Lee primero |
|---|---|
| Dueño o administrador del negocio | Secciones 1, 3, 4, 8, 9 y 10 |
| Cliente o encargado de atención al cliente | Secciones 4 y 5 |
| Ayudante de cocina | Secciones 4 y 6 |
| Domiciliario | Secciones 4 y 7 |
| Diseñador de pantallas (mockups) | Sección 17 |
| Persona que prueba el sistema | Secciones 15, 16 y 18 |

Al final hay un **glosario** (sección 19) con las palabras propias del sistema.

---

## 1. VISIÓN GENERAL

Hamburguer Copiway es una **Dark Kitchen** (cocina oculta): una cocina que **solo vende a domicilio** y no atiende público en mesas. El sistema reemplaza los cuadernos, las llamadas y los mensajes sueltos por un solo lugar donde:

*   El **cliente** ve el menú, arma su hamburguesa, paga y sigue su pedido en vivo.
*   La **cocina** recibe los pedidos ordenados y los prepara.
*   El **domiciliario** toma los pedidos listos, llega con ayuda del mapa y confirma la entrega con un PIN.
*   El **administrador** controla el menú, los precios, el inventario, el personal, el horario y el cierre de caja, y registra los pedidos que llegan por llamada o WhatsApp.

Todo lo que hace una persona lo ven las demás en pocos segundos, sin recargar la página.

---

## 2. ROLES Y ACCESOS

Cada persona entra con su propio usuario y solo ve lo que le corresponde a su rol.

| Rol | Qué hace | Cómo entra |
|---|---|---|
| **Administrador** | Controla todo el negocio: menú, precios, inventario, personal, clientes, horario y cierre de caja. | Correo y contraseña. |
| **Ayudante de Cocina** | Prepara los pedidos en el tablero de cocina. | Correo y contraseña; luego, en el panel de cocina, su **usuario y PIN de acceso**. |
| **Domiciliario** | Toma, transporta y entrega los pedidos. | Correo y contraseña; luego, en su panel, su **usuario y PIN de acceso**. |
| **Cliente** | Compra, sigue sus pedidos, califica y acumula puntos. | Correo y contraseña. |
| **Programador** | Crea la cuenta del primer administrador y da mantenimiento técnico. | No usa la web: trabaja desde la consola del servidor. |

**Quién crea a quién:**
1. El **Programador** crea la cuenta del Administrador.
2. El **Administrador** crea las cuentas de Cocina y Domiciliarios (con su contraseña y su PIN de 4 dígitos).
3. El **Cliente** se registra solo, aceptando la política de tratamiento de datos (Habeas Data).

**Detalles útiles:**
*   En los paneles de cocina y domiciliario basta con escribir el usuario (lo que va antes del "@" del correo). Si dos cuentas activas comparten ese usuario con distinto correo, hay que escribir el correo completo.
*   El administrador **no puede registrarse** desde la página web; solo el Programador puede crearlo.
*   Si una persona intenta abrir el panel de otro rol (por ejemplo, un ayudante de cocina que escribe la dirección del panel de administración), el sistema no le muestra nada y lo envía al inicio de sesión.

---

## 3. REGLAS DE NEGOCIO INQUEBRANTABLES

1.  **Cero Crédito**: un pedido con pago digital solo llega a cocina si el pago fue **aprobado**. Un pedido en efectivo (incluidos los que registra el administrador por llamada o WhatsApp) llega a cocina de inmediato y se cobra al entregarlo.
2.  **Tarifa Plana de Domicilio**: todos los pedidos pagan el mismo valor de envío, sin importar la distancia. Lo define el administrador.
3.  **Punto de No Retorno**: una vez confirmado el pedido, el cliente ya no puede editarlo ni cancelarlo.
4.  **Habeas Data**: nadie puede registrarse como cliente sin aceptar la política de tratamiento de datos. El sistema guarda la fecha de aceptación.
5.  **Horario de Atención**: fuera del horario, con el local cerrado manualmente o con la pausa de emergencia activa, **no se reciben pedidos**.
6.  **Cero IVA**: los precios del menú son precios finales; el sistema no suma impuestos.
7.  **El precio lo calcula el sistema**: el total de cada pedido se calcula de nuevo en el servidor al momento de pagar, con los precios vigentes. Lo que muestre el navegador del cliente no se puede manipular para pagar menos.
8.  **Entrega con PIN**: un pedido solo se marca como entregado si el domiciliario escribe el **PIN de entrega** que le dice el cliente.
9.  **No se borra la historia**: los pedidos cerrados se archivan y los empleados que ya trabajaron se dan de baja, sin eliminarse, para conservar el historial. Solo se puede eliminar del todo a un empleado que nunca preparó ni entregó un pedido.
10. **Un cierre de caja por día** por cada administrador.

---

## 4. CICLO DE VIDA DE UN PEDIDO

### 4.1 Los estados
| Estado | Qué significa | Quién lo cambia |
|---|---|---|
| **Pendiente** | El pedido fue confirmado y espera a la cocina. | Se crea así cuando el cliente confirma. |
| **En Preparación** | La cocina lo está preparando. | Ayudante de cocina (o administrador). |
| **Listo** | Está empacado y espera domiciliario. | Ayudante de cocina (o administrador). |
| **Listo – Recepcionado** | Un domiciliario lo tomó, pero aún no ha salido. | Domiciliario. |
| **En Camino** | El domiciliario salió hacia la dirección del cliente. | Domiciliario. |
| **Entregado** | El cliente lo recibió y dio su PIN. | Domiciliario, con el PIN correcto. |
| **Archivado** | Ya se incluyó en un cierre de caja. Desaparece de las vistas del día, pero se conserva. | Cierre de caja. |

El sistema **no deja saltarse pasos**: por ejemplo, no se puede marcar como "Listo" un pedido que ya va en camino.

### 4.2 El recorrido completo, paso a paso
1.  **El cliente arma su pedido**: elige productos, los personaliza o crea su hamburguesa en el Creador Interactivo.
2.  **El cliente confirma y paga**: escribe su dirección, elige efectivo o pago digital y, si quiere, usa sus puntos.
3.  **El sistema valida todo a la vez**: que el local esté abierto, los precios vigentes, el pago (si es digital) y que haya inventario suficiente. Si algo falla, **no se guarda nada** y el cliente ve el motivo.
4.  **Se descuenta el inventario**: la receta de cada producto, menos lo que el cliente quitó, más los extras y los empaques.
5.  **Se genera el PIN de entrega** (4 dígitos), que solo ve el cliente.
6.  **Suena la campana** en el panel de cocina y en el del administrador. El pedido aparece en "Pendientes".
7.  **Cocina lo prepara**: lo pasa a "En Preparación" y después a "Listos". El cliente ve cada cambio.
8.  **Un domiciliario lo toma**, lo recoge e inicia la ruta: el pedido pasa a "En Camino".
9.  **En la puerta**, el cliente le dice el PIN y el domiciliario lo escribe. El pedido queda "Entregado".
10. **Al entregar**: el pago queda aprobado (si era en efectivo, ya se cobró), se suman los puntos al cliente y le llega una notificación para calificar.
11. **Al final del día**, el administrador hace el cierre de caja y los pedidos entregados se archivan.

### 4.3 Pedidos que llegan por llamada o WhatsApp
El administrador los registra en **Comandas Activas → Ingreso de Orden Manual**. Desde ahí siguen
exactamente el mismo recorrido (pasos 3 a 11), con dos diferencias:
*   Se pagan **en efectivo** al entregar.
*   Si el celular que da la persona ya está registrado como cliente, el pedido queda **en su cuenta**
    (y le suma puntos). Si no, queda como **cliente invitado**: solo con su nombre, celular y dirección.

---

## 5. MÓDULO DEL CLIENTE (Experiencia de Compra)

### 5.1 Registro e inicio de sesión
*   **Registro**: nombre completo, celular, correo, fecha de nacimiento, contraseña (mínimo 8 caracteres) y su confirmación. La casilla de **Habeas Data** es obligatoria: sin marcarla no se crea la cuenta.
*   **Inicio de sesión**: correo y contraseña. Después de **5 intentos fallidos en 1 minuto** con el mismo correo, ese correo se bloquea por 1 minuto. Los demás perfiles pueden seguir entrando.
*   **¿Olvidaste tu contraseña?**: el cliente escribe su correo y recibe un **código de 6 dígitos**. El código sirve una sola vez, vence a los 15 minutos y se anula después de 5 intentos equivocados. Si el correo no está registrado, aparece el mensaje "El correo es incorrecto o no existe."

### 5.2 Catálogo
*   Productos organizados por **categorías** (Hamburguesas, Perros, Bebidas, Extras, etc.).
*   Cada producto muestra foto, nombre, descripción, precio y, si aplica, una etiqueta: **Más Vendido**, **Nuevo**, **Recomendado** o **Especialidad**.
*   Si un ingrediente de la receta llega a 0 en el inventario, el producto aparece como **"Agotado"** y no se puede agregar.
*   Los productos que el administrador ocultó no aparecen.

### 5.3 Personalizar un producto
Al abrir un producto, el cliente puede:
*   **Retirar ingredientes** (ej. "Sin cebolla"): no cambia el precio y ese ingrediente no se descuenta del inventario.
*   **Añadir extras** (ej. "Extra queso"): suma el precio del extra. Si el extra está agotado, aparece bloqueado.
El precio se recalcula mientras el cliente elige.

### 5.4 Creador Interactivo ("Arma tu Burger")
*   El cliente arma una hamburguesa **capa por capa**, viendo un dibujo que se actualiza con cada ingrediente.
*   Puede eliminar cualquier capa.
*   El precio es la **suma de los ingredientes elegidos** (cada ingrediente cuesta su costo más el margen de ganancia; ver sección 11).
*   Los ingredientes sin existencias aparecen como **"AGOTADO"** y no se pueden agregar.

### 5.5 Carrito
*   Muestra cada producto con sus personalizaciones ("Sin cebolla", "Extra queso"), cantidad y precio.
*   Permite editar un producto, eliminarlo o vaciar todo el carrito.
*   El carrito se guarda en el navegador: si el cliente cierra la página, lo encuentra igual al volver.
*   **Resumen de pago**: subtotal, descuento de cumpleaños (si aplica), domicilio y total.

### 5.6 Checkout y pago
1.  **Dirección de entrega** (ej. "Calle 10 # 5-20, Centro").
2.  **Método de pago**:
    *   **Efectivo**: se paga al domiciliario al recibir.
    *   **Digital**: Nequi, Daviplata o Bancolombia. Para Nequi y Daviplata se pide el número de celular.
3.  **Usar mis puntos** (opcional): una casilla muestra cuántos puntos tiene el cliente. Al marcarla, el cliente elige **cuántos puntos** usar y el descuento aparece en el resumen antes de pagar (ver 5.11).
4.  **Pasarela de pago**: una ventana muestra los pasos "Conectando", "Esperando aprobación", "Verificando" y "Aprobado" (o "Rechazado").
5.  Si el pago es aprobado, aparece el aviso **"¡Pedido confirmado! Tu orden ha sido enviada a cocina"**.

Si el local está cerrado, el botón de pago muestra el aviso de **horario de atención** y no deja continuar.

> **Importante:** la pasarela actual es **de prueba**: simula un pago real pero **no cobra dinero**. Está lista para reemplazarse por una pasarela real sin cambiar el resto del sistema.

### 5.7 Órdenes Activas (rastreo)
*   Muestra los pedidos en curso con su estado actual: Pendiente → En Preparación → Listo → En Camino → Entregado.
*   Muestra el **PIN de entrega** de cada pedido. El cliente debe decírselo al domiciliario **solo cuando reciba el pedido**.
*   El estado se actualiza solo, sin recargar la página.

### 5.8 Historial y calificaciones
*   Lista de todos los pedidos anteriores, con buscador por número de orden o por plato.
*   Cada pedido muestra su recibo (con los descuentos de cumpleaños y de puntos, si los hubo) y los **puntos ganados**.
*   **Calificar**: en los pedidos entregados, el cliente da de 1 a 5 estrellas y deja un comentario. Las reseñas con comentario pueden aparecer en la página de inicio.

### 5.9 Recompra en 1 Clic
Repite un pedido anterior con un solo botón. Antes de llenar el carrito, el sistema revisa cada producto:
*   **Descontinuado**: ya no está en el menú y no se agrega.
*   **Con faltantes**: algún ingrediente está agotado; se avisa cuál.
*   **Disponible**: se agrega igual que la vez anterior.

Si los precios, el domicilio o la disponibilidad cambiaron desde la última vez, el sistema lo avisa para que el cliente revise antes de pagar. Siempre se cobran los **precios vigentes**.

### 5.10 Perfil
*   Editar datos personales (nombre, correo, celular, dirección y fecha de nacimiento).
*   Cambiar la contraseña (pide la actual y la nueva, mínimo 8 caracteres). **Si la contraseña actual no es correcta, no se cambia**: la caja se pone en rojo con el aviso "La contraseña actual no es correcta.".
*   **¿No recuerdas tu contraseña actual?** Dentro de la misma ventana está la opción **Recibir un código en mi correo**: llega un código de 6 dígitos (vence en 15 minutos). Se escribe el código en lugar de la contraseña actual, junto con la nueva.
*   Activar las **notificaciones** en el celular o computador.
*   Cerrar sesión.

### 5.11 Beneficios: puntos y cumpleaños
*   **Ganar puntos**: 1 punto por cada $1.000 del total pagado. Se suman cuando el pedido se **entrega**.
*   **Usar puntos**: al pagar, el cliente marca **"Usar mis puntos"**. Cada punto descuenta un valor fijo que define el administrador (por defecto **$10**, es decir, el 1 % de lo comprado), y se pueden usar desde un mínimo de puntos (por defecto **100**).
    *   El descuento aplica **solo a los productos**, nunca al domicilio.
    *   Al marcar la casilla aparece **"¿Cuántos puntos quieres usar?"**: el cliente escribe cuántos quiere gastar (empieza con el máximo) o toca **"Usar todos"**. No puede usar más de los que tiene ni más de lo que cuestan los productos.
    *   Los puntos que no use quedan guardados para la próxima compra.
    *   Si el pedido no se completa (por ejemplo, el pago es rechazado o falta un ingrediente), los puntos **no se pierden**.
*   **Cumpleaños**: el día del cumpleaños del cliente se descuenta automáticamente el **15 % del subtotal** de los productos. El descuento **no aplica** al domicilio.

### 5.12 Notificaciones
Si el cliente las activa, cuando su pedido se entrega recibe el aviso **"¡Tu pedido ha llegado!"** aunque tenga la página cerrada. Al tocarlo, se abre directamente la ventana para calificar.

---

## 6. MÓDULO DE COCINA (KDS — Pantalla de Cocina)

Pantalla de alto contraste pensada para usarse rápido, con las manos ocupadas y desde una tablet o pantalla horizontal.

### 6.1 Entrada
Después del inicio de sesión, el panel pide el **usuario y el PIN de acceso** del ayudante. Así, varias personas pueden usar la misma tablet y el sistema sabe quién preparó cada pedido.

### 6.2 Tablero de tres columnas
| Columna | Qué contiene | Botón |
|---|---|---|
| **Pendientes** | Pedidos recién confirmados. | Pasar a preparación. |
| **En Preparación** | Pedidos que se están cocinando. | Marcar como listo para despacho. |
| **Listos** | Pedidos empacados que esperan domiciliario. | — |

### 6.3 La tarjeta del pedido (comanda)
*   Número del pedido grande y un **reloj** con el tiempo transcurrido.
*   Lista de productos con cantidades.
*   **"Sin: ..."** en **rojo** para lo que el cliente quitó, y **"Extra: ..."** en **verde** para lo que agregó.
*   En la hamburguesa del Creador Interactivo se muestra la lista completa de ingredientes elegidos.
*   **Alerta de tiempo**: si un pedido lleva **15 minutos o más** en preparación, la tarjeta se marca en **rojo** para darle prioridad.

### 6.4 Herramientas laterales
*   **Campana de nuevo pedido**: suena y aparece el aviso **"¡NUEVA COMANDA EN COCINA!"**. Se puede **silenciar** o reactivar con el botón de sonido.
*   **Preparación promedio**: cuánto tarda la cocina, en promedio, en tener listo un pedido.
*   **Inventario crítico**: los insumos con menos existencias; los que tienen menos de 20 unidades aparecen en rojo.
*   **Resumen de preparación**: cuántas unidades de cada producto hay que preparar en total entre todos los pedidos activos (ej. "6 Hamburguesas Clásicas"). Ayuda a cocinar por lotes.
*   **Indicador "Sistema en Línea"**: confirma que la pantalla está recibiendo pedidos.

### 6.5 Imprimir tirilla
El botón de impresora abre la **vista previa del ticket** para impresora térmica. Incluye los **datos del negocio** (nombre, NIT, dirección, teléfono, Instagram y página web, que el administrador edita en Ajustes), número del pedido, fecha, cliente, teléfono, dirección, método de pago, productos con sus personalizaciones, subtotal, tarifa de envío, descuentos (cumpleaños y puntos, si los hay) y total a pagar. Se pega en la bolsa para identificar el pedido.

---

## 7. MÓDULO DEL DOMICILIARIO (Última Milla)

Pantalla pensada para el celular, con botones grandes.

### 7.1 Entrada y disponibilidad
*   Después del inicio de sesión, el panel pide el **usuario y el PIN de acceso**.
*   Un interruptor permite marcarse como **Disponible** o **Desconectado**.
*   Con el permiso de ubicación activado, el celular envía su posición cada 10 segundos para que el administrador vea la flota en su mapa. Si no da el permiso, su propio mapa simula el recorrido, pero esa posición no se envía.

### 7.2 Pedidos Disponibles
Lista de los pedidos "Listos" con su dirección, productos, valor y forma de pago:
*   **Pagado (Digital)**: no hay que cobrar nada.
*   **Efectivo**: hay que cobrar el total al entregar.

### 7.3 Acciones, en orden
1.  **Tomar Pedido**: el pedido queda asignado a él. Si otro domiciliario lo tomó un segundo antes, recibe el aviso "Este pedido ya no está disponible para reparto" (nunca lo pueden tomar dos personas).
2.  **Soltar**: si todavía no ha salido, puede devolver el pedido para que lo tome otro.
3.  **Iniciar Ruta (En Camino)**: el pedido pasa a "En Camino" y el cliente lo ve de inmediato.
4.  **Ver ruta**: el mapa muestra el recorrido hasta el destino. Los botones **Waze** y **Maps** abren la navegación en esas aplicaciones. Si el administrador corrige la dirección del pedido, la ruta cambia sola y aparece el aviso **"Dirección Actualizada"** con la dirección nueva.
5.  **Contactar Cliente**: abre WhatsApp con un mensaje ya escrito ("Te escribo de Copiway PRO, soy tu domiciliario y ya voy en camino con tu pedido..."). El domiciliario solo tiene que enviarlo. Este botón y el teléfono del cliente **solo aparecen mientras el pedido está En Camino**.
6.  **Entregar**: se abre la ventana **"Validar Entrega"**, donde escribe el **PIN de 4 dígitos** que le dice el cliente. Si es correcto, el pedido queda entregado; si no, aparece "PIN incorrecto".

---

## 8. MÓDULO DEL ADMINISTRADOR (Control Maestro)

El panel tiene un menú lateral con ocho secciones, además de una campana de **notificaciones** y un aviso de **stock crítico**.

### 8.1 Tablero Analítico
*   **Indicadores**: Ventas Totales, Órdenes Hoy, Ticket Promedio (valor promedio por pedido) y Empleados Activos.
*   **Comparativos**: esta semana frente a la semana pasada, y este mes frente al mes anterior.
*   **Productos más vendidos**, **Órdenes recientes** y un resumen de **Despacho y Logística**.
*   **Alerta Preventiva de Stock Crítico**: lista los insumos que tienen entre 1 y 10 unidades, antes de que se agoten.

### 8.2 Comandas Activas
*   **Órdenes en tiempo real**: todos los pedidos del día con su estado, cliente, dirección y domiciliario.
*   **Ver detalles**: productos, pago, datos del cliente y del domiciliario asignado (nombre, vehículo y placa).
*   **Mapa de entregas**: ubicación real de los domiciliarios y la ruta de cada uno hasta su pedido en curso.
*   **Editar dirección**: corrige la dirección de un pedido que todavía no se entrega. El cambio se guarda y le llega al domiciliario en pocos segundos, con un aviso en su pantalla.
*   **Ingreso de Orden Manual** (pedidos por llamada o WhatsApp):
    1.  Datos del cliente: nombre, celular, por dónde llegó (**Llamada** o **WhatsApp**) y dirección. Los cuatro son obligatorios.
    2.  Productos: se eligen del menú, con lo que se quita y los extras.
    3.  **Enviar a Cocina**: el sistema calcula los precios, descuenta el inventario y busca al cliente por su celular. El aviso confirma el número del pedido y si quedó en la cuenta de un cliente registrado o como invitado.

    Se cobra en efectivo al entregar. Fuera del horario de atención tampoco se pueden registrar pedidos manuales.

### 8.3 Rutas & Zonas
Mapa con la flota de domiciliarios y los pedidos en reparto, para ver de un vistazo cómo va la logística.

### 8.4 Gestión de Menú
*   **Crear o editar un producto**, en cuatro partes:
    1.  **Información comercial**: nombre, descripción, precio, categoría y etiqueta (Más Vendido, Nuevo, Recomendado, Especialidad).
    2.  **Imagen del producto**: fotos JPG, PNG, WEBP o GIF de hasta 5 MB.
    3.  **Receta e insumos (Escandallo)**: qué insumos lleva y en qué cantidad por porción.
    4.  **Desechables y empaques**: caja, bolsa, servilletas, etc.
*   **Ocultar / Disponible**: retira un producto del menú sin borrarlo.
*   **Eliminar producto** (pide confirmación).
*   **Categorías**: crear y eliminar las categorías del menú.

Al cambiar un precio, los clientes ven el nuevo valor en pocos segundos. Los pedidos ya confirmados conservan el precio con el que se pagaron.

### 8.5 Inventario Express (Abastecimiento)
*   **Registrar un insumo**: nombre, categoría (Panadería, Carnes, Quesos, Verduras, Salsas, Acompañamientos, Bebidas, Empaques y Desechables, General), unidad de medida (unidades, kg, g, litros, ml, paquetes, cajas, porciones), existencias, costo unitario y foto opcional.
*   **Botón "+" (Sumar al stock)**: después de una compra, se escribe cuántas unidades llegaron y se suman al instante.
*   **Botón "−" (Registrar merma / Restar)**: descuenta producto dañado, vencido o perdido.
*   **Editar** y **Eliminar** insumos.
*   **Semáforo de existencias**: rojo con 10 o menos, naranja hasta 30 y verde por encima de 30.
*   **Historial de Movimientos**: cada entrada (compra), salida (venta, con el número del pedido) o ajuste queda registrado con fecha, cantidad y motivo.

### 8.6 Equipo y Personal
*   **Registrar un colaborador**: nombre, rol (Ayudante de cocina o Domiciliario), correo, contraseña, teléfono y **PIN de acceso**. Para domiciliarios, además: vehículo (moto, bicicleta, carro o a pie), modelo, placa y **base de efectivo** (el dinero de cambio con el que sale).
*   **Editar** sus datos o asignar un nuevo PIN.
*   **Dar de baja**: le quita el acceso de inmediato, incluso si tenía la sesión abierta. Su historial se conserva.
*   **Eliminar** (aparece en quienes ya están dados de baja): borra al colaborador del todo, pero **solo si nunca preparó ni entregó un pedido** (por ejemplo, una cuenta creada por error). Si ya tiene historial, el sistema no lo permite y lo deja dado de baja.
*   **Filtrar** la lista y **Exportar a CSV** (se abre en Excel).

### 8.7 Directorio de Clientes
Lista de clientes con nombre, teléfono, puntos acumulados y fecha de nacimiento, con buscador. **Ver perfil** muestra el resumen del cliente y sus pedidos.

### 8.8 Ajustes y Caja
| Ajuste | Para qué sirve |
|---|---|
| **Horario de atención** | Hora de apertura y de cierre. Admite horarios que pasan la medianoche (ej. 6:00 p. m. a 2:00 a. m.). |
| **Abrir / Cerrar el local manualmente** | Cierra la tienda aunque esté dentro del horario (o vuelve al horario automático). |
| **Pausa de emergencia** | Detiene la recepción de pedidos al instante (ej. se acabó el gas o se fue la luz). Se reanuda con el mismo botón. |
| **Tarifa plana de domicilio** | Valor del envío que se suma a cada pedido. |
| **Margen de ganancia** | Porcentaje que se suma al costo de cada ingrediente para calcular el precio de los extras y del Creador Interactivo. |
| **Programa de puntos** | Cuánto vale 1 punto al pagar (por defecto $10) y desde cuántos puntos se pueden usar (por defecto 100). Muestra un ejemplo de cuánto valen 100 puntos. |
| **Datos del negocio (ticket)** | Nombre, NIT, dirección, teléfono, Instagram y página web que se imprimen en el ticket de cocina. El nombre es obligatorio; los campos vacíos no se imprimen. Debajo hay una **vista previa del ticket** que muestra cómo quedará mientras se escribe, antes de guardar. |
| **Cierre de caja** | Ver la sección 9. |

**El local recibe pedidos solo si se cumplen las tres condiciones**: está abierto manualmente, no está en pausa de emergencia y la hora actual está dentro del horario.

---

## 9. CIERRE DE CAJA

Se hace al final de la jornada desde **Ajustes y Caja → Cierre de Caja**.

### 9.1 Paso a paso
1.  **Vista previa** (no guarda nada todavía). Muestra:
    *   **Ventas totales** y número de pedidos.
    *   **Desglose por método de pago**: efectivo y digital (Nequi, Daviplata, Bancolombia).
    *   **Consumo de insumos**: cuánto se gastó de cada insumo, su costo, la ganancia y el margen.
    *   **Liquidación de domiciliarios**: por cada uno, cuántos pedidos entregó, cuánto cobró en efectivo, su base y el **total que debe entregar** (base + efectivo cobrado).
2.  **Advertencia de órdenes activas**: si todavía hay pedidos en curso, el sistema lo avisa antes de cerrar. Esos pedidos **no se pierden**: siguen su curso y entran en el siguiente cierre.
3.  **Reporte PDF**: se puede ver en pantalla o descargar.
4.  **Confirmar el cierre**: guarda el reporte, registra la liquidación de cada domiciliario y **archiva** los pedidos entregados.

### 9.2 Qué entra en el cierre
Entran **todos los pedidos entregados que aún no estaban en un cierre anterior**, incluidos los pedidos manuales de clientes invitados. Ningún pedido se cuenta dos veces y ninguno se borra: quedan en el historial para reportes posteriores. Los totales ya vienen con los descuentos aplicados (cumpleaños y puntos), es decir, lo que realmente se cobró.

### 9.3 Reglas
*   Solo se puede hacer **un cierre por día** por administrador.
*   El consumo de insumos se calcula con las salidas reales registradas en cada venta, no con estimaciones.

---

## 10. LÓGICA DEL INVENTARIO

### 10.1 Ingredientes y empaques
*   **Ingredientes**: forman parte de la receta y aparecen en la comanda de cocina (carne, queso, pan).
*   **Empaques y desechables**: se necesitan para despachar (caja, bolsa, servilletas). Se descuentan del inventario con cada venta, pero **no aparecen** en la comanda, para que la pantalla de cocina sea más clara.

### 10.2 Cuándo se mueve el inventario
| Momento | Qué pasa |
|---|---|
| El cliente confirma un pedido | **Salida**: se descuenta la receta, menos lo que quitó, más los extras y los empaques. Queda registrado con el número del pedido. |
| El administrador suma stock ("+") | **Entrada** en el historial. |
| El administrador registra una merma ("−") | **Salida** en el historial, con su motivo. |
| Cierre de caja | Se calcula el consumo total del periodo a partir de las salidas. |

### 10.3 Protección contra la doble venta
Si dos clientes intentan comprar al mismo tiempo la última unidad de un ingrediente, el sistema atiende un pedido a la vez: el primero se confirma y el segundo recibe el aviso **"Sin stock suficiente de ..."**, sin que se le cobre. Nunca se vende algo que no se puede preparar.

---

## 11. CÓMO SE CALCULAN LOS PRECIOS

| Concepto | Cómo se calcula |
|---|---|
| Producto del menú | Precio del producto + precio de los extras elegidos. |
| Precio de un extra o de un ingrediente del Creador | Costo unitario × (1 + margen de ganancia), redondeado a la centena. |
| Hamburguesa del Creador Interactivo | Suma de los precios de sus ingredientes. |
| Descuento de cumpleaños | 15 % del subtotal de productos (solo el día del cumpleaños). |
| Descuento por puntos | Puntos usados × valor del punto. Nunca supera lo que cuestan los productos (después del descuento de cumpleaños). |
| Domicilio | Tarifa plana configurada por el administrador. |
| **Total** | Subtotal − descuento de cumpleaños − descuento por puntos + domicilio. |
| Puntos ganados | 1 punto por cada $1.000 del total pagado. |

**Ejemplo:** un extra de queso cuesta $1.500 y el margen es 35 %. $1.500 × 1,35 = $2.025, que redondeado a la centena da **$2.000**.

**Ejemplo de pedido:** subtotal $40.000, cumpleaños del cliente (−$6.000) y domicilio $5.000. **Total: $39.000**, que suma **39 puntos** al entregarse.

**Ejemplo con puntos:** el cliente tiene 250 puntos y cada punto vale $10. Su pedido cuesta $20.000 en productos más $5.000 de domicilio. Al usar sus puntos se descuentan $2.500 (250 × $10). **Total: $22.500**, y su saldo queda en 0 hasta que el pedido se entregue y gane 22 puntos nuevos.

---

## 12. SEGURIDAD Y PRIVACIDAD

*   **Contraseñas y PIN cifrados**: el sistema nunca guarda la contraseña real, ni siquiera el administrador puede verla.
*   **Bloqueo por intentos**: 5 intentos fallidos en 1 minuto bloquean ese correo por 1 minuto. Al entrar bien, el conteo vuelve a 0.
*   **Sesión**: se cierra sola después de un tiempo sin uso (por defecto, 2 horas). Si un empleado es dado de baja, pierde el acceso al instante.
*   **Permisos por rol**: cada persona solo puede ver y hacer lo que corresponde a su rol. Un cliente solo ve sus propios pedidos y su perfil.
*   **Datos visibles solo cuando hacen falta**:
    *   El **PIN de entrega** solo lo ve el cliente dueño del pedido.
    *   El **teléfono del cliente** solo lo ve el domiciliario asignado mientras el pedido está En Camino. Después de entregarlo, deja de verlo.
    *   Los **costos** de los insumos y las **recetas** solo los ve el administrador.
*   **Pagos protegidos**: cada pago digital lleva una firma de seguridad. Si alguien altera el monto, el pago se rechaza. Un mismo pago no se puede usar en dos pedidos.
*   **Puntos protegidos**: los mismos puntos no se pueden gastar en dos pedidos al mismo tiempo, y solo se descuentan si el pedido se crea con éxito.
*   **Fotos**: solo se aceptan imágenes reales (JPG, PNG, WEBP, GIF) de hasta 5 MB.
*   **Protección de formularios**: el sistema impide que otra página web haga acciones en nombre de un usuario que tiene la sesión abierta.

---

## 13. ACTUALIZACIÓN EN TIEMPO REAL

Nadie tiene que recargar la página. Cada pantalla consulta los cambios automáticamente:
*   **Cada 2 a 3 segundos** mientras hay actividad.
*   Un poco más despacio (unos 6 segundos) cuando no ha cambiado nada.
*   Cada 20 segundos si la pestaña está en segundo plano, para ahorrar batería y datos. Al volver a la pestaña, se actualiza de inmediato.

Así, cuando la cocina marca un pedido como "Listo", el domiciliario y el cliente lo ven en pocos segundos.

Toda la información (pedidos, inventario, clientes, configuración) se guarda en la **base de datos del servidor**. Si alguien cierra el navegador, encuentra todo igual al volver. La excepción es el carrito del cliente, que se guarda en su propio navegador hasta que paga.

---

## 14. AVISOS, SONIDOS Y NOTIFICACIONES

### 14.1 Avisos en pantalla
Mensajes cortos que aparecen en una esquina y se cierran solos. Tienen un color según su tipo:

| Color | Cuándo aparece |
|---|---|
| Naranja | Producto agregado al carrito, cambios en el inventario y avisos informativos (pedido en preparación, ruta iniciada, pedido asignado). |
| Verde | Pago aprobado, registro exitoso, pedido entregado, reseña enviada, cierre de caja generado y ticket enviado a impresión. |
| Azul | Cambios en el equipo de trabajo. |
| Morado | Cambios de configuración: tarifa, horario, margen, sonido, apertura o pausa. |
| Amarillo | Advertencias: sesión cerrada, datos incompletos, colaborador dado de baja. |
| Rojo | Errores: pago rechazado, sin stock, producto eliminado, acción no permitida. |

### 14.2 Sonidos
*   **Campana de nueva comanda** en cocina y en el panel del administrador cada vez que entra un pedido.
*   Se puede silenciar desde el panel de cocina.

### 14.3 Notificaciones en el celular (push)
El cliente que las activa recibe **"¡Tu pedido ha llegado!"** cuando el domiciliario confirma la entrega, aunque tenga la página cerrada. Funcionan en Chrome, Edge y Firefox. En iPhone, solo si la página se agregó a la pantalla de inicio.

### 14.4 WhatsApp
El sistema **no envía WhatsApp automáticamente**: cuando el pedido va En Camino, el domiciliario tiene el botón **Contactar Cliente**, que abre WhatsApp con el mensaje ya escrito para que solo lo envíe.

---

## 15. ¿QUÉ PASA SI...? (Casos especiales)

*   **¿Se agota un ingrediente?** Los productos que lo usan se muestran como "Agotado" en el menú en pocos segundos. Si alguien ya lo tenía en el carrito, el sistema lo rechaza al pagar con el aviso "Sin stock suficiente de ...", sin cobrar.
*   **¿El administrador cambia un precio?** Los pedidos ya confirmados conservan su precio. Los que están en un carrito sin pagar se cobran con el **precio nuevo**, porque el total se calcula al momento de pagar.
*   **¿El administrador oculta o elimina un producto que un cliente tiene en el carrito?** Al pagar aparece "Uno de los productos del carrito ya no está disponible".
*   **¿El local está cerrado?** El cliente puede ver el menú y armar su carrito, pero no puede pagar.
*   **¿Se acaba el gas o hay una emergencia?** El administrador activa la **pausa de emergencia** y nadie más puede pedir hasta que la quite.
*   **¿El pago digital es rechazado?** No se crea el pedido, no se descuenta inventario y el cliente puede intentarlo de nuevo.
*   **¿El cliente pierde internet durante el pago?** El pedido solo se crea cuando el pago queda aprobado y verificado. Un mismo pago no puede generar dos pedidos.
*   **¿Dos domiciliarios quieren el mismo pedido?** Solo uno lo consigue; el otro recibe el aviso de que ya no está disponible.
*   **¿El domiciliario tomó un pedido pero no puede llevarlo?** Lo **suelta** (si no ha salido), o el administrador se lo quita desde Comandas Activas.
*   **¿El domiciliario no encuentra la dirección?** Usa **Contactar Cliente** (WhatsApp) mientras el pedido va En Camino.
*   **¿El cliente se equivocó de dirección después de pagar?** Llama al local y el administrador la corrige en **Comandas Activas → Editar dirección**. El domiciliario ve la nueva dirección y la ruta en pocos segundos, con un aviso. Si el pedido ya fue entregado, ya no se puede cambiar.
*   **¿Alguien sin cuenta quiere pedir por teléfono?** El administrador lo registra como pedido manual; queda como cliente invitado y se paga en efectivo.
*   **¿Un cliente registrado pide por WhatsApp?** Al registrar el pedido manual con su celular, queda en su cuenta y suma puntos al entregarse.
*   **¿El cliente tiene pocos puntos?** La casilla "Usar mis puntos" aparece desactivada y le indica desde cuántos puntos podrá usarlos.
*   **¿Se creó un empleado por error?** Se da de baja y luego se elimina. Si ya alcanzó a preparar o entregar un pedido, solo puede quedar dado de baja.
*   **¿El cliente no tiene el PIN a la mano?** Lo encuentra en **Órdenes Activas**, dentro de su cuenta.
*   **¿Un pedido tarda demasiado en cocina?** A los 15 minutos en preparación, la tarjeta se marca en rojo.
*   **¿Un empleado deja la empresa?** Se le da de baja: pierde el acceso al instante y su historial se conserva.
*   **¿Cambian los datos del negocio (NIT, dirección, redes)?** Se actualizan en **Ajustes → Datos del Negocio** y el siguiente ticket ya sale con los datos nuevos.
*   **¿Hay pedidos en curso a la hora del cierre de caja?** El sistema advierte; esos pedidos continúan y entran en el siguiente cierre.
*   **¿Se pierde la conexión en cocina?** Los pedidos que ya estaban en pantalla siguen visibles. Al volver la conexión, la pantalla se pone al día sola con los pedidos que llegaron mientras tanto.

---

## 16. MENSAJES FRECUENTES Y QUÉ HACER

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| "La tienda está cerrada o pausada" | Fuera de horario, cerrada a mano o en pausa de emergencia. | Revisar Ajustes y Caja. |
| "Sin stock suficiente de ..." | Falta inventario de ese insumo. | Sumar existencias en Inventario Express. |
| "Uno de los productos del carrito ya no está disponible" | El producto se ocultó o se eliminó. | Quitarlo del carrito. |
| "Este pedido ya no está disponible para reparto" | Otro domiciliario lo tomó primero. | Tomar otro pedido. |
| "PIN incorrecto" | El PIN de entrega no coincide. | Pedir al cliente que lo revise en Órdenes Activas. |
| "Transición de estado no permitida" | Se intentó saltar un paso del pedido. | Seguir el orden normal de estados. |
| "Ya se generó un cierre de caja hoy" | Ya hubo un cierre ese día. | Esperar al día siguiente. |
| "Demasiados intentos fallidos" | 5 intentos fallidos en 1 minuto con ese correo. | Esperar 1 minuto o recuperar la contraseña. |
| "Correo o contraseña incorrectos" (con datos correctos) | La cuenta puede estar dada de baja. | El administrador debe reactivarla. |
| "Tu saldo de puntos cambió" | Mientras pagaba, el saldo de puntos del cliente cambió. | Revisar el pedido e intentar de nuevo. |
| "Este colaborador ya tiene pedidos en su historial y no se puede eliminar" | Se intentó eliminar a alguien que ya trabajó. | Dejarlo dado de baja. |
| "Este pedido ya fue entregado y no se puede cambiar su dirección" | La dirección solo se corrige con el pedido en curso. | — |
| "Completa el nombre, el celular y la dirección del cliente" | Falta un dato en el pedido manual. | Completar los cuatro datos del cliente. |
| "El pago fue rechazado por el banco" | La pasarela no aprobó el pago. | Intentar de nuevo o pagar en efectivo. |

---

## 17. GUÍA VISUAL PARA DISEÑO DE PANTALLAS (Mockups)

Descripción de cómo se ven las pantallas reales, para quien necesite dibujarlas en Figma, Adobe XD o una herramienta parecida.

### 17.1 Estilo general
*   **Color principal**: naranja vibrante, en los botones principales (Pagar, Iniciar sesión, Agregar) y los detalles de marca.
*   **Modo claro y modo oscuro**: fondos blancos y gris muy claro en modo claro; gris carbón y negro mate en modo oscuro. Casi todas las pantallas tienen un botón de sol y luna para cambiar.
*   **Colores con significado**: rojo para peligro, errores y lo que se quita ("Sin"); verde para éxito y lo que se agrega ("Extra"); amarillo para advertencias.
*   **Tipografía**: sans-serif moderna y legible. Títulos muy gruesos para dar impacto; números de pedido en letra de ancho fijo y negrita.
*   **Formas**: tarjetas y ventanas con esquinas muy redondeadas, bordes finos y sombras suaves.
*   **Íconos**: de línea, simples (reloj, llama, cubiertos, escudo, carrito, impresora, mapa).

### 17.2 Página de inicio (antes de iniciar sesión)
*   **Portada**: foto grande de hamburguesa artesanal con un velo oscuro, titular grande con acentos naranja y dos botones: "Hacer Pedido" (naranja) y "Ver Menú" (borde blanco).
*   **Barra de valores**: cuatro tarjetas con íconos sobre rapidez, frescura y calidad.
*   **Vista previa del menú**: productos con pestañas por categoría.
*   **Historia y cifras**: mosaico de fotos y cifras destacadas.
*   **Testimonios**: reseñas reales de clientes con estrellas.
*   **Contacto y mapa** con la ubicación de la cocina.

### 17.3 Acceso
*   **Inicio de sesión**: tarjeta centrada con logo, campos de correo y contraseña con ícono a la izquierda, botón para ver u ocultar la contraseña, enlace "¿Olvidaste tu contraseña?", botón naranja ancho "Iniciar Sesión" y enlace para registrarse.
*   **Registro**: los campos del punto 5.1, selector de calendario para la fecha de nacimiento y casilla obligatoria de Habeas Data.
*   **Recuperar contraseña**: tarjeta pequeña en dos pasos: primero el correo; después el código de 6 dígitos y la nueva contraseña.
*   **Paneles de cocina y domiciliario**: pantalla adicional de usuario y PIN de 4 dígitos.

### 17.4 Panel del cliente
*   **Barra superior** con logo, accesos a Catálogo, Arma tu Burger, Órdenes Activas, Historial y Perfil, botón de carrito con contador, campana de notificaciones y cambio de tema.
*   **Catálogo** en cuadrícula: foto grande arriba; nombre, descripción corta, etiqueta y precio grande en naranja abajo, con botón "+".
*   **Ventana de producto**: foto, secciones "Retirar Ingredientes" y "Añadir Extras" (los agotados en gris con la palabra "AGOTADO") y total recalculado con el botón para agregar.
*   **Arma tu Burger**: dibujo de la hamburguesa que crece capa por capa y lista de ingredientes con precio.
*   **Carrito y Checkout**: lista de productos con sus personalizaciones en letra pequeña, resumen de pago, dirección, método de pago con logos de bancos, casilla "Usar mis puntos" con el saldo, y botón de pagar (gris con "Cerrado" si el local no atiende).
*   **Ventana de la pasarela**: pasos animados hasta "Aprobado" o "Rechazado".
*   **Órdenes Activas**: tarjeta por pedido con barra de pasos (Pendiente, En Preparación, Listo, En Camino) y el PIN de entrega destacado.
*   **Historial**: buscador, lista de pedidos con puntos ganados, recibo y ventana de calificación con 5 estrellas.

### 17.5 Panel del administrador
*   **Menú lateral fijo** con las ocho secciones (en celular se oculta y se abre con un botón).
*   **Tablero**: fila de tarjetas con indicadores, gráficas de ventas y comparativos, productos más vendidos y órdenes recientes.
*   **Comandas**: tarjetas o filas por pedido con su estado, más el mapa de entregas.
*   **Menú**: lista de productos con miniatura y formulario en cuatro pasos.
*   **Inventario**: tarjetas de insumos con punto de color (semáforo), botones "+" y "−", e historial de movimientos.
*   **Personal**: tabla con nombre, rol, estado (activo/inactivo con un punto que late) y acciones.
*   **Comandas**: la ventana de pedido manual tiene tres bloques: datos del cliente (con dos botones para elegir Llamada o WhatsApp), productos añadidos y el pie con subtotal, envío, total y "Enviar a Cocina".
*   **Ajustes y Caja**: dos columnas. A la izquierda, la tarifa de domicilio, el horario (con el interruptor de apertura), los seis datos del negocio para el ticket y una **vista previa del ticket** que cambia mientras se escribe (con la etiqueta "Sin guardar" si hay cambios pendientes). A la derecha, el margen de ganancia, el programa de puntos (valor del punto, mínimo y un ejemplo), el botón de cierre de caja y, al final, la pausa de emergencia, separados para que no se presionen por accidente.

### 17.6 Panel de cocina
*   Pantalla completa, letras grandes y alto contraste, pensada para tablet horizontal.
*   Tres columnas iguales: Pendientes (gris), En Preparación (amarillo/naranja) y Listos (verde).
*   Tarjetas con número grande, reloj, productos, "Sin" en rojo y "Extra" en verde, y botones para avanzar e imprimir.
*   Panel lateral con inventario crítico y resumen de preparación.

### 17.7 Panel del domiciliario
*   Diseñado primero para celular, con botones grandes y fáciles de tocar.
*   Lista de pedidos disponibles a un lado (o arriba en celular) y el mapa con la ruta en el área principal.
*   Botones Waze y Maps, botón verde "Contactar Cliente" y ventana de "Validar Entrega" con cuatro casillas para el PIN.

### 17.8 Pantallas vacías
El sistema nunca muestra una pantalla en blanco. Ejemplos: "Tu carrito está vacío", "No tienes órdenes en curso", "No hay productos en esta categoría", "Sin pedidos pendientes", "No hay comandas activas en este momento", "No hay entregas asignadas en este momento".

---

## 18. LIMITACIONES ACTUALES Y FUNCIONES PENDIENTES

Estas funciones están planeadas para una próxima versión:

| Función | Situación actual |
|---|---|
| **Cancelar pedidos** | El estado "Cancelado" existe, pero todavía no hay ninguna pantalla para cancelar un pedido. |
| **Pasarela de pago** | Es de prueba: simula un pago real, pero no cobra dinero. |

> **Antes de usar el sistema con clientes reales**, el administrador debe revisar en **Ajustes → Datos del Negocio** el NIT, la dirección y el teléfono: vienen con datos de ejemplo.

---

## 19. GLOSARIO

| Término | Significado |
|---|---|
| **Dark Kitchen** | Cocina que solo vende a domicilio, sin atención en mesas. |
| **KDS** | Pantalla de cocina donde se ven y se mueven los pedidos (del inglés *Kitchen Display System*). |
| **Comanda** | La tarjeta o el papel con el detalle de un pedido para la cocina. |
| **Tirilla / Ticket** | El papel impreso que se pega en la bolsa del pedido. |
| **Escandallo** | La receta de un producto: qué insumos lleva y en qué cantidad. |
| **Insumo** | Todo lo que se compra para producir: ingredientes y empaques. |
| **Merma** | Insumo que se pierde por daño, vencimiento o error. |
| **Stock / Existencias** | Cantidad disponible de un insumo. |
| **Abastecimiento Express** | Sumar existencias rápidamente después de una compra. |
| **Margen de ganancia** | Porcentaje que se suma al costo de un ingrediente para fijar su precio de venta. |
| **Tarifa plana** | Valor de domicilio igual para todos los pedidos. |
| **Ticket promedio** | Valor promedio de cada pedido. |
| **PIN de acceso** | Clave de 4 dígitos con la que cocina y domiciliarios entran a su panel. |
| **PIN de entrega** | Clave de 4 dígitos de cada pedido que el cliente le da al domiciliario al recibir. |
| **Base** | Dinero de cambio con el que sale el domiciliario. |
| **Cliente invitado** | Persona sin cuenta cuyo pedido registró el administrador por llamada o WhatsApp. |
| **Pedido manual** | Pedido que el administrador registra a mano porque llegó por llamada o WhatsApp. |
| **Canjear puntos** | Usar los puntos acumulados para pagar parte de los productos de un pedido. |
| **Liquidación** | Lo que cada domiciliario debe entregar al cierre: su base más el efectivo que cobró. |
| **Cierre de caja** | Resumen de ventas, pagos e insumos de la jornada, que archiva los pedidos entregados. |
| **Dar de baja** | Desactivar una cuenta sin borrar su historial. |
| **Pausa de emergencia** | Botón que detiene la recepción de pedidos al instante. |
| **Habeas Data** | Ley colombiana de protección de datos personales; el cliente debe aceptarla para registrarse. |
| **Punto de No Retorno** | Momento (la confirmación del pedido) desde el cual el cliente ya no puede modificarlo ni cancelarlo. |

---
**Hamburguer Copiway — Sistema Integrado de Gestión Operativa.**
