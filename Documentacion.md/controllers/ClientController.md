# controllers/ClientController.php

## ¿Para qué sirve?
Maneja los datos de los **clientes**: el directorio para el admin, el perfil del cliente ("Mi
Perfil"), el cambio de contraseña y las notificaciones.

## ¿Con qué se conecta?
| Ruta | Método | Quién | React |
|---|---|---|---|
| `PUT /api/clients/{id}` | `update` | dueño o admin | `almacenAplicacion.ts` (`updateClient`) ← `ClientDashboard.tsx` (perfil y carrito) y `context/ThemeContext.tsx` (tema claro/oscuro) |
| `PUT /api/clients/{id}/password` | `changePassword` | solo el cliente | `almacenAplicacion.ts` (`changeClientPassword`) ← `ClientDashboard.tsx` |

- **Modelo:** `Cliente`.
- **Auth:** para saber si quien pide es el dueño de la cuenta o un admin.

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| `$id` | `{id}` de la ruta | El cliente al que se refiere la petición. |
| `$notifId` | `{notifId}` de la ruta | La notificación que se marca como leída. |
| `$this->datos` | `entrada()` | Campos a cambiar (`name`, `email`, `cart`, `preferences`...). |
| `$permitidos` | Lista fija | Campos que un **cliente** puede cambiar de sí mismo. |

## El método privado `autorizarPropioOAdmin($id)`
```php
$esPropio = Auth::rol() === 'client' && (string) Auth::id() === (string) $id;
$esAdmin  = Auth::rol() === 'admin';
if (!$esPropio && !$esAdmin) {
    responderError('No autorizado para este recurso.', 403);
}
```
- Un cliente solo puede ver/editar **su propia** cuenta (`Auth::id()` igual al `$id` de la ruta).
- El admin puede ver cualquiera.
- `(string)` convierte ambos a texto para compararlos bien (uno puede ser número y el otro texto).
- Sin sesión → **401**. Con sesión pero sin permiso → **403**.

## Acciones
- **`update`**:
  ```php
  if (Auth::rol() !== 'admin') {
      $permitidos = ['name', 'email', 'phone', 'address', 'birthday', 'cart', 'preferences'];
      $soloPermitidos = [];
      foreach ($permitidos as $campo) {
          if (array_key_exists($campo, $this->datos)) {
              $soloPermitidos[$campo] = $this->datos[$campo];
          }
      }
      $this->datos = $soloPermitidos;
  }
  ```
  - El `foreach` recorre la lista de campos permitidos y copia solo los que llegaron.
  - Así en `$this->datos` quedan **solo** esas claves y un cliente no puede cambiarse sus puntos (`points`) ni el total gastado.
  - Si el correo nuevo ya lo usa otra cuenta → **409**.
- **`changePassword`**: solo el propio cliente. Revisa la contraseña actual con `password_verify` y guarda la nueva cifrada con `password_hash`.

## ¿Qué pasa si se borra?

Este archivo lo carga `cargarControlador()` (`config/helpers.php`) cuando llega una de sus rutas.
Si algo se borra, el error aparece en la pantalla como aviso rojo y completo en
**F12 → Red → la petición → Respuesta**.

| Si se borra… | Qué deja de funcionar | Error que aparece |
|---|---|---|
| **El archivo completo** | Todas sus rutas: `PUT /api/clients/{id}`, `PUT /api/clients/{id}/password`. | `Failed to open stream: No such file or directory` (…`controllers/ClientController.php`) |
| La línea `require_once __DIR__ . '/../models/Cliente.php';` | **Todas** sus rutas (el modelo se crea en el constructor, que corre en cada acción). | `Class "Cliente" not found` |
| El método `update()` | Cliente → Mi Perfil (y el carrito/tema guardado): no se guardan los cambios. Admin → Clientes: no se puede editar un cliente. | `Call to undefined method ClientController::update()` (500) |
| La rama `$accion === 'update'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/clients/{id}'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método `changePassword()` | Cliente → Mi Perfil: no se puede cambiar la contraseña. | `Call to undefined method ClientController::changePassword()` (500) |
| La rama `$accion === 'changePassword'` del despachador (al final) | Lo mismo. | `Ruta no encontrada.` (404) |
| La línea `'PUT /api/clients/{id}/password'` de `config/rutas.php` | Lo mismo. | `Ruta no encontrada.` (404) o `Metodo no permitido.` (405) |
| El método privado `autorizarPropioOAdmin()` | `PUT /api/clients/{id}`. | `Call to undefined method ClientController::autorizarPropioOAdmin()` (500) |
| La línea `$this->clienteModel = ...` del constructor | Las acciones que usan `$this->clienteModel`. | `Call to a member function ...() on null` o `Undefined property` |
| La línea `$this->datos = ...` del constructor | Las acciones que usan `$this->datos`. | `Call to a member function ...() on null` o `Undefined property` |

**Cómo se arregla:** volver a escribir lo que se borró. La ficha de arriba ("Código explicado") muestra cómo era.
