# 12. Cómo hacer cambios

Recetas para los cambios más comunes.

## Regla de oro: ¿hay que compilar?
| Cambiaste | Hay que... |
|---|---|
| PHP (`config/`, `controllers/`, `models/`, `views/`) | Nada. Recarga la página. |
| React (`src/`) | `npm run build` y recargar (o trabajar con `npm run dev`). |
| Base de datos | Aplicar el cambio en MySQL **y** escribirlo en `sql/schema.sql`. |

---

## Agregar una ruta nueva a la API
Ejemplo: `GET /api/products/{id}/receta` para ver la receta de un producto.

**1. Registrar la ruta** en `config/rutas.php`:
```php
'GET /api/products/{id}/receta' => ['ProductController', 'receta', ['admin']],
```
(método y dirección → controlador, acción y roles que pueden usarla)

**2. Agregar el método** dentro de la clase `ProductController` (`controllers/ProductController.php`):
```php
public function receta()
{
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    $producto = $this->productoModel->buscar($id, true);
    if (!$producto) {
        responderError('Producto no encontrado.', 404);
    }
    responderJson($producto['ingredients']);
}
```
y llamarlo desde el despachador del final del archivo, antes del `else`:
```php
} elseif ($accion === 'receta') {
    $controller->receta();
```

**3. Si necesitas una consulta nueva**, agrégala como método en el modelo (`models/Producto.php`):
```php
public function contarRecetas($idProducto)
{
    $stmt = $this->conn->prepare("SELECT COUNT(*) AS total FROM RECETA WHERE id_producto = ?");
    $stmt->bind_param("i", $idProducto);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return (int) $row['total'];
}
```

**4. Llamarla desde React** (normalmente en `src/store/almacenAplicacion.ts`):
```ts
const receta = await api.get('/products/6/receta');
```

**Cuidado con el orden** en `rutas.php`: una ruta fija (`/preview`) debe ir **antes** que una con
`{id}`, o la palabra se tomaría como un id.

---

## Agregar un campo a un formulario (ej: "notas" del cliente)
1. **Base de datos:** `ALTER TABLE CLIENTE ADD notas VARCHAR(255) NULL;` y agregarlo a `schema.sql`.
2. **Modelo** (`Cliente.php`, método `actualizar()`): agregar `'notes' => 'notas'` al `$mapa`.
3. **JSON** (`views/json/cliente.php`): agregar `'notes' => $fila['notas'],`.
4. **React:** agregar `notes?: string` a la interface `Client` (`almacenAplicacion.ts`) y el campo en la pantalla.
5. `npm run build`.

---

## Cambiar una pantalla
1. Busca la pantalla en `src/pages/` (o la sección en `src/pages/admin/` y `src/pages/client/`). La documentación de cada una dice qué hace cada parte.
2. Para verla mientras cambias: Laragon encendido + `npm run dev` y abre `http://localhost:3000/?pagina=admin`.
3. Al terminar: `npm run build`.

Los estilos se escriben con clases de **Tailwind** dentro de `className` (`p-4`, `bg-orange-500`,
`dark:bg-stone-900`...). Los colores de la marca están en `src/index.css` (`--color-brand-orange`).

---

## Agregar una página nueva (ej: `/reportes` para el admin)
1. `config/paginas.php`: `'/reportes' => ['PaginaController', 'reportes', ['admin']],`
2. `PaginaController.php`: agregar el método `public function reportes() { $this->mostrar('reportes'); }`
   y su `elseif ($accion === 'reportes')` en el despachador del final.
3. Crear `views/paginas/reportes.php` copiando otra vista y poniendo `$pagina = 'reportes';`.
4. Crear `src/pages/Reportes.tsx` y registrarlo en `src/main.tsx` dentro de `PAGINAS`: `reportes: Reportes,`.
5. `npm run build`.

---

## Estilo del código PHP (para que todo se vea igual)
| Regla | Ejemplo |
|---|---|
| Comentario de bloque al inicio del archivo | `/** Controlador de Productos (menu). */` |
| `require_once` de lo que se usa | `require_once __DIR__ . '/../models/Producto.php';` |
| Controladores: una clase con un método por acción y el despachador al final | `if ($accion === 'index') { $controller->index(); } elseif (...) { ... }` |
| Modelos con `private $conn` y `global $conn` | ver `models/Cliente.php` |
| Consultas completas: `prepare`, `bind_param`, `execute`, `get_result`, `close` | |
| Llave `{` de clases y funciones en la línea siguiente | `class Cliente` ↵ `{` |
| Cerrar los archivos PHP con `?>` | |
| Respuestas con `responderJson()` / `responderError()` | `responderError('Producto no encontrado.', 404);` |

---

## Probar un cambio
1. **En el navegador:** F12 → **Red (Network)**: ahí se ve cada petición a `/api/...`, lo que se envió y lo que respondió PHP.
2. **Errores de PHP:** `C:\laragon\tmp\php_errors.log`.
3. **Errores de React:** F12 → **Consola**.
4. **Revisar la sintaxis de un PHP:** `php -l app\Controllers\ProductController.php`.
5. **Revisar errores de TypeScript:** `npm run lint`.

## Guardar los cambios en Git
```powershell
git status                 # qué archivos cambiaron
git diff                   # qué cambió exactamente
git add .
git commit -m "Descripción del cambio"
git push                   # subir a GitHub
```
