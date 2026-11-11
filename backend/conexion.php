<?php
/**
 * conexion.php — Conexión a la base de datos MySQL delegada a Database::getConnection()
 */

require_once __DIR__ . '/config/Database.php';

try {
    $pdo = Database::getConnection();

    if (basename($_SERVER['PHP_SELF']) === 'conexion.php') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status'  => 'success',
            'mensaje' => '¡Conexión exitosa a la base de datos costia_db mediante Database Singleton!'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (PDOException $e) {
    error_log("Error de conexión en conexion.php: " . $e->getMessage());
    if (basename($_SERVER['PHP_SELF']) === 'conexion.php') {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            'status'  => 'error',
            'mensaje' => 'No se pudo conectar a la base de datos MySQL. Revisa que el servicio esté activo.'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    throw $e;
}
