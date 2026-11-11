<?php
/**
 * login.php — Endpoint para iniciar sesión
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../controllers/AuthController.php';

Session::iniciar();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido. Solo se acepta POST.']);
    exit;
}

try {
    $authController = new AuthController();
    $resultado      = $authController->login($_POST['email'] ?? '', $_POST['password'] ?? '');

    http_response_code($resultado['codigo'] ?? 200);
    unset($resultado['codigo']);
    echo json_encode($resultado);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Error de conexión con la base de datos MySQL. Verifica que el servicio esté iniciado.'
    ]);
}
