<?php session_start(); ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro de Cliente | AgroStock Pro</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Bootstrap 5.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="../../public/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .password-strength {
            height: 6px;
            border-radius: 3px;
            background-color: #e9ecef;
            margin-top: 8px;
            overflow: hidden;
        }
        .password-strength-bar {
            height: 100%;
            width: 0%;
            transition: width 0.3s ease, background-color 0.3s ease;
        }
        .toggle-password {
            cursor: pointer;
            border-left: none;
            background-color: transparent;
        }
        .toggle-password:hover {
            color: #198754;
        }
    </style>
</head>
<body>

    <div class="split-auth-page">

        <!-- Panel izquierdo: branding -->
        <div class="split-auth-brand">
            <div class="split-auth-brand-logo">
                <span class="brand-icon-box"><i class="bi bi-box-seam"></i></span>
                AgroStock Pro
            </div>

            <div class="split-auth-brand-body">
                <h1>Únete a nuestra comunidad agrícola</h1>
                <p>Crea tu cuenta de cliente y accede a nuestro catálogo completo de insumos con beneficios exclusivos.</p>

                <ul class="split-auth-feature-list">
                    <li><i class="bi bi-truck"></i> Pedidos y seguimiento en línea</li>
                    <li><i class="bi bi-tags"></i> Precios y ofertas para clientes</li>
                    <li><i class="bi bi-headset"></i> Soporte especializado</li>
                </ul>
            </div>

            <div class="split-auth-brand-footer">
                &copy; <?= date('Y') ?> AgroStock Pro. Todos los derechos reservados.
            </div>
        </div>

        <!-- Panel derecho: formulario -->
        <div class="split-auth-form-side">
            <div class="split-auth-form-container wide">

                <div class="split-auth-mobile-logo">
                    <i class="bi bi-box-seam"></i> AgroStock Pro
                </div>

                <h2 class="auth-title">Únete a AgroStock Pro</h2>
                <p class="auth-subtitle">Crea tu cuenta de cliente para acceder a nuestro catálogo</p>

                <?php if (isset($_SESSION['error'])): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <?= $_SESSION['error']; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                    <?php unset($_SESSION['error']); ?>
                <?php endif; ?>

                <form action="../../controllers/auth/registerController.php" method="POST" id="formRegister">

                    <div class="row g-3 mb-4">
                        <div class="col-12">
                            <label class="form-label small fw-semibold text-dark">Usuario</label>
                            <div class="input-group input-group-auth">
                                <span class="input-group-text"><i class="bi bi-person"></i></span>
                                <input type="text" name="usuario" id="usuario" class="form-control" placeholder="Ej. Ruben Delgado" required>
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-semibold text-dark">Email</label>
                            <div class="input-group input-group-auth">
                                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                <input type="email" name="email" id="email" class="form-control" placeholder="Ej. juan@correo.com" >
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-semibold text-dark">Contraseña</label>
                            <div class="input-group input-group-auth">
                                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                                <input type="password" name="password" id="password" class="form-control border-end-0" placeholder="Mínimo 8 caracteres" onkeyup="checkStrength()" required>
                                <span class="input-group-text bg-white border-start-0 toggle-password" onclick="toggleRegPassword('password', 'toggleIcon1')">
                                    <i class="bi bi-eye-slash" id="toggleIcon1"></i>
                                </span>
                            </div>
                            <div class="password-strength">
                                <div class="password-strength-bar" id="strengthBar"></div>
                            </div>
                            <div class="small mt-1 text-end"><span id="strengthText"></span></div>
                        </div>

                    </div>

                    <div class="mb-4 form-check bg-light p-3 rounded border">
                        <input type="checkbox" name="terminos" class="form-check-input ms-1 mt-1" id="termsCheck" required>
                        <label class="form-check-label small text-muted ms-2" for="termsCheck">
                            Acepto los <a href="#" class="auth-link">Términos y Condiciones</a> y la Política de Privacidad.
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary-custom text-white w-100 py-3 mb-4 d-flex justify-content-center align-items-center gap-2" id="btnRegSubmit">
                        <span class="fw-semibold">Crear Cuenta</span>
                        <i class="bi bi-arrow-right-circle ms-1"></i>
                        <span class="spinner-border spinner-border-sm d-none" id="btnRegSpinner" role="status" aria-hidden="true"></span>
                    </button>

                </form>

                <div class="text-center">
                    <span class="text-muted small">¿Ya tienes una cuenta?</span>
                    <a href="login.php" class="auth-link small ms-1">Inicia sesión aquí</a>
                </div>

                <div class="text-center mt-4">
                    <a href="../../public/index.php" class="text-muted small text-decoration-none">
                        <i class="bi bi-arrow-left me-1"></i> Volver a la página principal
                    </a>
                </div>

            </div>
        </div>

    </div>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function toggleRegPassword(inputId, iconId) {
            const passField = document.getElementById(inputId);
            const toggleIcon = document.getElementById(iconId);
            
            if (passField.type === 'password') {
                passField.type = 'text';
                toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                passField.type = 'password';
                toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
            }
        }

        function checkStrength() {
            const val = document.getElementById('password').value;
            const bar = document.getElementById('strengthBar');
            const text = document.getElementById('strengthText');
            
            let strength = 0;
            if (val.length > 0) strength += 25;
            if (val.length > 5) strength += 25;
            if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength += 25;
            if (/[^A-Za-z0-9]/.test(val)) strength += 25;

            bar.style.width = strength + '%';
            
            if(strength <= 25) {
                bar.style.backgroundColor = '#dc3545';
                text.innerText = 'Débil';
                text.className = 'text-danger';
            } else if(strength <= 50) {
                bar.style.backgroundColor = '#ffc107';
                text.innerText = 'Aceptable';
                text.className = 'text-warning';
            } else if(strength <= 75) {
                bar.style.backgroundColor = '#0dcaf0';
                text.innerText = 'Buena';
                text.className = 'text-info';
            } else {
                bar.style.backgroundColor = '#198754';
                text.innerText = 'Fuerte';
                text.className = 'text-success';
            }
        }



        document.getElementById('formRegister').addEventListener('submit', function(e) {
            const btn = document.getElementById('btnRegSubmit');
            const spinner = document.getElementById('btnRegSpinner');
            
            btn.classList.add('disabled');
            spinner.classList.remove('d-none');
        });
    </script>
</body>
</html>
