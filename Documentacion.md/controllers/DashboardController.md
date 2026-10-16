# controllers/DashboardController.php

## ¿Para qué sirve?
Devuelve un **resumen del día** para el administrador: ventas de hoy, pedidos por estado, insumos con
poco stock y los 5 productos más vendidos.

## ¿Con qué se conecta?
| Dirección | Archivo |
|---|---|
| Ruta | `GET /api/dashboard` → método `summary()` (solo admin) |
| Modelo | `Panel::resumenDeHoy()` |

En React, la pantalla de resumen (`admin/OverviewSection.tsx`) calcula sus números con los datos que
llegan por `/api/sync`; esta ruta queda disponible si se quiere pedir el resumen ya calculado.

## Código explicado
```php
public function __construct()
{
    $this->panelModel = new Panel();
}

public function summary()
{
    responderJson($this->panelModel->resumenDeHoy());
}
```
El constructor crea el modelo y `summary()` responde lo que devuelve `resumenDeHoy()`. Es el controlador más corto del proyecto.
