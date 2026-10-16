# src/pages/admin/ — las secciones del panel del administrador

Cada archivo es **una pestaña** del panel del administrador. Igual que en el cliente, las secciones
**reciben todo por props** desde `src/pages/AdminDashboard.tsx`, que es el que guarda el estado y llama
al almacén. Algunas secciones (Menú, Inventario, Personal) también usan `useStore()` directamente
para guardar cambios.

| Archivo | Pestaña |
|---|---|
| [OverviewSection.tsx](OverviewSection.md) | Tablero Analítico |
| [OrdersSection.tsx](OrdersSection.md) | Comandas Activas |
| [MapSection.tsx](MapSection.md) | Rutas & Zonas |
| [MenuSection.tsx](MenuSection.md) | Gestión de Menú |
| [InventorySection.tsx](InventorySection.md) | Inventario Express |
| [StaffSection.tsx](StaffSection.md) | Equipo y Personal |
| [ClientsSection.tsx](ClientsSection.md) | Directorio Clientes |
| [SettingsSection.tsx](SettingsSection.md) | Ajustes y Caja |
