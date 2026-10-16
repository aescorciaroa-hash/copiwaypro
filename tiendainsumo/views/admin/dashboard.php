<?php
session_start();

if (!isset($_SESSION['usuario']) || ($_SESSION['usuario']['id_rol'] != 1 && $_SESSION['usuario']['id_rol'] !== '1')) {
    header('Location: ../../views/auth/login.php');
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$result = $conn->query('SELECT id_rol, COUNT(*) as total FROM usuarios GROUP BY id_rol');
$totalVendedores = 0;
$totalClientes = 0;
$totalAdmins = 0;
while ($row = $result->fetch_assoc()) {
    if ($row['id_rol'] == 1)
        $totalAdmins = $row['total'];
    if ($row['id_rol'] == 2)
        $totalVendedores = $row['total'];
    if ($row['id_rol'] == 3)
        $totalClientes = $row['total'];
}
$totalUsuarios = $totalAdmins + $totalVendedores + $totalClientes;

// Dummy values for other stats until models are created
$totalProductos = 0;
$totalPedidos = 0;

$titulo = 'Dashboard Administrador';
require_once __DIR__ . '/../layouts/header.php';
require_once __DIR__ . '/../layouts/sidebaradmin.php';
?>

<div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card Clientes -->
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-glow p-6 border border-[var(--glass-border)] flex items-center gap-4 transition">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white" style="background: var(--brand-gradient); box-shadow: 0 6px 16px rgba(16,223,163,0.3);">
                <i class="fas fa-users"></i>
            </div>
            <div>
                <p class="text-sm font-medium" style="color: var(--muted);">Clientes</p>
                <p class="text-2xl font-bold" style="color: var(--ink);"><?= $totalClientes ?></p>
            </div>
        </div>

        <!-- Card Vendedores -->
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-glow p-6 border border-[var(--glass-border)] flex items-center gap-4 transition">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: rgba(163,230,53,0.18); color: var(--primary-strong);">
                <i class="fas fa-user-tie"></i>
            </div>
            <div>
                <p class="text-sm font-medium" style="color: var(--muted);">Vendedores</p>
                <p class="text-2xl font-bold" style="color: var(--ink);"><?= $totalVendedores ?></p>
            </div>
        </div>

        <!-- Card Productos -->
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-glow p-6 border border-[var(--glass-border)] flex items-center gap-4 transition">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: rgba(34,211,238,0.15); color: #0891b2;">
                <i class="fas fa-box"></i>
            </div>
            <div>
                <p class="text-sm font-medium" style="color: var(--muted);">Productos</p>
                <p class="text-2xl font-bold" style="color: var(--ink);"><?= $totalProductos ?></p>
            </div>
        </div>

        <!-- Card Pedidos -->
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-glow p-6 border border-[var(--glass-border)] flex items-center gap-4 transition">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: rgba(5,150,105,0.1); color: var(--primary-color);">
                <i class="fas fa-shopping-cart"></i>
            </div>
            <div>
                <p class="text-sm font-medium" style="color: var(--muted);">Pedidos</p>
                <p class="text-2xl font-bold" style="color: var(--ink);"><?= $totalPedidos ?></p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Próximos Eventos o Accesos Rápidos -->
        <div class="bg-white rounded-2xl shadow p-6 border border-[var(--glass-border)]">
            <h3 class="text-xl font-bold mb-6" style="color: var(--ink);">Accesos Rápidos</h3>
            <div class="grid grid-cols-2 gap-4">
                <a href="usuarios.php" class="p-4 border border-[var(--glass-border)] rounded-xl transition flex flex-col items-center gap-2" style="text-decoration:none;" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.1), rgba(34,211,238,.1))'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-user-plus text-xl" style="color: var(--primary-color);"></i>
                    <span class="text-sm font-medium" style="color: var(--ink);">Nuevo Usuario</span>
                </a>
                <a href="productos.php" class="p-4 border border-[var(--glass-border)] rounded-xl transition flex flex-col items-center gap-2" style="text-decoration:none;" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.1), rgba(34,211,238,.1))'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-box text-xl" style="color: #0891b2;"></i>
                    <span class="text-sm font-medium" style="color: var(--ink);">Productos</span>
                </a>
                <a href="categorias.php" class="p-4 border border-[var(--glass-border)] rounded-xl transition flex flex-col items-center gap-2" style="text-decoration:none;" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.1), rgba(34,211,238,.1))'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-tags text-xl" style="color: var(--primary-strong);"></i>
                    <span class="text-sm font-medium" style="color: var(--ink);">Categorías</span>
                </a>
                <a href="ventas.php" class="p-4 border border-[var(--glass-border)] rounded-xl transition flex flex-col items-center gap-2" style="text-decoration:none;" onmouseover="this.style.background='linear-gradient(90deg, rgba(16,223,163,.1), rgba(34,211,238,.1))'" onmouseout="this.style.background='transparent'">
                    <i class="fas fa-shopping-cart text-xl" style="color: var(--primary-color);"></i>
                    <span class="text-sm font-medium" style="color: var(--ink);">Ventas</span>
                </a>
            </div>
        </div>

        <!-- Resumen de Sistema -->
        <div class="bg-white rounded-2xl shadow p-6 border border-[var(--glass-border)]">
            <h3 class="text-xl font-bold mb-6" style="color: var(--ink);">Estado del Sistema</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 rounded-xl" style="background: var(--bg-alt);">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full" style="background: var(--mint); box-shadow: 0 0 8px var(--mint);"></div>
                        <span class="font-medium" style="color: var(--ink);">Base de Datos</span>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded" style="color: var(--primary-strong); background: rgba(16,223,163,0.15);">CONECTADO</span>
                </div>
                <div class="flex items-center justify-between p-4 rounded-xl" style="background: var(--bg-alt);">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-clock" style="color: var(--muted);"></i>
                        <span class="font-medium" style="color: var(--ink);">Hora del Servidor</span>
                    </div>
                    <span class="text-sm" style="color: var(--muted);"><?= date('H:i:s d/m/Y') ?></span>
                </div>
                <div class="flex items-center justify-between p-4 rounded-xl" style="background: var(--bg-alt);">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-shield-alt" style="color: var(--muted);"></i>
                        <span class="font-medium" style="color: var(--ink);">Nivel de Acceso</span>
                    </div>
                    <span class="text-sm font-bold" style="color: var(--primary-strong);">ADMINISTRADOR</span>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../layouts/footer.php'; ?>