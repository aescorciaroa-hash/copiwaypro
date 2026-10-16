# src/pages/admin/SettingsSection.tsx

## ¿Para qué sirve?
Es la pestaña **"Ajustes y Caja"**: el admin cambia la tarifa del domicilio, el horario, abre o cierra
la tienda a mano, activa la **pausa de emergencia**, cambia el margen de ganancia, configura el
**programa de puntos**, edita los **datos del negocio** del ticket y genera el **cierre de caja**.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la muestra | `AdminDashboard.tsx` cuando `activeTab === 'settings'` | |
| → `updateStoreConfig({...})` | almacén → `PUT /api/settings` → `SettingController` → `Configuracion::actualizar()` → tabla CONFIGURACION_SISTEMA | Guardar ajustes. |
| → `setShowTimePicker('open' / 'close')` | `TimePickerModal` del padre | Elegir horario. |
| → `handleGenerarCierre()` | del padre | Abrir el cierre de caja (ver `AdminDashboard.md`). |
| → usa | `ToastNotification` (vía `showToast`), `formatCOP`, `ApiError` | |

## Props
| Prop | Qué es |
|---|---|
| `storeConfig` / `updateStoreConfig` | Ajustes actuales y función para guardarlos. |
| `isStoreAutomaticallyOpen` | Si según el horario la tienda debería estar abierta. |
| `shippingRateInput` / `setShippingRateInput` | Lo que se escribe en la tarifa. |
| `profitMarginInput` / `setProfitMarginInput` | Lo que se escribe en el margen. |
| `setShowTimePicker`, `handleGenerarCierre`, `showToast` | Funciones del padre. |

## Variables propias
| Variable | Qué es |
|---|---|
| `pointValueInput`, `minPointsInput` | Lo que se escribe en "Valor de 1 punto" y "Mínimo para canjear". |
| `businessInput` | Los datos del negocio que se están escribiendo (`name`, `nit`, `address`, `phone`, `instagram`, `website`). |
| `CAMPOS_NEGOCIO` (constante) | La lista de esos campos con su etiqueta y un ejemplo; con ella se dibujan los 6 cuadros de texto. |

Estos campos se vuelven a llenar con lo guardado **solo cuando cambia el valor guardado**: la
sincronización de cada pocos segundos no borra lo que el admin está escribiendo.

## Ajustes y a dónde van
| Ajuste | Llamada | Columna MySQL | Quién lo usa |
|---|---|---|---|
| Tarifa de domicilio | `updateStoreConfig({ shippingRate })` | `tarifa_plana_domicilio` | `PedidoService` (cobro) y el carrito del cliente. |
| Abrir / cerrar a mano | `updateStoreConfig({ isOpen })` | `tienda_abierta_manual` | `Configuracion::tiendaAbiertaAhora()`. |
| Pausa de emergencia (botón de pánico) | `updateStoreConfig({ isPaused })` | `pausa_emergencia_activa` | Con la pausa activa no se aceptan pedidos (403). |
| Margen de ganancia | `updateStoreConfig({ profitMargin })` | `margen_ganancia_defecto` | Precio de los extras: `costo × (1 + margen/100)`. |
| Horario | (en el padre, con `TimePickerModal`) | `horario_apertura`, `horario_cierre` | |
| Programa de puntos | `guardarPuntos()` → `updateStoreConfig({ pointValue, minPointsToRedeem })` | `valor_punto`, `minimo_puntos_canje` | `PedidoService::calcular()` al canjear y el checkout del cliente. |
| Datos del negocio | `guardarNegocio()` → `updateStoreConfig({ business })` | `negocio_nombre`, `negocio_nit`, `negocio_direccion`, `negocio_telefono`, `negocio_instagram`, `negocio_web` | El ticket de `KitchenDashboard.tsx`. El nombre es obligatorio; los campos vacíos no se imprimen. |

`guardarPuntos()` y `guardarNegocio()` **esperan la respuesta** del servidor: el aviso de éxito solo
aparece si se guardó, y si PHP rechaza los datos (por ejemplo un valor negativo → 422) muestran el
motivo.

Cada bloque tiene una **simulación** en vivo: por ejemplo, cuánto pagaría un cliente con la tarifa
escrita, cuánto costaría un ingrediente con el margen escrito, o cuánto valen 100 puntos y qué
porcentaje de lo comprado le devuelven al cliente. Hay botones de **valores rápidos**
(presets) para elegir con un toque.

## Cómo están ordenadas las tarjetas
La pantalla tiene dos columnas (en celular se ven una debajo de otra). El orden busca que las dos
columnas terminen más o menos a la misma altura:

| Columna izquierda | Columna derecha |
|---|---|
| Tarifa Plana de Domicilio | Margen de Ganancia |
| Horario de Atención | Programa de Puntos |
| Datos del Negocio (Ticket) | Reporte de Cierre de Caja |
| Vista Previa del Ticket | Pausa de Emergencia |

## Vista Previa del Ticket
Tarjeta que muestra el **encabezado y el pie** del ticket de cocina con lo que se está escribiendo en
"Datos del Negocio" (`businessInput`), **antes de guardar**. Usa el mismo formato que la ventana de
impresión de `KitchenDashboard.tsx`: nombre, NIT, dirección y teléfono arriba; "¡Gracias por su
preferencia!", Instagram y página web abajo. Los campos vacíos no aparecen, igual que en el ticket real.

Si lo escrito es distinto de lo guardado (`JSON.stringify(businessInput) !== businessGuardado`),
muestra la etiqueta **"Sin guardar"** para recordar que falta presionar "Guardar Datos del Negocio".
Solo es una vista: no llama a PHP.

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../SettingsSection"` porque lo importan: `src/pages/AdminDashboard.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
