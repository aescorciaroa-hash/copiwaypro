# app/Controllers/DashboardController.php

## ¿Para qué sirve?
Devuelve un **resumen del día** para el administrador: ventas de hoy, pedidos por estado, insumos con
poco stock y los 5 productos más vendidos.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| Ruta | `GET /api/dashboard` → `$action = 'summary'` (solo admin) |
| Modelo | `Panel::resumenDeHoy()` |

En React, la pantalla de resumen (`admin/OverviewSection.tsx`) calcula sus números con los datos que
llegan por `/api/sync`; esta ruta queda disponible si se quiere pedir el resumen ya calculado.

## Código explicado
```php
$panelModel = new Panel();

if ($action === 'summary') {
    responderJson($panelModel->resumenDeHoy());
}
```
Crea el modelo y responde lo que devuelve `resumenDeHoy()`. Es el controlador más corto del proyecto.
