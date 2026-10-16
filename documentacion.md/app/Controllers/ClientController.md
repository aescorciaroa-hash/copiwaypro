# app/Controllers/ClientController.php

## ¿Para qué sirve?
Maneja los datos de los **clientes**: el directorio para el admin, el perfil del cliente ("Mi
Perfil"), el cambio de contraseña y las notificaciones.

## ¿Con qué se conecta?
| Ruta | `$action` | Quién | React |
|---|---|---|---|
| `GET /api/clients` | `index` | admin | Llega por `/api/sync` (clave `clients`) → `admin/ClientsSection.tsx` |
| `GET /api/clients/{id}` | `show` | dueño o admin | — |
| `PUT /api/clients/{id}` | `update` | dueño o admin | `almacenAplicacion.ts` (`updateClient`) ← `ClientDashboard.tsx` (perfil y carrito) y `context/ThemeContext.tsx` (tema claro/oscuro) |
| `PUT /api/clients/{id}/password` | `changePassword` | solo el cliente | `almacenAplicacion.ts` (`changeClientPassword`) ← `ClientDashboard.tsx` |
| `GET /api/clients/{id}/notifications` | `notifications` | dueño o admin | — |
| `PATCH /api/clients/{id}/notifications/{notifId}/read` | `markNotificationRead` | dueño o admin | — |

- **Modelo:** `Cliente`.
- **Auth:** para saber si quien pide es el dueño de la cuenta o un admin.

## Variables importantes
| Variable | De dónde viene | Para qué sirve |
|---|---|---|
| `$id` | `{id}` de la ruta | El cliente al que se refiere la petición. |
| `$notifId` | `{notifId}` de la ruta | La notificación que se marca como leída. |
| `$datos` | `entrada()` | Campos a cambiar (`name`, `email`, `cart`, `preferences`...). |
| `$permitidos` | Lista fija | Campos que un **cliente** puede cambiar de sí mismo. |

## La función `autorizarPropioOAdmin($id)`
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
- **`index`**: lista todos los clientes con su resumen (pedidos, total gastado...).
- **`show`**: un cliente. **404** si no existe.
- **`update`**:
  ```php
  if (Auth::rol() !== 'admin') {
      $permitidos = ['name', 'email', 'phone', 'address', 'birthday', 'cart', 'preferences'];
      $datos = array_intersect_key($datos, array_flip($permitidos));
  }
  ```
  - `array_flip` convierte la lista en claves: `['name' => 0, 'email' => 1, ...]`.
  - `array_intersect_key` deja en `$datos` **solo** esas claves. Así un cliente no puede cambiarse sus puntos (`points`) ni el total gastado.
  - Si el correo nuevo ya lo usa otra cuenta → **409**.
- **`changePassword`**: solo el propio cliente. Revisa la contraseña actual con `password_verify` y guarda la nueva cifrada con `password_hash`.
- **`notifications`**: lista sus notificaciones.
- **`markNotificationRead`**: marca una como leída. **404** si no existe.
