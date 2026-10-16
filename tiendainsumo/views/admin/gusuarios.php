<?php
session_start();

if (!isset($_SESSION['usuario']) || ($_SESSION['usuario']['id_rol'] != 1 && $_SESSION['usuario']['id_rol'] !== '1')) {
    header('Location: ../../views/auth/login.php');
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Usuario.php';
require_once __DIR__ . '/../../models/Rol.php';

$usuarioModel = new Usuario();
$usuarios = $usuarioModel->obtenerTodos();

$rolModel = new Rol();
$roles = $rolModel->obtenerTodos();

$titulo = 'Dashboard Administrador';
require_once __DIR__ . '/../layouts/header.php';
require_once __DIR__ . '/../layouts/sidebaradmin.php';
?>

<div class="space-y-8">
    <div class="bg-white rounded-2xl shadow p-6 border border-[var(--glass-border)]">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-4xl font-light" style="color: var(--ink); font-family: var(--font-heading);">Gestión de <span class="font-bold text-gradient-brand">Usuarios</span></h2>
           <!-- Button trigger modal -->
<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#exampleModal">
  Agregar Usuarios
</button>
        </div>

        <?php if (isset($_SESSION['alert'])): ?>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    Swal.fire({
                        icon: '<?= htmlspecialchars($_SESSION['alert']['icon']) ?>',
                        title: '<?= htmlspecialchars($_SESSION['alert']['title']) ?>',
                        text: '<?= htmlspecialchars($_SESSION['alert']['text']) ?>',
                        confirmButtonText: 'Aceptar'
                    });
                });
            </script>
            <?php unset($_SESSION['alert']); ?>
        <?php endif; ?>

        <div class="overflow-x-auto">
            <table id="usuariosTable" class="w-full text-left border border-[var(--glass-border)] rounded-xl overflow-hidden">
                <thead>
                    <tr>
                          <th class="p-4">Id</th>
                        <th class="p-4">Nombre Completo</th>
                        <th class="p-4">Email</th>
                        <th class="p-4">Rol</th>
                        <th class="p-4">Estado</th>
                        <th class="p-4 text-center">Editar</th>
                        <th class="p-4 text-center">Eliminar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                    <?php foreach ($usuarios as $usuario): ?>
                    <tr>
                        <td class="p-4"><?= htmlspecialchars($usuario['id_usuario']) ?></td>
                        <td class="p-4"><?= htmlspecialchars($usuario['usuario']) ?></td>
                        <td class="p-4"><?= htmlspecialchars($usuario['email']) ?></td>
                     <td class="p-4 capitalize"><?= htmlspecialchars($usuario['id_rol']) ?></td>
                         <td class="p-4"><?= htmlspecialchars($usuario['estado']) ?></td>
                         <td>
                <button type="button" 
        class="btn btn-success btn-sm editbtn d-flex align-items-center justify-content-center"
        data-bs-toggle="modal" 
        data-bs-target="#editar"
        data-id="<?= $usuario['id_usuario'] ?>"
        data-name="<?= $usuario['usuario'] ?>"
        data-email="<?= $usuario['email'] ?>"
        data-rol="<?= $usuario['id_rol'] ?>"
        data-estado="<?= $usuario['estado'] ?>"
        style="width:35px; height:35px; border-radius:8px;">
    <i class="fa-solid fa-pen"></i>
</button>
                               </td>
                                <td>
                               <button type="button" class="btn btn-danger deletebtn" 
                                        data-bs-toggle="modal" data-bs-target="#eliminar"
                                        data-id="<?= $usuario['id_usuario'] ?>">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                    </td>
                     
                    </tr>
                    <?php endforeach; ?>
                    
                    <?php if (empty($usuarios)): ?>
                    <tr>
                        <td colspan="5" class="p-4 text-center text-slate-500">No hay usuarios registrados.</td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
<!-- Modal agregar Usuarios-->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="exampleModalLabel">Agregar Nuevos Usuarios</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
           <form action="../../controllers/registerController.php" method="POST" id="formRegister">
                

                <div class="row g-3 mb-4">

                                  <div class="col-12">
                <label for="rol">Rol</label>
<select name="rol" id="rol" class="form-select">
    <option value="" selected disabled>Seleccione un rol</option>
    <?php foreach ($roles as $rol): ?>
        <option value="<?= $rol['id_rol'] ?>"><?= htmlspecialchars($rol['nombre']) ?></option>
    <?php endforeach; ?>
</select>
                    </div>



                    <div class="col-12">
                        <label class="form-label small fw-semibold text-dark">Usuario</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-person text-muted"></i></span>
                            <input type="text" name="usuario" id="usuario" class="form-control" placeholder="Ej. Ruben Delgado" required>
                        </div>
                    </div>
                    <div class="col-12">
                        <label class="form-label small fw-semibold text-dark">Email</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-envelope text-muted"></i></span>
                            <input type="email" name="email" id="email" class="form-control" placeholder="Ej. juan@correo.com" >
                        </div>
                    </div>
                    <div class="col-12">
                        <label class="form-label small fw-semibold text-dark">Contraseña</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-lock text-muted"></i></span>
                            <input type="password" name="password" id="password" class="form-control" placeholder="Mínimo 8 caracteres" onkeyup="checkStrength()" required>
                            <span class="input-group-text toggle-password" onclick="toggleRegPassword('password', 'toggleIcon1')">
                                <i class="bi bi-eye-slash" id="toggleIcon1"></i>
                            </span>
                        </div>
                        <div class="password-strength">
                            <div class="password-strength-bar" id="strengthBar"></div>
                        </div>
                        <div class="small mt-1 text-end"><span id="strengthText"></span></div>
                    </div>
                       <div class="col-12">
                <label for="estado">Estado</label>
<select name="estado" id="estado" class="form-select">
    <option value="" selected disabled>Seleccione un estado</option>
    <option value="1">Activo</option>
    <option value="0">Inactivo</option>
</select>
                    </div>

                </div>

              
              <button type="submit" class="btn btn-success text-white w-100 py-3 mb-4 d-flex justify-content-center align-items-center gap-2" id="btnRegSubmit">
                    <span class="fw-semibold">Guardar</span>
                    <i class="bi bi-arrow-right-circle ms-1"></i>
                    <span class="spinner-border spinner-border-sm d-none" id="btnRegSpinner" role="status" aria-hidden="true"></span>
                </button>
                
            </form>
      </div>
      <div class="modal-footer">
    
    </div>
  </div>
</div>

    <div class="bg-white rounded-2xl shadow p-6 border border-[var(--glass-border)]">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-3xl font-light" style="color: var(--ink); font-family: var(--font-heading);">Últimos Reportes</h3>
            <button class="px-5 py-3 rounded-xl border border-[var(--glass-border)] transition" style="color: var(--primary-strong);" onmouseover="this.style.background='var(--bg-alt)'" onmouseout="this.style.background='transparent'">
                Consultar Reporte
            </button>
        </div>

        <div class="space-y-4">
            <div class="flex items-center justify-between border border-[var(--glass-border)] rounded-xl p-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(34,211,238,0.15); color: #0891b2;">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div>
                        <p class="font-semibold" style="color: var(--ink);">Análisis General de Usuarios</p>
                        <p class="text-sm" style="color: var(--muted);">Reporte administrativo del sistema</p>
                    </div>
                </div>
                <button class="px-4 py-2 rounded-lg border border-[var(--glass-border)] transition" style="color: var(--primary-strong);" onmouseover="this.style.background='var(--bg-alt)'" onmouseout="this.style.background='transparent'">Ver</button>
            </div>

            <div class="flex items-center justify-between border border-[var(--glass-border)] rounded-xl p-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(163,230,53,0.18); color: var(--primary-strong);">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div>
                        <p class="font-semibold" style="color: var(--ink);">Reporte de Rendimiento</p>
                        <p class="text-sm" style="color: var(--muted);">Resumen académico institucional</p>
                    </div>
                </div>
                <button class="px-4 py-2 rounded-lg border border-[var(--glass-border)] transition" style="color: var(--primary-strong);" onmouseover="this.style.background='var(--bg-alt)'" onmouseout="this.style.background='transparent'">Abrir</button>
            </div>
        </div>
    </div>
</div>





< <!-- Modal de Edición -->
            <div class="modal fade" id="editar" tabindex="-1" aria-labelledby="editarLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <form id="formEditar" action="../../controllers/UsuarioController.php?accion=update" method="POST">
                         
                            <div class="modal-header">
                                <h5 class="modal-title" id="editarLabel">Editar Usuario</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                            </div>
                        
                            <div class="modal-body">
                                <input type="hidden" name="id" id="edit-id">
                                <div class="mb-3">
                                           <div class="mb-3">
                                    <label for="edit-rol" class="form-label">Rol</label>
                             <select name="rol" id="edit-rol" class="form-select">
    <option value="" selected disabled>Seleccione un rol</option>
    <?php foreach ($roles as $rol): ?>
        <option value="<?= $rol['id_rol'] ?>"><?= htmlspecialchars($rol['nombre']) ?></option>
    <?php endforeach; ?>
</select>

                                </div>
                                    <label for="edit-name" class="form-label">Usuario</label>
                                    <input type="text" class="form-control" id="edit-name" name="name">
                                </div>  
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">Email</label>
                                    <input type="text" class="form-control" id="edit-email" name="email">
                                </div>
                             
                                <div class="mb-3">
                                    <label for="edit-estado" class="form-label">Estado</label>
                                    <select class="form-control" id="edit-estado" name="estado" required>
                                        <option value="">Seleccionar</option>
                                        <option value="1">Activo</option>
                                        <option value="0">Inactivo</option>
                                    </select>
                                </div>
                                
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary"
                                    data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-success px-5 py-2 text-white rounded-lg">Actualizar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
<!---Finaliza modal Editar -->

<!---Modal Elimnar -->


                    <!-- Modal de Confirmación de Eliminación -->
<div class="modal fade" id="eliminar" tabindex="-1" aria-labelledby="eliminarLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <form id="formEliminar" action="../../controllers/UsuarioController.php?accion=delete" method="POST">
             
                <div class="modal-header">
                    <h5 class="modal-title" id="eliminarLabel">Confirmar Eliminación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" name="id" id="delete-id">
                    <p>¿Está seguro de que desea eliminar este Usuario?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-danger">Eliminar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!---Finaliza modal Elimnar -->

<script>
                document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.editbtn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                document.getElementById('edit-id').value = id;
                document.getElementById('edit-rol').value = this.getAttribute('data-rol');
                document.getElementById('edit-name').value = this.getAttribute('data-name');
                document.getElementById('edit-email').value = this.getAttribute('data-email');
                
                let estadoVal = this.getAttribute('data-estado');
                let selectEstado = document.getElementById('edit-estado');
                if (estadoVal !== null) {
                    estadoVal = estadoVal.toString().trim().toLowerCase();
                    if (estadoVal === '1' || estadoVal === 'activo' || estadoVal === 'true' || estadoVal === 'activa') {
                        selectEstado.value = '1';
                    } else if (estadoVal === '0' || estadoVal === 'inactivo' || estadoVal === 'false' || estadoVal === 'inactiva') {
                        selectEstado.value = '0';
                    } else {
                        selectEstado.value = estadoVal;
                    }
                }
            });
        });
    });


            </script>


<script>
  document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.deletebtn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                if (document.getElementById('delete-id')) {
                    document.getElementById('delete-id').value = id;
                }
            });
        });
    });
</script> 






<!-- DataTables CSS & JS -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
<script>
    $(document).ready(function() {
        $('#usuariosTable').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
            },
            responsive: true,
            dom: '<"flex flex-col md:flex-row justify-between gap-4 mb-4"lf>rt<"flex flex-col md:flex-row justify-between items-center gap-4 mt-4"ip>',
            pageLength: 10,
            columnDefs: [
                { orderable: false, targets: 4 }
            ]
        });
    });

    function openVincularModal(id, nombre) {
        document.getElementById('vincular_id_usuario').value = id;
        document.getElementById('vincular_nombre_acudiente').value = nombre;
        openModal('modalVincular');
    }
</script>

<style>
    /* Ajustes básicos para que DataTables se vea bien con Tailwind */
    .dataTables_wrapper .dataTables_length select {
        padding: 0.25rem 2rem 0.25rem 0.5rem;
    }
    .dataTables_wrapper .dataTables_filter input {
        padding: 0.25rem 0.5rem;
        margin-left: 0.5rem;
    }
</style>


<?php require_once __DIR__ . '/../layouts/footer.php'; ?>