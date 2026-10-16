<?php
$id_rol = $usuario['id_rol'];
$rol_nombre = '';
switch ($id_rol) {
    case '1':
        $rol_nombre = 'Administrador';
        break;
    case '2':
        $rol_nombre = 'Vendedor';
        break;
    case '3':
        $rol_nombre = 'Cliente';
        break;
}
$nombreCompleto = $usuario['usuario'];
?>



<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
<aside class="w-64 flex-shrink-0" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-right: 1px solid var(--glass-border); box-shadow: 4px 0 24px rgba(5, 150, 105, 0.06);">
    <div class="h-32 flex flex-col items-center justify-center px-4 gap-1" style="border-bottom: 1px solid var(--glass-border);">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style="background: var(--brand-gradient); box-shadow: 0 6px 16px rgba(16,223,163,0.35);">
            <i class="fas fa-seedling text-white"></i>
        </div>
        <div class="text-center">
            <div class="text-[10px] font-bold leading-tight uppercase tracking-[0.2em] opacity-70" style="color: var(--primary-color);">Sistema de</div>
            <div class="text-xl font-black tracking-tight leading-none text-gradient-brand">AGROSTOCK PRO</div>
        </div>
    </div>

    <nav class="mt-4 px-3 space-y-1.5">
        <?php if ($id_rol === '1' || $id_rol === 1): ?>
            <a href="../admin/dashboard.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:shadow-glow transition group" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-gauge-high" style="color: var(--primary-color);"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="../admin/gusuarios.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-users" style="color: var(--primary-color);"></i>
                <span class="font-medium">Gestión Usuarios</span>
            </a>
            <a href="categorias.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-tags" style="color: var(--primary-color);"></i>
                <span class="font-medium">Proveedores</span>
            </a>
            <a href="productos.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-box" style="color: var(--primary-color);"></i>
                <span class="font-medium">Categorías</span>
            </a>
            <a href="productos.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-box" style="color: var(--primary-color);"></i>
                <span class="font-medium">Productos</span>
            </a>

        <?php endif; ?>

        <?php if ($id_rol === '2' || $id_rol === 2): ?>
            <a href="../vendedor/dashboard.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-gauge-high" style="color: var(--primary-color);"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="../vendedor/ventas.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-shopping-cart" style="color: var(--primary-color);"></i>
                <span class="font-medium">Ventas</span>
            </a>
            <a href="../vendedor/productos.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-box" style="color: var(--primary-color);"></i>
                <span class="font-medium">Productos</span>
            </a>
        <?php endif; ?>

        <?php if ($id_rol === '3' || $id_rol === 3): ?>
            <a href="../cliente/dashboard.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-gauge-high" style="color: var(--primary-color);"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="../cliente/compras.php" style="text-decoration: none; color: var(--ink);" class="flex items-center gap-3 px-4 py-3 rounded-xl transition" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.12), rgba(34,211,238,.12))'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-shopping-bag" style="color: var(--primary-color);"></i>
                <span class="font-medium">Mis Compras</span>
            </a>
        <?php endif; ?>


    </nav>
</aside>

<main class="flex-1">
    <header class="h-24 px-8 flex items-center justify-between" style="background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); box-shadow: 0 4px 20px rgba(5, 150, 105, 0.06);">
        <h1 class="text-3xl font-light" style="color: var(--ink); font-family: var(--font-heading);"><?= htmlspecialchars($titulo) ?></h1>

        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white" style="background: var(--brand-gradient); box-shadow: 0 6px 16px rgba(16,223,163,0.35);">
                <i class="fas fa-user"></i>
            </div>
            <div class="text-right flex flex-col">
                <div class="font-bold text-lg leading-tight" style="color: var(--ink);"><?= htmlspecialchars(ucfirst($rol_nombre)) ?></div>
                <div class="text-sm" style="color: var(--muted);"><?= htmlspecialchars($nombreCompleto) ?></div>
                <a href="../../controllers/auth/authController.php?accion=logout" class="mt-1 text-xs px-2 py-1 rounded-md transition-all flex items-center justify-end gap-1 self-end w-fit" style="background: rgba(239,68,68,0.1); color: #dc2626;">
                    <i class="fas fa-power-off text-[10px]"></i>
                    <span>Salir</span>
                </a>
            </div>
        </div>
    </header>

    <section class="p-8">