# src/pages/admin/SettingsSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Ajustes y Caja"**: el admin cambia la tarifa del domicilio, el horario, abre o cierra
la tienda a mano, activa la **pausa de emergencia**, cambia el margen de ganancia y genera el
**cierre de caja**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'settings'` | |
| → `updateStoreConfig({...})` | almacén → `PUT /api/settings` → `SettingController` → `Configuracion::actualizar()` → tabla CONFIGURACION_SISTEMA | Guardar ajustes. |
| → `setShowTimePicker('open' / 'close')` | `TimePickerModal` del padre | Elegir horario. |
| → `handleGenerarCierre()` | del padre | Abrir el cierre de caja (ver `AdminDashboard.md`). |
| → usa | `ToastNotification` (vía `showToast`), `formatCOP` | |

## Props
| Prop | Qué es |
|---|---|
| `storeConfig` / `updateStoreConfig` | Ajustes actuales y función para guardarlos. |
| `isStoreAutomaticallyOpen` | Si según el horario la tienda debería estar abierta. |
| `shippingRateInput` / `setShippingRateInput` | Lo que se escribe en la tarifa. |
| `profitMarginInput` / `setProfitMarginInput` | Lo que se escribe en el margen. |
| `setShowTimePicker`, `handleGenerarCierre`, `showToast` | Funciones del padre. |

## Ajustes y a dónde van
| Ajuste | Llamada | Columna MySQL | Quién lo usa |
|---|---|---|---|
| Tarifa de domicilio | `updateStoreConfig({ shippingRate })` | `tarifa_plana_domicilio` | `PedidoService` (cobro) y el carrito del cliente. |
| Abrir / cerrar a mano | `updateStoreConfig({ isOpen })` | `tienda_abierta_manual` | `Configuracion::tiendaAbiertaAhora()`. |
| Pausa de emergencia (botón de pánico) | `updateStoreConfig({ isPaused })` | `pausa_emergencia_activa` | Con la pausa activa no se aceptan pedidos (403). |
| Margen de ganancia | `updateStoreConfig({ profitMargin })` | `margen_ganancia_defecto` | Precio de los extras: `costo × (1 + margen/100)`. |
| Horario | (en el padre, con `TimePickerModal`) | `horario_apertura`, `horario_cierre` | |

Cada bloque tiene una **simulación** en vivo: por ejemplo, cuánto pagaría un cliente con la tarifa
escrita, o cuánto costaría un ingrediente con el margen escrito. Hay botones de **valores rápidos**
(presets) para elegir con un toque.
