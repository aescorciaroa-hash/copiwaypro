# 17 — Banco de preguntas del instructor (todos los temas)

¿No entiendes una palabra? Mira el [glosario](../Estructura&Glosario/GLOSARIO.md).

Aquí están **todas las preguntas que te pueden hacer**, separadas por tema, cada una con una
**respuesta corta** para decirla con tus palabras. Las preguntas de *"¿cómo se conecta un modelo?"*
están en la [guía 16](16-conexiones-y-preguntas.md); aquí está **todo lo demás**.

**Consejo:** si no sabes algo, di **en qué archivo está** ("eso lo hace `PedidoService`, en `models/`").
Eso demuestra que conoces el proyecto aunque no recuerdes el detalle.

## Temas
1. [El proyecto en general](#1-el-proyecto-en-general)
2. [Arquitectura MVC](#2-arquitectura-mvc)
3. [PHP: palabras y símbolos](#3-php-palabras-y-símbolos)
4. [Base de datos (diseño)](#4-base-de-datos-diseño)
5. [SQL: consultas](#5-sql-consultas)
6. [Peticiones HTTP, rutas y respuestas](#6-peticiones-http-rutas-y-respuestas)
7. [React y la pantalla (frontend)](#7-react-y-la-pantalla-frontend)
8. [Cómo se comunican React y PHP](#8-cómo-se-comunican-react-y-php)
9. [Seguridad](#9-seguridad)
10. [Roles, usuarios y login](#10-roles-usuarios-y-login)
11. [Pedidos (de principio a fin)](#11-pedidos-de-principio-a-fin)
12. [Inventario y recetas](#12-inventario-y-recetas)
13. [Pagos](#13-pagos)
14. [Cierre de caja](#14-cierre-de-caja)
15. [Puntos, cumpleaños y descuentos](#15-puntos-cumpleaños-y-descuentos)
16. [Notificaciones, correo y WhatsApp](#16-notificaciones-correo-y-whatsapp)
17. [Instalación y herramientas](#17-instalación-y-herramientas)
18. ["¿Qué haces si…?" (errores)](#18-qué-haces-si-errores)
19. ["¿Cómo agregarías…?" (cambios)](#19-cómo-agregarías-cambios)
20. ["¿Por qué lo hicieron así?" (decisiones)](#20-por-qué-lo-hicieron-así-decisiones)
21. [Preguntas trampa](#21-preguntas-trampa)
22. [Mapa rápido: "¿dónde está…?"](#22-mapa-rápido-dónde-está)

---

## 1. El proyecto en general

**¿Qué es CopiwayPRO?**
Un sistema para una hamburguesería: los clientes piden por la web, la cocina prepara, el domiciliario
entrega y el administrador maneja el menú, el inventario, el personal y la caja.

**¿Qué problema resuelve?**
Ordena los pedidos (antes por llamada/WhatsApp), controla el inventario solo (descuenta al vender),
sabe dónde va cada pedido y hace el cierre de caja del día.

**¿Quiénes lo usan?**
4 roles: administrador, ayudante de cocina, domiciliario y cliente (y el programador por consola).
Ver [05 — Roles](05-roles-y-usuarios.md).

**¿Con qué tecnologías está hecho?**
- **Backend:** PHP (MVC simple, sin framework) + MySQL (con `mysqli`).
- **Frontend:** React 19 + TypeScript, compilado con Vite, estilos con Tailwind.
- **Servidor local:** Laragon (Apache + MySQL + PHP).
- **Librerías PHP:** ninguna. El correo (Gmail) y las notificaciones push están hechos con funciones que ya trae PHP (`openssl`, `curl`, `stream_socket_client`).
- **Librerías JS (npm):** zustand (datos en memoria), leaflet (mapas), recharts (gráficas), jspdf (PDF), lucide-react (íconos), motion (animaciones).

**¿Cuál es la base de datos?**
MySQL, base `hamburguer_copiway`. El diseño está en `sql/schema.sql` y los datos de prueba en `sql/seed.sql`.

**¿El proyecto siempre fue así?**
No. Antes usaba **Firebase/Firestore**. Se pasó a **PHP MVC + MySQL** por fases (se ve en git: "Fase 0",
"Fase 1: sintaxis sencilla", "Fase 2: SQL en modelos"…). Por eso `SyncDatos.tsx` dice que reemplaza
los `onSnapshot` de Firestore.

**¿Dónde están los requerimientos?**
En `Document/DocumentacionProyecto/`: `RF-RNF.docx` (requerimientos funcionales y no funcionales),
`HISTORIAS DE USUARIO.xlsx` y `DOCUMENTACION RF PROYECTO`.

**¿Qué es un requerimiento funcional y uno no funcional?**
- **Funcional (RF):** *qué hace* el sistema. Ej.: "el cliente puede crear un pedido".
- **No funcional (RNF):** *cómo debe ser*. Ej.: "las contraseñas van cifradas", "responde rápido", "funciona en celular".

**¿Qué es una historia de usuario?**
Una necesidad contada por el usuario: *"Como cliente, quiero ver mi pedido en camino, para saber cuándo llega."*

---

## 2. Arquitectura MVC

**¿Qué es MVC?**
Una forma de ordenar el código en 3 partes:
- **Modelo** (`models/`): habla con la base de datos (el SQL).
- **Vista** (`views/`): lo que se muestra (HTML / datos para React).
- **Controlador** (`controllers/`): recibe la petición, revisa y coordina modelo y vista.

**¿Por qué usar MVC?**
Cada cosa en su lugar: si falla el SQL, miras el modelo; si falla la pantalla, la vista. Es más fácil de
entender, cambiar y trabajar en equipo.

**¿Cuál es el flujo MVC aquí?**
`React → public/index.php → config/rutas.php → Controlador → Modelo → MySQL → Controlador → JSON → React`.

**¿Qué es el "front controller"?**
Un solo archivo de entrada para todo: `public/index.php`. `.htaccess` manda todas las direcciones ahí.

**¿Qué hay en cada carpeta?**

| Carpeta | Qué tiene |
|---|---|
| `config/` | conexión (`database.php`), rutas, páginas, sesión, funciones de ayuda |
| `controllers/` | 14 controladores |
| `models/` | 17 modelos (tablas y reglas del negocio) |
| `views/paginas/` | el HTML de cada página |
| `views/layouts/` | cabecera y pie compartidos |
| `views/json/` | cómo se organizan los datos para React |
| `public/` | `index.php`, `.htaccess`, lo compilado de React (`assets/`), fotos subidas (`uploads/`) |
| `src/` | el código de React |
| `sql/` | crear la base de datos y datos de prueba |

**¿Qué es un "Service" (PedidoService, CajaService…)?**
Un modelo con las **reglas del negocio** que usa a otros modelos. `Pedido` solo lee; `PedidoService`
crea, cambia estados, descuenta inventario, cobra y avisa.

**¿Dónde están las reglas del negocio?**
En los modelos, sobre todo en `PedidoService` (pedidos), `CajaService` (cierre), `PagoService` (pagos)
y `Configuracion` (horario, tarifas, puntos).

**¿La vista hace consultas?**
No. La vista solo muestra lo que le pasa el controlador.

---

## 3. PHP: palabras y símbolos

| Pregunta | Respuesta corta |
|---|---|
| ¿Qué es una clase? | Un "molde" que agrupa datos y funciones. Ej.: `class Producto`. |
| ¿Qué es un objeto? | Lo que sale del molde: `$p = new Producto();`. |
| ¿Qué es un método? | Una función dentro de una clase: `public function listar()`. |
| ¿Qué es `__construct()`? | El método que corre solo al hacer `new`. |
| ¿Qué es `$this`? | "Este mismo objeto". `$this->conn` = la conexión de este objeto. |
| ¿Qué es `->`? | Usar algo de un objeto: `$modelo->crear()`. |
| ¿Qué es `::`? | Usar algo de la clase sin objeto: `Auth::check()`, `self::BASE`. |
| ¿Qué es `static`? | Un método que se usa sin `new` (con `::`). Ej.: `Auth`, `Session`, `CorreoService`. |
| ¿Qué es `public` / `private`? | `public` = se puede usar desde afuera. `private` = solo dentro de la clase. |
| ¿Qué es `const`? | Un valor que no cambia: `const MAXIMO_INTENTOS = 5;`. |
| ¿Qué es `global`? | Trae una variable de afuera de la función: `global $conn;`. |
| ¿`require` o `include`? | Los dos traen otro archivo. Si falta, `require` detiene todo; `include` solo avisa. Aquí se usa `require`. |
| ¿Y `require_once`? | Igual que `require`, pero si ya se cargó no lo carga otra vez (evita "clase ya declarada"). |
| ¿Qué es `__DIR__`? | La carpeta del archivo actual. Sirve para armar rutas que no fallan. |
| ¿Qué es un arreglo asociativo? | Una lista con nombres: `['nombre' => 'Juan', 'edad' => 20]`. |
| ¿Qué es `try / catch`? | "Intenta esto; si falla, haz esto otro". Atrapa errores sin que se caiga todo. |
| ¿Qué es `throw new Exception(...)`? | Lanza un error con un mensaje. El controlador lo atrapa y responde 422. |
| ¿Qué es `exit`? | Termina el programa ahí. `responderJson()` lo usa después de contestar. |
| ¿Qué es `echo`? | Escribe texto en la respuesta. |
| ¿Qué es `json_encode` / `json_decode`? | Convierte un arreglo PHP en texto JSON / al revés. |
| ¿Qué es `$_GET`, `$_POST`, `$_SESSION`, `$_SERVER`? | Variables especiales: datos de la dirección, del formulario, de la sesión y del servidor. |
| ¿Qué es `??`? | "Si no existe, usa esto": `$_GET['accion'] ?? ''`. |
| ¿Qué es `?:`? | "Si está vacío, usa esto": `$row ?: null`. |
| ¿Qué es `.` y `.=`? | Unir textos / agregar al final de un texto. |
| ¿Qué es `===`? | Igual en valor **y** en tipo (`'1' === 1` es falso). |
| ¿Hay namespaces o `use`? | No. Todo es PHP plano: las clases se cargan con `require_once`. |

---

## 4. Base de datos (diseño)

**¿Cuántas tablas hay?** 23. Las principales: `CLIENTE`, `ADMINISTRADOR`, `AYUDANTE_COCINA`, `DOMICILIARIO`,
`PRODUCTO`, `CATEGORIA`, `INGREDIENTE`, `RECETA`, `PEDIDO`, `DETALLE_PEDIDO`, `PERSONALIZACION`,
`PAGO_TRANSACCION`, `REPORTE_CAJA`, `MOVIMIENTO_INVENTARIO`, `CONFIGURACION_SISTEMA`.
Ver [07 — Base de datos](07-base-de-datos.md).

**¿Qué es una llave primaria (PK)?**
La columna que identifica cada fila sin repetirse. Aquí todas son `INT UNSIGNED AUTO_INCREMENT` (1, 2, 3…).

**¿Qué es `AUTO_INCREMENT`?**
MySQL pone el número solo. PHP lo lee con `$conn->insert_id`.

**¿Qué es una llave foránea (FK)?**
Una columna que apunta a la PK de otra tabla. Ej.: `PEDIDO.id_cliente → CLIENTE.id_cliente`.
Evita guardar un pedido de un cliente que no existe.

**¿Qué relaciones hay?**
- **1 a muchos:** un cliente tiene muchos pedidos; un pedido tiene muchos `DETALLE_PEDIDO`.
- **Muchos a muchos:** productos ↔ ingredientes, resuelto con la tabla intermedia **`RECETA`**.
- **1 a 1:** un pedido tiene una sola `RESENA` (`id_pedido UNIQUE`).

**¿Qué es `ON DELETE CASCADE`?**
Si borras el padre, se borran los hijos. Ej.: borrar un pedido borra su detalle.
**`ON DELETE SET NULL`:** el hijo se queda, pero la columna queda vacía (ej. `MOVIMIENTO_INVENTARIO.id_pedido`).

**¿Qué es `UNIQUE`?**
No deja repetir. Ej.: el correo y el teléfono; `UNIQUE (id_admin, fecha)` en `REPORTE_CAJA` = un cierre por admin por día.

**¿Qué es `ENUM`?**
Una columna que solo acepta ciertos valores. Ej.: `PEDIDO.estado` solo puede ser
`esperando_pago, pendiente, en_preparacion, listo, en_camino, entregado, cancelado`.

**¿Por qué el dinero es `DECIMAL(10,2)` y no `FLOAT`?**
`DECIMAL` es exacto; `FLOAT` puede dar errores de centavos.

**¿Qué es un trigger y hay alguno?**
Código que MySQL corre solo. Hay uno: `trg_pedido_pin`, que **genera el PIN de entrega** de 4 dígitos
antes de insertar cada pedido.

**¿Por qué el descuento de inventario no es un trigger?**
Porque si no hay stock hay que rechazar la venta con un mensaje claro, y eso se controla mejor en PHP
con una transacción.

**¿Qué es normalizar? ¿Está normalizada?**
Separar datos para no repetirlos. Sí: las categorías van en `CATEGORIA` (no se repite el texto en cada
producto), la receta en `RECETA`, los cambios a una hamburguesa en `PERSONALIZACION`.

**¿Por qué 4 tablas de usuarios y no una?**
Cada rol tiene datos distintos (el domiciliario tiene vehículo y ubicación, la cocina turno, el cliente
puntos y cumpleaños). `Auth` busca el correo en las 4.

**¿Qué es `utf8mb4` e InnoDB?**
`utf8mb4` = guarda tildes, ñ y emojis. InnoDB = el motor que permite llaves foráneas y transacciones.

**¿Para qué es `CONFIGURACION_SISTEMA`?**
Una sola fila con los ajustes de la tienda: horario, tarifa de domicilio, margen, puntos, datos del negocio.

---

## 5. SQL: consultas

| Pregunta | Respuesta |
|---|---|
| `SELECT` | Leer. `SELECT * FROM PRODUCTO WHERE estado = 'activo'` |
| `INSERT` | Crear. `INSERT INTO PRODUCTO (...) VALUES (?, ?, ...)` |
| `UPDATE` | Cambiar. `UPDATE PEDIDO SET estado = 'listo' WHERE id_pedido = ?` |
| `DELETE` | Borrar. `DELETE FROM PRODUCTO WHERE id_producto = ?` |
| `JOIN` | Une tablas. `PRODUCTO p JOIN CATEGORIA c ON c.id_categoria = p.id_categoria` |
| `WHERE` | Filtra filas. |
| `ORDER BY ... DESC` | Ordena (DESC = de mayor a menor / más nuevo primero). |
| `LIMIT 1` | Solo una fila. |
| `LIKE '%x%'` | Busca un texto parecido (lo usa `Auth` para entrar solo con el usuario). |
| `COUNT`, `SUM` | Contar / sumar (los usa el cierre de caja). |
| `NOW()`, `INTERVAL 15 MINUTE` | La hora actual / sumar o restar tiempo. |
| `FOR UPDATE` | Bloquea la fila mientras dura la transacción, para que dos personas no la cambien a la vez. |
| `BEGIN / COMMIT / ROLLBACK` | Transacción: empezar / guardar todo / deshacer todo. |

**¿Por qué `prepare` + `?` y no meter la variable en el texto?**
Para evitar la **inyección SQL**. Ej.: si alguien escribe `' OR 1=1 --` en el correo, con `?` se trata
como texto y no como código.

**Ejemplo de transacción en el proyecto:**
Al crear un pedido se guarda `PEDIDO`, `DETALLE_PEDIDO`, `PERSONALIZACION` y se descuenta `INGREDIENTE`.
Si cualquiera falla (ej. no hay stock), `rollback` deshace todo y no queda un pedido a medias.

**¿Qué es `FOR UPDATE` en un caso real?**
Dos domiciliarios pulsan "tomar pedido" a la vez. `FOR UPDATE` bloquea la fila: el primero lo toma, el
segundo recibe *"Este pedido ya no está disponible para reparto"*.

---

## 6. Peticiones HTTP, rutas y respuestas

**¿Qué es una API?**
Direcciones que devuelven datos (JSON) en vez de páginas. Aquí todas empiezan con `/api/`.

**¿Qué es REST y los métodos?**

| Método | Para | Ejemplo |
|---|---|---|
| `GET` | leer | `GET /api/orders` |
| `POST` | crear | `POST /api/products` |
| `PUT` | editar todo | `PUT /api/products/{id}` |
| `PATCH` | cambiar una parte | `PATCH /api/orders/{id}/ready` |
| `DELETE` | borrar | `DELETE /api/products/{id}` |

**¿Qué códigos de respuesta usa?**

| Código | Significa | Cuándo |
|---|---|---|
| 200 | OK | todo bien |
| 201 | Creado | se creó algo (`store()`) |
| 204 | Sin contenido | respuesta a `OPTIONS` |
| 304 | No cambió | `/api/sync` cuando nada cambió (ETag) |
| 400 | Petición mala | error general |
| 401 | No autenticado | sin sesión |
| 403 | Prohibido | otro rol |
| 404 | No encontrado | ruta o registro no existe |
| 405 | Método no permitido | la ruta existe con otro método |
| 419 | CSRF inválido | token malo o vencido |
| 422 | Datos inválidos | falta un campo o regla del negocio |
| 500 | Error del servidor | error de PHP o SQL |

**¿Qué es JSON?**
Un formato de texto para mandar datos: `{"id": 5, "name": "Clásica", "price": 18000}`.

**¿Qué es `{id}` en una ruta?**
Un espacio que cambia. En `/api/products/7`, `{id}` = 7. Llega al controlador en `$_GET['id']`.

**¿Qué hace `.htaccess`?**
Le dice a Apache: los archivos de React (`assets/`), las fotos (`uploads/`) y el `manifest`/`sw.js`
se sirven tal cual; **todo lo demás** va a `public/index.php`.

**¿Qué diferencia hay entre `rutas.php` y `paginas.php`?**
`rutas.php` = API (JSON). `paginas.php` = páginas que abre el navegador (HTML).

---

## 7. React y la pantalla (frontend)

**¿Qué es React?**
Una librería de JavaScript para hacer pantallas con **componentes** (piezas reutilizables, ej. `Navbar`, `ConfirmDialog`).

**¿Qué es TypeScript?**
JavaScript con **tipos**: avisa antes de ejecutar si mandas un texto donde va un número. Archivos `.ts` / `.tsx`.

**¿Qué es Vite?**
La herramienta que **compila** React. `npm run build` lo deja listo en `public/assets/`. `npm run dev` lo
corre en modo desarrollo (puerto 3000).

**¿Qué es Tailwind?**
Estilos con clases cortas en el HTML: `class="bg-orange-500 p-4 rounded"`.

**¿Cómo sabe React qué pantalla mostrar?**
PHP pone `<div id="app" data-pagina="admin">` en `views/layouts/cabecera.php`. `src/main.tsx` lee
`data-pagina` y monta el componente (`AdminDashboard`, `ClientDashboard`…). No usa React Router: cada
página es una carga normal.

**¿Qué es zustand / el "store"?**
El lugar donde React guarda los datos en memoria (productos, pedidos, personal…) para que todas las
pantallas los compartan: `src/store/almacenAplicacion.ts` (`useStore`).

**¿Qué es un hook? ¿Cuáles usa?**
Funciones de React que empiezan con `use`: `useState` (guardar un valor), `useEffect` (hacer algo al
cargar), `useRef`, y propios como `useForm` (`src/hooks/useForm.ts`) y `useStore`.

**¿Qué es un contexto?**
Datos que comparten muchos componentes sin pasarlos uno por uno. Aquí: `ThemeContext` (tema claro/oscuro).

**¿Cómo se mantiene la pantalla al día?**
`SyncDatos.tsx` pregunta a `/api/sync` cada **2,5 s** (si hay cambios), **6 s** (si nada cambia) o
**20 s** (si la pestaña está oculta). Esto se llama **polling**.

**¿Qué es el ETag / 304?**
Una "huella" de los datos. React manda la última huella (`If-None-Match`); si nada cambió, PHP responde
**304** sin datos, y se ahorra internet.

**¿Qué hace cada pantalla?**

| Pantalla | Archivo |
|---|---|
| Inicio | `src/pages/Landing.tsx` |
| Login / Registro / Recuperar | `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx` |
| Admin | `AdminDashboard.tsx` + `src/pages/admin/*Section.tsx` |
| Cliente | `ClientDashboard.tsx` + `src/pages/client/*` (catálogo, armar hamburguesa, carrito, pago, historial, perfil) |
| Cocina | `KitchenDashboard.tsx` |
| Domiciliario | `DeliveryDashboard.tsx` |
| Pagar por link | `PagarPedido.tsx` |

**¿Cómo funciona el mapa?**
Con **Leaflet** (`react-leaflet`) y mapas de **OpenStreetMap**. Las rutas las calcula **OSRM** y las
direcciones se convierten en coordenadas con **Nominatim** (están permitidos en la CSP).

**¿Y las gráficas y el PDF?**
Gráficas con **recharts** (tablero del admin). El PDF del cierre con **jsPDF** (`src/utils/generarCierrePdf.ts`).

**¿Qué es la PWA / `manifest.json` / `sw.js`?**
Hace que la página se pueda "instalar" como app en el celular. `sw.js` (service worker) recibe las
notificaciones push aunque la página esté cerrada.

---

## 8. Cómo se comunican React y PHP

**¿Cómo pide React los datos?**
Con `fetch` en `src/servicios/api.ts`, a `/api/...`, con `credentials: 'include'` (manda la cookie de
sesión) y la cabecera `X-CSRF-Token`.

**¿Cómo le llegan a React los primeros datos sin pedirlos?**
PHP los mete en la página: `window.__DATOS__` (usuario, rol, `csrfToken`, ajustes) y `window.__APP_BASE__`
(la carpeta base). Lo hace `views/layouts/cabecera.php`.

**¿Cómo sabe PHP quién hace la petición?**
Por la **cookie de sesión** que el navegador manda sola. PHP la usa para leer `$_SESSION`.

**¿Qué pasa si el token CSRF vence?**
PHP responde 419; `api.ts` pide uno nuevo a `/api/auth/csrf` y repite la petición solo.

**¿PHP devuelve HTML o JSON?**
Las páginas → HTML (que carga React). La API → JSON.

---

## 9. Seguridad

Ver también [09 — Seguridad](09-seguridad.md).

| Pregunta | Respuesta |
|---|---|
| ¿Cómo se guardan las contraseñas? | Cifradas con `password_hash()`; se revisan con `password_verify()`. Nunca en texto plano. |
| ¿Y el PIN? | También cifrado (`password_hash`). |
| ¿Cómo se evita la inyección SQL? | Consultas preparadas: `prepare` + `?` + `bind_param`. |
| ¿Qué es CSRF y cómo se evita? | Que otra página haga acciones a tu nombre. Se evita con un token secreto (`X-CSRF-Token`) que revisa `verificarCsrf()`. |
| ¿Qué es XSS y cómo se evita? | Meter código JavaScript en la página. React escapa los textos solo; PHP usa `htmlspecialchars()` y `JSON_HEX_TAG`. Además la cabecera **CSP**. |
| ¿Cómo se controla quién entra a qué? | Cada ruta tiene sus roles en `config/rutas.php`; lo revisa `requiereRol()`. |
| ¿Cómo se evita que adivinen la clave? | `IntentoLogin`: **5 intentos fallidos en 1 minuto** bloquean (se desbloquea solo). |
| ¿Cuánto dura la sesión? | 120 minutos (`Session::DURACION_MINUTOS`). |
| ¿Qué es `session_regenerate_id`? | Cambia el id de sesión al entrar, para que no sirva uno robado. |
| ¿Si desactivan una cuenta, sale de una vez? | Sí. `Auth::usuarioActual()` revisa la cuenta en cada petición. |
| ¿Cuánto dura el código de recuperación? | 15 minutos, y se cuentan los intentos. |
| ¿Puede el cliente cambiar el precio en el navegador? | No sirve: el **servidor** recalcula el total con los precios de la base de datos. |
| ¿Cómo se valida una foto subida? | Máximo **5 MB** y solo JPG, PNG, WEBP o GIF, revisando el tipo real del archivo (`finfo`), no el nombre. |
| ¿Qué cabeceras de seguridad hay? | `X-Content-Type-Options`, `X-Frame-Options: DENY` (no se puede meter en un iframe), `Referrer-Policy`, `Content-Security-Policy`. Las pone `configurarSeguridadHttp()`. |
| ¿Se muestran los errores al usuario? | Solo con `debug = true` (`config/app.php`). En producción va en `false`. |
| ¿Cómo confirma la entrega? | Con el **PIN de entrega** de 4 dígitos que tiene el cliente; se compara con `hash_equals`. |
| ¿Qué es `hash_equals`? | Compara dos textos sin dar pistas por el tiempo que tarda (más seguro que `===`). |
| ¿Algo que mejorar? | Sí: la clave de Gmail y la llave privada VAPID están escritas en el código; deberían ir fuera del repositorio. Y usar HTTPS en un servidor real. |

---

## 10. Roles, usuarios y login

**¿Qué roles hay?** `admin`, `kitchen`, `delivery`, `client` (+ programador, que solo usa la consola).

**¿Cómo inicia sesión?**
`Login.tsx` → `POST /api/auth/login` → `AuthController::login()` → `Auth::intentarLogin()` busca el correo
en las 4 tablas, revisa la clave y guarda `usuario_id` y `usuario_rol` en `$_SESSION`.

**¿Cómo entra cocina y domiciliario?**
Con correo + contraseña, o con **usuario + PIN** (`Auth::intentarLoginConPin()`). Se puede escribir solo
lo que va antes de la `@`.

**¿Quién crea a quién?**
El cliente se registra solo. El admin crea a cocina y domiciliarios (`StaffController`). El primer admin
se crea con `php sql/create-admin.php`.

**¿Cómo se recupera la contraseña?**
`ForgotPassword.tsx` → se crea un código (`CodigoVerificacion`, 15 min) → se manda por correo
(`CorreoService` + Gmail) → el cliente lo escribe con su clave nueva.

**¿Cómo cierra sesión?**
`POST /api/auth/logout` → `Auth::logout()` → `Session::destroy()`.

**¿Puede un cliente ver pedidos de otro?**
No. `Pedido::porRol()` filtra por el id de la sesión, y `ClientController` compara el `{id}` con `Auth::id()`.

---

## 11. Pedidos (de principio a fin)

Ver [06 — Ciclo de un pedido](06-ciclo-de-un-pedido.md).

**¿Cuáles son los estados?**
`esperando_pago → pendiente → en_preparacion → listo → en_camino → entregado` (o `cancelado`).

**¿Quién cambia cada estado?**

| Estado | Lo pone | Ruta |
|---|---|---|
| `pendiente` | el cliente al pedir | `POST /api/orders` |
| `en_preparacion` | cocina / admin | `PATCH /api/orders/{id}/preparing` |
| `listo` | cocina / admin | `PATCH /api/orders/{id}/ready` |
| (asignado) | domiciliario | `PATCH /api/orders/{id}/take` |
| `en_camino` | domiciliario | `PATCH /api/orders/{id}/accept` |
| `entregado` | domiciliario con PIN | `PATCH /api/orders/{id}/deliver` |
| `esperando_pago` | admin (pedido manual con link) | `POST /api/orders/manual` |
| `cancelado` | el sistema (link vencido a los 30 min) | automático |

**¿Qué pasa cuando el cliente crea un pedido?** (`PedidoService::crear()`)
1. Revisa que la tienda esté abierta y no en pausa.
2. Revisa que haya ítems y que el cliente exista.
3. **Recalcula** el total en el servidor (precios, domicilio, cumpleaños, puntos).
4. Si es pago digital, revisa que el pago esté aprobado.
5. En una **transacción**: guarda el pedido, el detalle, la personalización y **descuenta el inventario**.
6. MySQL le pone el PIN de entrega (trigger).

**¿Qué pasa si la tienda está cerrada?**
Error: *"La tienda está cerrada o pausada en este momento"*.

**¿Qué es la personalización?**
El cliente puede **quitar** o **agregar** ingredientes (o armar su hamburguesa en `BuilderSection`).
Se guarda en `PERSONALIZACION` (`accion_modificacion = quitar / agregar`). La hamburguesa armada usa un
producto oculto: "Hamburguesa Personalizada".

**¿Qué es un pedido manual?**
El admin registra un pedido que llegó por llamada o WhatsApp (`canal_origen`). Puede ser para alguien
sin cuenta (`id_cliente = NULL`) y puede mandarle un **link de pago** (`/pagar?c=código`).

**¿Qué pasa al entregar?** (`confirmarEntrega()`)
Revisa que sea su pedido y que esté `en_camino`, compara el PIN, marca `entregado` y pago `aprobado`,
suma puntos y total gastado al cliente, y le manda una notificación push.

**¿Qué pasa si dos domiciliarios toman el mismo pedido?**
`FOR UPDATE` bloquea la fila: solo uno lo consigue.

**¿Puede soltar un pedido?**
Sí, si aún no lo ha iniciado (`release`). Vuelve a `listo` sin domiciliario.

**¿El cliente puede calificar?**
Sí, al final (`review`), una vez por pedido (tabla `RESENA`).

---

## 12. Inventario y recetas

**¿Cómo se descuenta el inventario?**
Al crear el pedido, `Ingrediente::descontarPorReceta()` resta la receta de cada producto (menos lo que
quitó el cliente, más los extras y la bolsa de empaque). Cada resta queda en `MOVIMIENTO_INVENTARIO` como "salida".

**¿Y si no hay stock?**
Se rechaza la venta con el mensaje *"Sin stock suficiente de "Pan" (disponible: 2, requerido: 3)"* y la
transacción se deshace (no se guarda el pedido).

**¿Y si se cancela el pedido?**
`devolverDePedido()` devuelve lo descontado (una "entrada").

**¿Qué tipos de movimiento hay?** `entrada`, `salida`, `ajuste`.

**¿Qué es el stock crítico?**
Cuando un insumo queda con **10 o menos**, el admin lo ve en rojo como "ítem crítico" en Inventario
(`InventorySection.tsx`). En la base de datos también existe `umbral_stock_critico_default` (10), pero la
pantalla hoy usa el 10 fijo.

**¿Qué tipos de categoría hay?** `menu`, `insumo_alimenticio`, `empaque_desechable` (columna `ambito`).

---

## 13. Pagos

Ver [10 — Pagos](10-pagos.md).

**¿Qué formas de pago hay?** Efectivo y digital (Nequi, Daviplata, Bancolombia).

**¿Es una pasarela real?**
No, es una **pasarela de prueba** que imita a Wompi. Celular `3991111111` = aprobado, `3992222222` =
rechazado, `3993333333` = error.

**¿Cómo se protege el pago?**
El servidor calcula el total, firma con **HMAC** para que no cambien el monto, cada transacción sirve
para un solo pedido y se revisa otra vez antes de crear el pedido.

**¿Dónde se guarda?** Tabla `PAGO_TRANSACCION` (lo maneja `PagoService`).

**¿Cuándo queda pagado el efectivo?** Al confirmar la entrega con el PIN.

**¿Qué es el link de pago?**
Un enlace con un código de 32 caracteres al azar para un pedido manual. Dura 30 minutos; si no se paga,
el pedido se cancela y se devuelve el inventario.

---

## 14. Cierre de caja

**¿Qué es?**
El resumen del día: ventas, pedidos, cuánto debe entregar cada domiciliario y cuánto inventario se gastó.

**¿Cómo funciona?**
`AdminDashboard` → `GET /api/cash-closing/preview` (ver antes) → `POST /api/cash-closing` (guardar)
→ `CashClosingController` → `CajaService` → `Caja` → tablas `REPORTE_CAJA`, `LIQUIDACION_DOMICILIARIO`,
`DETALLE_AUDITORIA`. Los pedidos quedan archivados con `id_reporte`. Se descarga un PDF (jsPDF).

**¿Se puede hacer dos veces el mismo día?**
No: *"Ya se generó un cierre de caja hoy para este administrador"* (y `UNIQUE (id_admin, fecha)`).

**¿Qué es la auditoría de inventario?**
Compara lo que **debió** gastarse según las recetas (consumo teórico) con el stock real.

---

## 15. Puntos, cumpleaños y descuentos

| Pregunta | Respuesta |
|---|---|
| ¿Cuántos puntos se ganan? | 1 punto por cada $1.000 del total (`floor(total / 1000)`). |
| ¿Cuándo se suman? | Al **entregar** el pedido, no al crearlo. |
| ¿Cuánto vale un punto? | `valor_punto` en Ajustes (por defecto $10). |
| ¿Desde cuántos puntos se canjea? | `minimo_puntos_canje` (por defecto 100). |
| ¿Descuento de cumpleaños? | **15%** del subtotal si hoy es el cumpleaños del cliente (`fecha_nacimiento`). |
| ¿Dónde se calcula todo? | En `PedidoService` (servidor), nunca en React. |
| ¿Y el domicilio? | Tarifa plana (`tarifa_plana_domicilio` en Ajustes). |

---

## 16. Notificaciones, correo y WhatsApp

Ver [11 — Notificaciones y correo](11-notificaciones-y-correo.md).

**¿Cómo llega la notificación al celular?**
El cliente acepta → `src/lib/pushNotifications.ts` suscribe el navegador con la llave pública VAPID →
`POST /api/push/subscribe` guarda la suscripción (`PUSH_SUSCRIPCION`). Al entregar,
`PushNotificationService` cifra el aviso con `openssl`, lo firma con la llave VAPID privada y lo manda con
`curl` al servicio push del navegador; `public/sw.js` lo muestra.

**¿Qué son las llaves VAPID?**
Un par de llaves: la pública la usa el navegador, la privada firma los avisos en el servidor.

**¿Cómo se manda el correo?**
`CorreoService` se conecta directo al **SMTP de Gmail** (puerto 587, TLS) con `stream_socket_client()` y le
manda los comandos `EHLO`, `STARTTLS`, `AUTH LOGIN`, `MAIL FROM`, `RCPT TO`, `DATA`, `QUIT`. Sin librerías.

**¿Por qué no usan PHPMailer ni Composer?**
Para que todo sea PHP plano como en clase, sin carpeta `vendor/`. Las funciones `openssl`, `curl` y
`stream_socket_client` ya vienen en PHP.

**¿Y WhatsApp?**
No hay API: `src/utils/mensajesWhatsApp.ts` abre `https://wa.me/<número>?text=<mensaje>` con el mensaje
ya escrito, y la persona lo envía.

**¿Qué guarda la tabla `NOTIFICACION`?**
El registro de cada aviso enviado al pedido y si salió bien (`enviado` / `fallido`).

---

## 17. Instalación y herramientas

Ver [02 — Instalación](02-instalacion.md) y [14 — Comandos](14-comandos.md).

| Pregunta | Respuesta |
|---|---|
| ¿Qué es Laragon? | Un programa que trae Apache, MySQL y PHP listos para trabajar en el computador. |
| ¿Qué es Apache? | El servidor web: recibe las direcciones y ejecuta PHP. |
| ¿Usa Composer? | No. Composer es el instalador de librerías de PHP, pero este proyecto no necesita ninguna. |
| ¿Qué es npm? | El instalador de librerías de JavaScript. `npm install` crea `node_modules/`. |
| ¿Cómo se compila React? | `npm run build` (deja todo en `public/assets/`). |
| ¿Cómo se crea la base de datos? | Importar `sql/schema.sql` y luego `sql/seed.sql` (datos de prueba). |
| ¿Cómo se crea el primer admin? | `php sql/create-admin.php`. |
| ¿Qué versión de PHP necesita? | 8.1 o más, con las extensiones `mysqli`, `openssl`, `curl` y `mbstring` (Laragon las trae prendidas). |
| ¿Qué es git? | El control de versiones: guarda el historial de cambios (`git add`, `git commit`, `git push`). |
| ¿Qué es `.gitignore`? | Lista de lo que git no sube (`vendor/`, `node_modules/`…). |
| ¿Qué es `package.json`? | La lista de librerías de React y los comandos (`npm run build`). |

---

## 18. "¿Qué haces si…?" (errores)

Ver [13 — Problemas comunes](13-problemas-comunes.md) y [15 — Si algo deja de funcionar](15-si-algo-deja-de-funcionar.md).

| Si… | Revisas… |
|---|---|
| Sale *"Error de Conexion"* | Que MySQL esté encendido en Laragon y los datos de `config/database.php`. |
| Sale *"Unknown database"* | Que importaste `sql/schema.sql`. |
| La página sale en blanco | Que corriste `npm run build` (falta `public/assets/main.css`). |
| 404 en una acción | Que la ruta esté en `config/rutas.php` y el `elseif` en el controlador. |
| 401 | Que hayas iniciado sesión (o que la sesión no haya vencido). |
| 403 | Que el rol tenga permiso en `config/rutas.php`. |
| 419 | El token CSRF; recargar la página. |
| 422 | El mensaje dice qué dato falta o qué regla no se cumple. |
| *"Class 'X' not found"* | Falta un `require_once` del modelo. |
| *"Call to a member function prepare() on null"* | Falta `global $conn;` en el constructor del modelo. |
| *"Table doesn't exist"* | El nombre de la tabla en el SQL o que falta importar el schema. |
| *"Data too long for column"* | El dato es más grande que la columna (ej. `VARCHAR(255)`). |
| No llega el correo | Clave de aplicación de Gmail en `CorreoService`. |
| No llega la notificación | Que el cliente aceptó notificaciones y que el navegador lo permita. |
| No puedo pedir | Que la tienda esté abierta (horario y "pausa de emergencia" en Ajustes). |
| "No hay stock" | Sumar stock en Inventario. |

**¿Cómo buscas un error?**
1. Leer el mensaje (dice archivo y línea). 2. Abrir la consola del navegador (F12 → Red/Network) y ver
la respuesta de `/api/...`. 3. Seguir el camino: ruta → controlador → modelo → tabla.

---

## 19. "¿Cómo agregarías…?" (cambios)

Ver [12 — Cómo hacer cambios](12-como-hacer-cambios.md).

**…un campo nuevo (ej. "descripción corta" en producto)?**
1. `ALTER TABLE PRODUCTO ADD ...` (y en `sql/schema.sql`). 2. En `models/Producto.php` agregarlo al
`INSERT`/`UPDATE` (y al `bind_param`). 3. En `views/json/producto.php` mandarlo a React. 4. En React
mostrarlo/editarlo (`MenuSection.tsx`).

**…una ruta nueva?**
1. Línea en `config/rutas.php`. 2. Método en el controlador. 3. `elseif ($accion === '...')` al final del
controlador. 4. Llamarla desde React con `api.post/get(...)`.

**…una tabla nueva?**
1. `CREATE TABLE` en `sql/schema.sql`. 2. Un modelo nuevo en `models/` (con `global $conn;`).
3. Un controlador que lo use (`require_once` + `new`). 4. Sus rutas.

**…un rol nuevo (ej. cajero)?**
Tabla (o columna) para el rol, agregarlo a `Auth::TABLAS`, a los roles de `config/rutas.php` y
`config/paginas.php`, una vista en `views/paginas/` y un componente en `src/pages/` (y en `PAGINAS` de `main.tsx`).

**…un estado nuevo del pedido?**
Agregarlo al `ENUM` de `PEDIDO.estado`, un método en `PedidoService`, una ruta `PATCH` y el botón en React.

---

## 20. "¿Por qué lo hicieron así?" (decisiones)

| Pregunta | Respuesta |
|---|---|
| ¿Por qué no Laravel? | Para entender cada línea: PHP MVC simple como lo enseñaron, sin "magia" de framework. |
| ¿Por qué `mysqli` y no PDO? | Es lo que se vio en clase y sirve igual con consultas preparadas. |
| ¿Por qué una sola conexión `global`? | Para no abrir una por modelo; todos comparten `$conn`. |
| ¿Por qué React y no solo PHP? | Para pantallas que se actualizan sin recargar (pedidos en vivo, mapa, carrito). |
| ¿Por qué polling y no WebSockets? | Es más simple con PHP y Apache; con ETag/304 casi no gasta. |
| ¿Por qué salieron de Firebase? | Para tener la base de datos relacional propia (MySQL) y la lógica en el servidor. |
| ¿Por qué la foto no va en la base de datos? | Pesa mucho; se guarda en `public/uploads/` y en la base de datos solo la dirección. |
| ¿Por qué el total lo calcula el servidor? | Porque en el navegador se puede cambiar. |
| ¿Por qué transacciones? | Para que nunca quede algo a medias (pedido sin inventario descontado, cierre incompleto). |
| ¿Por qué el PIN de entrega? | Para probar que el pedido se entregó a la persona correcta. |
| ¿Por qué `Pedido` y `PedidoService` separados? | Leer es simple; las reglas del negocio son grandes. Así cada archivo tiene una sola tarea. |
| ¿Por qué IDs numéricos y no UUID? | Más simples; MySQL los pone solo (`AUTO_INCREMENT`). |

---

## 21. Preguntas trampa

- **¿React se conecta a MySQL?** No. Solo a la API PHP.
- **¿El controlador tiene SQL?** No. El SQL está en los modelos.
- **¿Cuántas conexiones hay a la base de datos?** Una por petición (`$conn`).
- **¿Dónde se valida el rol, en React o en PHP?** En **PHP** (`requiereRol`). React solo esconde botones; eso no es seguridad.
- **¿Las contraseñas se pueden ver en la base de datos?** No, están cifradas; ni el admin las ve.
- **¿Se puede "descifrar" `password_hash`?** No. Solo se compara con `password_verify`.
- **¿`GET /api/sync` es pública, eso es un riesgo?** No: dentro revisa la sesión y solo manda lo que ese rol puede ver.
- **¿Si borro un cliente se borran sus pedidos?** No: `PEDIDO.id_cliente` no tiene `CASCADE`; MySQL no deja borrarlo si tiene pedidos.
- **¿Los puntos se ganan al pedir?** No, al **entregar**.
- **¿Quién genera el PIN de entrega, PHP o MySQL?** MySQL, con el trigger `trg_pedido_pin`.
- **¿`require_once` crea el objeto?** No. Solo trae el archivo; el objeto lo crea `new`.
- **¿Qué se ejecuta primero, `index.php` o el controlador?** `index.php`, siempre.

---

## 22. Mapa rápido: "¿dónde está…?"

| Busco… | Está en… |
|---|---|
| La conexión a MySQL | `config/database.php` |
| La primera línea que corre | `public/index.php` |
| La lista de direcciones de la API | `config/rutas.php` |
| La lista de páginas | `config/paginas.php` |
| Revisar sesión, rol y CSRF | `config/helpers.php` (`requiereRol`, `verificarCsrf`) |
| El login | `controllers/AuthController.php` + `models/Auth.php` |
| Crear un pedido | `models/PedidoService.php` → `crear()` |
| Descontar inventario | `models/Ingrediente.php` → `descontarPorReceta()` |
| El cierre de caja | `models/CajaService.php` |
| Los pagos | `models/PagoService.php` |
| El correo | `models/CorreoService.php` |
| Las notificaciones | `models/PushNotificationService.php` + `public/sw.js` |
| El diseño de la base de datos | `sql/schema.sql` |
| Cómo React llama a PHP | `src/servicios/api.ts` |
| Los datos en memoria de React | `src/store/almacenAplicacion.ts` |
| Qué pantalla mostrar | `src/main.tsx` |
| La actualización automática | `src/components/SyncDatos.tsx` + `controllers/SyncController.php` |
| Los horarios, tarifas y puntos | tabla `CONFIGURACION_SISTEMA` + `models/Configuracion.php` |
