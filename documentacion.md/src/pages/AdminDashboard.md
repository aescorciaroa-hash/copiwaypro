# src/pages/AdminDashboard.tsx

## ¿Para qué sirve?
Es el **panel del administrador** (`/admin`), el archivo más grande del proyecto (unas 2.800 líneas).
Funciona como el **contenedor** de las 8 secciones del admin (cada una en `src/pages/admin/`) y además
tiene las ventanas compartidas: cierre de caja con PDF, detalle de pedidos, editar personal, pedido
manual, ajustar horario y alertas de pedidos nuevos.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← la abre | `main.tsx` con `data-pagina="admin"` (`app/Views/paginas/admin.php`). Solo rol `admin`. | |
| → muestra | `admin/OverviewSection`, `OrdersSection`, `MapSection`, `MenuSection`, `InventorySection`, `StaffSection`, `ClientsSection`, `SettingsSection` | Las secciones. |
| → lee del almacén | `products`, `inventory`, `inventoryLogs`, `staff`, `orders`, `ordersSynced`, `clients`, `storeConfig` | Llegan por `/api/sync`. |
| → acciones del almacén | productos, inventario, personal, categorías, ajustes, estados de pedidos | Ver la tabla de `documentacion.md/src/store/almacenAplicacion.md`. |
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
| Pedido manual | `showManualForm`, `manualOrderClient`, `manualOrderItems`, `manualSelectedProduct`, `manualCustomRemoved`, `manualCustomExtras`, `manualQuantity` | Ventana de pedido por teléfono. |
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
| `handleUpdateAddress()` | Cambia la dirección de un pedido (ver la observación). |
| `handleAddProductToManualOrder()` / `handleCreateManualOrder()` | Arma y envía un pedido manual (ver la observación). |
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

## Observaciones (comportamiento actual, no se cambió)
- **Pedido manual:** `handleCreateManualOrder()` usa `addOrder()` → `POST /api/orders`, pero esa ruta
  solo la puede usar el rol `client` (`config/rutas.php`), así que el servidor responde **403**. Como
  la función no espera la respuesta (`addOrder(...)` sin `await`), igual muestra "Pedido manual creado".
- **Cambiar dirección:** `handleUpdateAddress()` solo cambia la dirección en el navegador
  (`setOrders(...)`); no hay ruta en PHP para guardarla, así que en la siguiente sincronización vuelve
  la dirección original.
