# views/json/personal.php
¿No entiendes una palabra? Mira el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

## ¿Para qué sirve?
Organiza los datos del personal antes de enviarlos a React.
Cambia los nombres de la base de datos a los que usa React (ej. `nombre` → `name`, `precio` → `price`).

## ¿Qué hace?
- organiza los datos de un ayudante de cocina
- organiza los datos de un domiciliario

## Sus funciones
| Función | Qué hace | La usan |
|---|---|---|
| `personal_cocina_a_json()` | organiza los datos de un ayudante de cocina | `Personal::comoJsonCocina()` |
| `personal_domicilio_a_json()` | organiza los datos de un domiciliario | `Personal::comoJsonDomicilio()` |

## ¿Con qué se conecta?
- **Lo carga:** `config/helpers.php` (en todas las peticiones).

## Línea por línea

Cada línea del archivo y lo que hace. Las palabras y símbolos están explicados en el [glosario](../../GuiasDelProyecto/Estructura&Glosario/GLOSARIO.md).

| # | Código | Qué hace |
|---|---|---|
| 1 | `<?php` | Abre el código PHP. |
| 2-4 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"Convierte filas de AYUDANTE_COCINA y DOMICILIARIO al JSON del personal."* |
| 6 | `function personal_cocina_a_json($fila)` | Función `personal_cocina_a_json($fila)`: organiza los datos de un ayudante de cocina. La usa `Personal::comoJsonCocina()` (en `models/Personal.php`). |
| 7 | `{` | Abre la función `personal_cocina_a_json()`. |
| 8 | `return [` | Devuelve una lista nueva con los nombres que usa React: |
| 9 | `'id' => (string) $fila['id_ayudante'],` | `'id'`: el número, como texto. |
| 10 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 11 | `'email' => $fila['correo'],` | `'email'`: el correo. |
| 12 | `'phone' => $fila['telefono'],` | `'phone'`: el teléfono. |
| 13 | `'role' => 'Ayudante de cocina',` | `'role'`: siempre `'Ayudante de cocina'`. |
| 14 | `'active' => (bool) $fila['activo'],` | `'active'`: si está activo (sí/no). |
| 15 | `'hasPin' => !empty($fila['pin']),` | `'hasPin'`: si ya tiene PIN para entrar (sí/no). |
| 16 | `'createdBy' => $fila['creado_por_nombre'] ?? null,` | `'createdBy'`: quién lo creó. Si no se sabe, `null`. |
| 17 | `];` | Cierra la lista. |
| 18 | `}` | Cierra la función `personal_cocina_a_json()`. |
| 20-23 | *(comentario)* | Comentario: no se ejecuta, solo explica. Dice: *"$currentOrderId y $destino ya vienen resueltos por el modelo (pedido 'en_camino' del domiciliario y las coordenadas que el ubico en su mapa)."* |
| 24 | `function personal_domicilio_a_json($fila, $currentOrderId, $destino = null)` | Función `personal_domicilio_a_json(...)`: organiza los datos de un domiciliario. La usa `Personal::comoJsonDomicilio()`. Recibe la fila, el pedido que lleva (`$currentOrderId`) y su destino (`$destino`). |
| 25 | `{` | Abre la función `personal_domicilio_a_json()`. |
| 26 | `$ubicacion = null;` | `$ubicacion` empieza en `null` (sin ubicación). |
| 27 | `if ($fila['ubicacion_lat'] !== null && $fila['ubicacion_lng'] !== null) {` | Si la fila tiene latitud **y** longitud... |
| 28 | `$ubicacion = [(float) $fila['ubicacion_lat'], (float) $fila['ubicacion_lng']];` | ...guarda la ubicación como una lista de dos números `[latitud, longitud]`. |
| 29 | `}` | Cierra el `if`. |
| 31 | `return [` | Devuelve una lista nueva: |
| 32 | `'id' => (string) $fila['id_domiciliario'],` | `'id'`: el número, como texto. |
| 33 | `'name' => $fila['nombre'],` | `'name'`: el nombre. |
| 34 | `'email' => $fila['correo'],` | `'email'`: el correo. |
| 35 | `'phone' => $fila['telefono'],` | `'phone'`: el teléfono. |
| 36 | `'role' => 'Domiciliario',` | `'role'`: siempre `'Domiciliario'`. |
| 37 | `'active' => (bool) $fila['activo'],` | `'active'`: si está activo. |
| 38 | `'hasPin' => !empty($fila['pin']),` | `'hasPin'`: si ya tiene PIN. |
| 39 | `'createdBy' => $fila['creado_por_nombre'] ?? null,` | `'createdBy'`: quién lo creó. |
| 40 | `'location' => $ubicacion,` | `'location'`: dónde está ahora (de arriba). Se ve en el mapa del administrador. |
| 41 | `'currentOrderId' => $currentOrderId !== null ? (string) $currentOrderId : null,` | `'currentOrderId'`: el pedido que lleva, como texto (o `null`). |
| 42 | `'destCoords' => $destino,` | `'destCoords'`: el destino de ese pedido en el mapa. |
| 43 | `'plate' => $fila['placa'],` | `'plate'`: la placa. |
| 44 | `'vehicle' => $fila['tipo_vehiculo'],` | `'vehicle'`: el tipo de vehículo. |
| 45 | `'vehicleModel' => $fila['modelo_vehiculo'],` | `'vehicleModel'`: el modelo del vehículo. |
| 46 | `'baseCash' => (float) $fila['base_efectivo_asignada'],` | `'baseCash'`: el dinero base que se le entregó. |
| 47 | `];` | Cierra la lista. |
| 48 | `}` | Cierra la función `personal_domicilio_a_json()`. |

## ¿Qué pasa si se borra?
| Si se borra… | Qué deja de funcionar | Error que sale |
|---|---|---|
| el archivo completo | **todo el sistema** (helpers.php no lo encuentra) | `Failed to open stream` |
| la función `personal_cocina_a_json()` | cargar los datos de todas las pantallas | `Call to undefined function personal_cocina_a_json()` |
| la función `personal_domicilio_a_json()` | cargar los datos de todas las pantallas | `Call to undefined function personal_domicilio_a_json()` |

**Cómo ver el error:** en el navegador, **F12 → Red → la petición en rojo → Respuesta**.
