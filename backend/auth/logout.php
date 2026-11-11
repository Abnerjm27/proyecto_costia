<?php
/**
 * logout.php — Endpoint para cerrar sesión
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/Session.php';
Session::iniciar();
Session::destruir();

// Si se llama por navegador directamente con GET, redirigir al index
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['json'])) {
    header('Location: ../../index.html');
    exit;
}

echo json_encode([
    'status'  => 'success',
    'mensaje' => 'Sesión cerrada exitosamente.'
]);
