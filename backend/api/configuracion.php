<?php
/**
 * configuracion.php — Endpoint REST para persistir identidad y gastos fijos del negocio en MySQL
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Session.php';

Session::iniciar();

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($metodo, ['GET', 'POST', 'PUT'], true)) {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Método no permitido. Solo se aceptan GET, POST o PUT.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'No autenticado.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = Database::getConnection();

    if ($metodo === 'GET') {
        $stmt = $db->prepare("SELECT negocio, config_gastos FROM usuarios WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$usuarioId]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'status'  => 'error',
                'mensaje' => 'Usuario no encontrado.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $configGastos = null;
        if (!empty($row['config_gastos'])) {
            $decoded = json_decode($row['config_gastos'], true);
            if (is_array($decoded)) {
                $configGastos = $decoded;
            }
        }

        echo json_encode([
            'status'        => 'success',
            'negocio'       => $row['negocio'] ?? ($_SESSION['negocio'] ?? 'Mi Negocio'),
            'config_gastos' => $configGastos,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST / PUT
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'mensaje' => 'Cuerpo JSON inválido.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $negocioInput = trim((string)($data['negocio'] ?? ''));
    if ($negocioInput === '') {
        $negocio = (string)($_SESSION['negocio'] ?? 'Mi Negocio');
    } else {
        $negocio = mb_substr($negocioInput, 0, 100, 'UTF-8');
    }

    $configArray = null;
    $configJson = null;

    if (isset($data['config_gastos']) && is_array($data['config_gastos'])) {
        $configArray = $data['config_gastos'];
        $encoded = json_encode($configArray, JSON_UNESCAPED_UNICODE);
        $configJson = ($encoded !== false) ? $encoded : null;
    } else {
        $stmtActual = $db->prepare("SELECT config_gastos FROM usuarios WHERE id = ? LIMIT 1");
        $stmtActual->execute([(int)$usuarioId]);
        $actualRow = $stmtActual->fetch();
        if ($actualRow && !empty($actualRow['config_gastos'])) {
            $decoded = json_decode($actualRow['config_gastos'], true);
            if (is_array($decoded)) {
                $configArray = $decoded;
                $configJson = $actualRow['config_gastos'];
            }
        }
    }

    $stmtUpd = $db->prepare("UPDATE usuarios SET negocio = ?, config_gastos = ? WHERE id = ?");
    $stmtUpd->execute([$negocio, $configJson, (int)$usuarioId]);

    $_SESSION['negocio'] = $negocio;

    echo json_encode([
        'status'        => 'success',
        'mensaje'       => 'Configuración guardada en MySQL.',
        'negocio'       => $negocio,
        'config_gastos' => $configArray,
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log("Error PDO en configuracion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Error al acceder a la configuración en base de datos.'
    ], JSON_UNESCAPED_UNICODE);
}
