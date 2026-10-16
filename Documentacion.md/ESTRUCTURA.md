# Estructura del proyecto

Así está organizado el proyecto, para qué sirve cada archivo y qué hace por dentro.

## Archivos de la raíz

```
copiwaypro/
├── .htaccess          → hace que todas las direcciones pasen por public/index.php
├── .gitignore         → lo que no se sube a GitHub
├── README.md          → explicación general del proyecto
├── composer.json      → librerías de PHP (correos y notificaciones)
├── package.json       → librerías de React y los comandos de npm
├── vite.config.ts     → configuración para compilar React
├── tsconfig.json      → configuración de TypeScript
└── index.html         → solo se usa con npm run dev
```

## public/ (lo que abre el navegador)

```
public/
├── index.php          → por aquí entra todo el sistema
│                         · carga la conexión y la configuración
│                         · si la dirección empieza con /api, busca la ruta
│                         · si no, busca la página
├── .htaccess          → manda todo a index.php
├── sw.js              → recibe las notificaciones en el celular
├── manifest.json      → permite instalar la app en el celular
├── favicon...         → íconos de la página
├── assets/            → React ya compilado (main.js y main.css)
└── uploads/           → fotos de los productos
```

## config/ (configuración)

```
config/
├── database.php       → conexión a la base de datos
├── app.php            → ajustes generales
│                         · zona horaria
│                         · mostrar o no el detalle de los errores
├── rutas.php          → lista de rutas de la API
│                         · qué controlador atiende cada ruta
│                         · qué roles pueden usarla
├── paginas.php        → lista de páginas y quién puede entrar a cada una
├── helpers.php        → funciones que usa todo el sistema
│                         · buscar la ruta y cargar el controlador
│                         · responder a React
│                         · revisar que el usuario tenga permiso
│                         · mostrar las vistas
└── Session.php        → maneja la sesión del usuario
                          · iniciar la sesión
                          · cerrar la sesión
                          · crear el token de seguridad
```

## controllers/ (reciben lo que pide la pantalla)

```
controllers/
├── AuthController.php
│      · iniciar sesión (con contraseña o con PIN)
│      · cerrar sesión
│      · registrarse
│      · pedir el código para recuperar la contraseña
│      · cambiar la contraseña con el código
│
├── PaginaController.php
│      · muestra las páginas: inicio, login, registro, recuperar contraseña
│        y los paneles de administrador, cliente, cocina y domiciliario
│
├── ProductController.php
│      · crear productos
│      · editar productos
│      · eliminar productos
│
├── InventoryController.php
│      · crear insumos
│      · editar insumos
│      · eliminar insumos
│      · sumar o restar stock
│
├── ClientController.php
│      · editar el perfil del cliente
│      · cambiar la contraseña del cliente
│
├── StaffController.php
│      · crear personal (cocina o domiciliario)
│      · editar personal y darlo de baja
│      · eliminar personal
│      · guardar la ubicación del domiciliario
│
├── OrderController.php
│      · ver los pedidos
│      · hacer un pedido (cliente)
│      · registrar un pedido por llamada o WhatsApp (administrador)
│      · cambiar la dirección de un pedido
│      · pasar el pedido a "En preparación" y a "Listo" (cocina)
│      · tomar, soltar y llevar el pedido (domiciliario)
│      · entregar el pedido con el PIN
│      · calificar el pedido (cliente)
│
├── PaymentController.php
│      · preparar el pago
│      · crear el pago
│      · consultar si el pago fue aprobado
│
├── CashClosingController.php
│      · ver el cierre de caja antes de confirmarlo
│      · confirmar el cierre de caja
│
├── SettingController.php
│      · guardar los ajustes de la tienda (horario, tarifa, puntos, datos del negocio)
│      · agregar categorías del menú
│      · eliminar categorías del menú
│
├── SyncController.php
│      · envía a las pantallas todos los datos (productos, pedidos, inventario,
│        clientes, personal y ajustes), según quién haya iniciado sesión
│
├── PushController.php
│      · activar las notificaciones en el celular del cliente
│
└── UploadController.php
       · subir la foto de un producto
```

## models/ (consultas a la base de datos)

```
models/
├── Auth.php
│      · iniciar sesión (con contraseña o con PIN)
│      · saber quién inició sesión y qué rol tiene
│      · cerrar sesión
│
├── Usuario.php
│      · buscar administradores
│      · crear administradores
│
├── Cliente.php
│      · listar y buscar clientes
│      · crear clientes
│      · editar clientes
│      · cambiar la contraseña
│      · ver sus notificaciones
│
├── Personal.php
│      · listar el personal
│      · crear, editar y eliminar personal
│      · guardar la ubicación del domiciliario
│
├── Producto.php
│      · listar y buscar productos
│      · crear, editar y eliminar productos
│
├── Ingrediente.php
│      · listar el inventario y los ingredientes
│      · crear, editar y eliminar insumos
│      · sumar o restar stock
│      · descontar el inventario cuando se hace un pedido
│      · ver los movimientos del inventario
│
├── Pedido.php
│      · ver los pedidos (cada rol ve los suyos)
│      · buscar un pedido
│
├── Configuracion.php
│      · ver y guardar los ajustes de la tienda
│      · agregar y eliminar categorías
│      · saber si la tienda está abierta
│      · tarifa de domicilio, puntos y margen de ganancia
│
├── Caja.php
│      · pedidos del turno
│      · consumo de insumos
│      · domiciliarios activos
│      · reporte del cierre
│
├── CodigoVerificacion.php
│      · crear el código para recuperar la contraseña
│      · revisar que el código sea válido
│      · marcar el código como usado
│
├── IntentoLogin.php
│      · guardar cada intento de inicio de sesión
│      · bloquear después de 5 intentos fallidos
│
├── PushSuscripcion.php
│      · guardar los celulares que reciben notificaciones
│
├── PedidoService.php
│      · crear el pedido del cliente y el pedido manual
│      · calcular el total
│      · cambiar el estado del pedido (preparando, listo, en camino)
│      · tomar y soltar pedidos
│      · confirmar la entrega con el PIN
│      · cambiar la dirección y guardar el destino
│      · calificar el pedido
│
├── CajaService.php
│      · calcular el cierre de caja (efectivo y digital)
│      · guardar el cierre y pagarle a los domiciliarios
│
├── PagoService.php
│      · preparar, crear y revisar los pagos de prueba
│
├── CorreoService.php
│      · enviar el correo con el código de recuperación
│
└── PushNotificationService.php
       · avisarle al cliente que su pedido llegó
```

## views/ (vistas)

```
views/
├── layouts/
│   ├── cabecera.php       → parte de arriba de todas las páginas
│   └── pie.php            → parte de abajo de todas las páginas
│
├── paginas/               → una vista por página
│   ├── landing.php        → inicio
│   ├── login.php          → iniciar sesión
│   ├── registro.php       → crear cuenta
│   ├── recuperar.php      → recuperar contraseña
│   ├── admin.php          → panel del administrador
│   ├── cliente.php        → panel del cliente
│   ├── cocina.php         → panel de cocina
│   └── domiciliario.php   → panel del domiciliario
│
└── json/                  → organizan los datos antes de enviarlos a React
    ├── cliente.php        → datos del cliente y sus notificaciones
    ├── ingrediente.php    → datos del inventario y de los ingredientes
    ├── pedido.php         → datos del pedido con sus productos
    ├── personal.php       → datos del personal
    └── producto.php       → datos del producto (el administrador también ve el costo)
```

## sql/ (base de datos)

```
sql/
├── schema.sql         → crea la base de datos y sus tablas
├── seed.sql           → datos de ejemplo (usuarios y productos)
└── create-admin.php   → crea el primer administrador
```

## src/ (pantallas hechas en React)

```
src/
├── main.tsx                   → abre la pantalla que corresponde
├── index.css                  → estilos y colores
├── global.d.ts                → datos que manda PHP a React
├── servicios/api.ts           → se comunica con PHP
├── store/almacenAplicacion.ts → guarda los datos y llama a PHP para guardar cambios
│
├── components/                → partes que se repiten
│   ├── SyncDatos.tsx          → actualiza los datos cada pocos segundos
│   ├── Navbar.tsx             → menú de arriba de la página de inicio
│   ├── Footer.tsx             → parte de abajo de la página de inicio
│   ├── ConfirmDialog.tsx      → ventana "¿Estás seguro?"
│   ├── ToastNotification.tsx  → avisos pequeños
│   ├── CustomSelect.tsx       → lista desplegable
│   ├── CustomDatePicker.tsx   → elegir fecha
│   ├── CalendarModal.tsx      → calendario
│   └── TimePickerModal.tsx    → elegir hora
│
├── context/ThemeContext.tsx   → modo claro y oscuro
├── hooks/useForm.ts           → manejo de formularios
├── lib/
│   ├── format.ts              → mostrar precios y códigos de pedido
│   ├── pasarela.ts            → pagos
│   └── pushNotifications.ts   → activar notificaciones
├── utils/
│   ├── audio.ts               → sonidos de alerta
│   └── generarCierrePdf.ts    → PDF del cierre de caja
│
└── pages/                     → las pantallas
    ├── Landing.tsx            → inicio (menú, historia, contacto)
    ├── Login.tsx              → iniciar sesión
    ├── Register.tsx           → crear cuenta
    ├── ForgotPassword.tsx     → recuperar contraseña
    │
    ├── AdminDashboard.tsx     → panel del administrador
    ├── admin/
    │   ├── OverviewSection.tsx    → resumen de ventas
    │   ├── OrdersSection.tsx      → pedidos activos
    │   ├── MapSection.tsx         → mapa de domiciliarios
    │   ├── MenuSection.tsx        → crear, editar y eliminar productos y categorías
    │   ├── InventorySection.tsx   → crear, editar y eliminar insumos, sumar stock
    │   ├── StaffSection.tsx       → crear, editar y eliminar personal
    │   ├── ClientsSection.tsx     → lista de clientes
    │   └── SettingsSection.tsx    → ajustes de la tienda y cierre de caja
    │
    ├── ClientDashboard.tsx    → panel del cliente
    ├── client/
    │   ├── CatalogSection.tsx       → ver el menú
    │   ├── BuilderSection.tsx       → armar una hamburguesa
    │   ├── ingredientArt.tsx        → dibujos de los ingredientes
    │   ├── CartSection.tsx          → carrito
    │   ├── CheckoutSection.tsx      → dirección y forma de pago
    │   ├── PaymentGatewayModal.tsx  → ventana de pago
    │   ├── ActiveOrdersSection.tsx  → pedidos en camino
    │   ├── HistorySection.tsx       → historial y calificar pedidos
    │   └── ProfileSection.tsx       → editar perfil y contraseña
    │
    ├── KitchenDashboard.tsx   → panel de cocina (pendientes, en preparación, listos)
    └── DeliveryDashboard.tsx  → panel del domiciliario (tomar, llevar y entregar)
```

## Otras carpetas

```
├── Documentacion.md/   → explicación de cada archivo
├── Documentos/         → requerimientos e historias de usuario
├── node_modules/       → librerías de React (no se toca)
└── vendor/             → librerías de PHP (no se toca)
```

## Cómo funciona (ejemplo: cambiar el precio de un producto)

```
1. El administrador cambia el precio en la pantalla de menú (MenuSection.tsx).
2. React envía el cambio a PHP (api.ts).
3. public/index.php recibe la petición.
4. config/rutas.php dice que la atiende ProductController.
5. ProductController revisa que el precio esté bien.
6. El modelo Producto guarda el precio en la base de datos.
7. PHP le responde a React y la pantalla se actualiza.
```

## Cómo se abre una página (ejemplo: el panel del administrador)

```
1. El usuario abre /admin.
2. public/index.php recibe la petición.
3. config/paginas.php revisa que sea administrador.
4. PaginaController carga la vista views/paginas/admin.php.
5. React muestra el panel del administrador.
```
