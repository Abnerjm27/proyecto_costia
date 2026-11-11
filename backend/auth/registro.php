<?php
/**
 * registro.php — Endpoint para registrar usuarios
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../controllers/AuthController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido. Solo se acepta POST.']);
    exit;
}

try {
    $authController = new AuthController();
    $aceptoTerminos   = !empty($_POST['terminos']) && in_array($_POST['terminos'], ['on', '1', 'true', true], true);
    $aceptoPrivacidad = !empty($_POST['privacidad']) && in_array($_POST['privacidad'], ['on', '1', 'true', true], true);

    // Detección segura de IP del cliente para trazabilidad probatoria SIC
    $ipCliente = $_SERVER['HTTP_CF_CONNECTING_IP'] 
        ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
        ?? $_SERVER['REMOTE_ADDR'] 
        ?? '127.0.0.1';

    // En caso de múltiples IPs separadas por coma en X-Forwarded-For, tomar la primera
    if (str_contains($ipCliente, ',')) {
        $ipCliente = trim(explode(',', $ipCliente)[0]);
    }

    $resultado = $authController->registrar(
        $_POST['negocio'] ?? '',
        $_POST['email'] ?? '',
        $_POST['password'] ?? '',
        $aceptoTerminos,
        $aceptoPrivacidad,
        $ipCliente
    );

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
