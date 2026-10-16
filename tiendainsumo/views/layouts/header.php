<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['usuario'])) {
    header('Location: ../../views/auth/login.php');
    exit;
}

$usuario = $_SESSION['usuario'];
$titulo = $titulo ?? 'Dashboard';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($titulo) ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="../../public/css/style.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#EAF7F1', 100: '#D3F1E3', 200: '#A8E4C8',
                            300: '#6FD3AB', 400: '#34D399', 500: '#10DFA3',
                            600: '#059669', 700: '#047857', 800: '#065F46', 900: '#0F2A22'
                        },
                        glow: { cyan: '#22D3EE', lime: '#A3E635' }
                    },
                    fontFamily: {
                        heading: ['Plus Jakarta Sans', 'sans-serif'],
                        sans: ['Inter', 'sans-serif']
                    },
                    boxShadow: {
                        glow: '0 8px 24px rgba(16, 223, 163, 0.28)'
                    }
                }
            }
        };
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="min-h-screen">
<div class="flex min-h-screen">