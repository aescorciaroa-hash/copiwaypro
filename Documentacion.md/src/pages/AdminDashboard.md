# src/pages/AdminDashboard.tsx

## ¿Para qué sirve?
Es el **panel del administrador** (`/admin`), el archivo más grande del proyecto (unas 2.800 líneas).
Funciona como el **contenedor** de las 8 secciones del admin (cada una en `src/pages/admin/`) y además
tiene las ventanas compartidas: cierre de caja con PDF, detalle de pedidos, editar personal, pedido
manual, ajustar horario y alertas de pedidos nuevos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="admin"` (`views/paginas/admin.php`). Solo rol `admin`. | |
| → muestra | `admin/OverviewSection`, `OrdersSection`, `MapSection`, `MenuSection`, `InventorySection`, `StaffSection`, `ClientsSection`, `SettingsSection` | Las secciones. |
| → lee del almacén | `products`, `inventory`, `inventoryLogs`, `staff`, `orders`, `ordersSynced`, `clients`, `storeConfig` | Llegan por `/api/sync`. |
| → acciones del almacén | productos, inventario, personal, categorías, ajustes, estados de pedidos, `addManualOrder` (pedido manual), `updateOrderAddress` (cambiar dirección) | Ver la tabla de `Documentacion.md/src/store/almacenAplicacion.md`. |
| → usa | `modificacionesDe` (`lib/format.ts`) | SIN / EXTRA de cada producto en el detalle del pedido. |
| → llama directo a | `GET /api/cash-closing/preview`, `POST /api/cash-closing`, `GET /api/orders`, `POST /api/auth/logout` | Cierre de caja y salir. |
| → usa | `generateCierrePDF` (`utils/generarCierrePdf.ts`) | El PDF del cierre. |
| → usa | `soundFx` (`utils/audio.ts`) | Campana con pedidos nuevos. |
| → usa | `TimePickerModal`, `CustomSelect`, `ConfirmDialog`, `ToastNotification`, `CustomBurgerThumb`, `recharts`, `react-leaflet` | |

## Las pestañas (`activeTab`)
| `activeTab` | Etiqueta del menú | Sección |
|---|---|---|
| `overview` | Tablero Analítico | `OverviewSection` |
| `orders` | Comandas Activas | `OrdersSection` |
| `map` | Rutas & Zonas | `MapSection` |
| `menu` | Gestión de Menú | `MenuSection` |
| `inventory` | Inventario Express | `InventorySection` |
| `staff` | Equipo y Personal | `StaffSection` |
| `clients` | Directorio Clientes | `ClientsSection` |
| `settings` | Ajustes y Caja | `SettingsSection` |

La lista está en la constante `navItems`. Con `{activeTab === 'menu' && <MenuSection ... />}` solo se
dibuja la sección activa.

## Estados principales (agrupados)
| Grupo | Variables | Para qué |
|---|---|---|
| Navegación | `activeTab`, `isMobileMenuOpen`, `highlightedOrderId` | Pestaña actual y resaltar un pedido. |
| Hora y tienda | `currentTime`, `showTimePicker` (`'open'`/`'close'`/`null`) | Reloj y selector de horario. |
| Gráficas | `salesFilter`, `activePieIndex` | Período de ventas y parte resaltada de la torta. |
| Productos | `newProduct`, `editingProductId`, `isProductModalOpen`, `tempIngredientName`, `tempPackagingName`, `isCategoryManagerOpen`, `selectedCatalogCategory`, `newCategoryInput`, `catalogSearch`... | Ventana para crear/editar productos y categorías (los usa `MenuSection`). |
| Inventario | `newItem`, `isInventoryModalOpen`, `inventorySearch`, `inventoryHistorySearch` | Ventana de insumos (la usa `InventorySection`). |
| Personal | `newStaff`, `staffEditData`, `selectedStaffInfo`, `staffModalReadOnly`, `showStaffPassword`, `staffSearch`, `staffRoleFilter`, `staffStatusFilter`, `staffCurrentPage` | Crear, ver y editar personal; filtros y páginas. |
| Clientes | `selectedClientInfo`, `customerSearch` | Ventana de cliente y buscador. |
| Pedidos | `viewingOrder`, `editingAddressOrder`, `newAddress`, `selectedDriverInfo`, `isMapExpanded` | Detalle de pedido, dirección, domiciliario. |
| Pedido manual | `showManualForm`, `manualOrderClient` (nombre, celular, dirección), `manualOrderChannel` (`'llamada'` o `'whatsapp'`), `manualOrderSaving` (mientras se envía), `manualOrderItems`, `manualSelectedProduct`, `manualCustomRemoved`, `manualCustomExtras`, `manualQuantity` | Ventana de pedido por llamada o WhatsApp. |
| Cierre de caja | `showCierre`, `cierreData`, `isGeneratingPDF`, `showPdfPreview`, `pdfPreviewUrl` | Ventana del cierre y PDF. |
| Ajustes | `shippingRateInput`, `profitMarginInput` | Campos de tarifa y margen (se llenan con `storeConfig`). |
| Avisos | `toastData`, `confirmModal`, `showOrderAlert`, `showNotifications` | |

## Valores calculados (filtros)
| Valor | Qué es |
|---|---|
| `filteredProducts` | Productos que coinciden con el buscador y la categoría. |
| `filteredInventory` | Insumos que coinciden con el buscador. |
| `filteredStaff` / `paginatedStaff` / `staffTotalPages` | Personal filtrado por texto, rol y estado, dividido en páginas. |
| `filteredInventoryLogs` | Historial de inventario filtrado. |
| `filteredClients` | Clientes por nombre o teléfono. |
| `topProductsData` (`useMemo`) | Productos más vendidos para la gráfica. |
| `isStoreOpen` | `checkIsStoreOpen()`: misma regla de horario que en PHP. |

## Funciones de las gráficas de ventas
| Función | Qué hace |
|---|---|
| `inicioDeSemana(fecha)` | El lunes de esa semana a las 00:00. |
| `ventasPorDia(inicio)` | Suma las ventas reales de cada día (Lun–Dom). |
| `ventasPorSemanaDelMes(inicioMes)` | Suma las ventas por semana dentro del mes. |
| `getSalesData()` | Elige cuál usar según `salesFilter` ("Esta semana", "Este mes"...). |

## Cierre de caja (paso a paso)
| Paso | Función | Llamada |
|---|---|---|
| 1. Vista previa | `handleGenerarCierre()` | `GET /api/cash-closing/preview` → `CajaService::previsualizar()`. **No guarda nada.** Abre la ventana con los números. |
| 2. Ver o descargar PDF | `handleVerReporte()` / `descargarPDF()` | `generateCierrePDF(cierreData, orders)` |
| 3. Confirmar | `requestConfirmarCierre()` | Pide confirmación (avisa si quedan pedidos activos). |
| 4. Guardar | `confirmarCierre()` | `POST /api/cash-closing` → `CajaService::generar()` y después recarga los pedidos con `GET /api/orders`. |

## Otras funciones
| Función | Qué hace |
|---|---|
| `handleNavigateToOrders(id)` | Va a "Comandas Activas" y baja hasta el pedido, resaltándolo 4 segundos. |
| `handleOpenStaffModal(persona, soloLectura)` | Abre la ventana de un miembro del personal. |
| `handleViewOrder(id)` | Abre el detalle de un pedido. |
| `handleUpdateAddress()` | Guarda la nueva dirección en el servidor (`updateOrderAddress` → `PATCH /api/orders/{id}/address`). Si falla, muestra el motivo y no cierra la ventana. |
| `handleAddProductToManualOrder()` | Agrega un producto (con lo quitado y los extras) a la lista del pedido manual. |
| `handleCreateManualOrder()` | Exige nombre, celular y dirección. Envía el pedido con `addManualOrder` → `POST /api/orders/manual` y **espera la respuesta**: el aviso dice el número real del pedido y si quedó en la cuenta de un cliente o como invitado. Si el servidor lo rechaza (tienda cerrada, sin stock...), muestra el motivo. |
| `handleLogout()` | Confirma y cierra sesión. |
| `showToast(...)` | Muestra un aviso. |

## Efectos
1. **Reloj** para la hora y el estado de la tienda.
2. **Campos de ajustes:** cuando cambia `storeConfig`, actualiza la tarifa y el margen escritos.
3. **Tecla Escape:** cierra cualquier ventana abierta.
4. **Pedido nuevo:** espera a `ordersSynced` (la primera carga real). Si después llegan más pedidos, muestra la alerta 5 segundos y suena la campana.
5. **Pedidos vacíos:** quita del estado local los pedidos sin productos.

## Componentes internos (al inicio del archivo)
`RoutePolyline` (ruta OSRM en el mapa, igual que en `DeliveryDashboard.tsx`) y `CustomTooltip`
(cuadro que aparece al pasar el mouse sobre una barra de la gráfica, con el valor en pesos).

## Pedido manual (ventana "Ingreso de Orden Manual")
1. **Datos del cliente:** nombre, celular, por dónde llegó (**Llamada** o **WhatsApp**) y dirección.
2. **Productos:** se eligen del menú, con lo que se quita y los extras.
3. **Enviar a Cocina:** el servidor recalcula los precios, descuenta el inventario y busca al cliente
   por su celular. Si está registrado, el pedido queda en su cuenta (y suma puntos al entregarse);
   si no, queda como **cliente invitado**. Se cobra en efectivo al entregar.
