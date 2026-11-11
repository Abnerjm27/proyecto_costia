<?php
/**
 * insumos.php — API REST para la gestión de insumos del usuario
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../controllers/InsumoController.php';

require_once __DIR__ . '/../config/Session.php';
Session::iniciar();

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'No autorizado. Debes iniciar sesión para gestionar tus insumos.',
    ]);
    exit;
}

$controller = new InsumoController();
$metodo     = $_SERVER['REQUEST_METHOD'];

// Soporte para lectura de JSON o Form-data
$inputRaw   = file_get_contents('php://input');
$inputJson  = json_decode($inputRaw, true) ?: [];
$data       = array_merge($_POST, $inputJson);

switch ($metodo) {
    case 'GET':
        $res = $controller->listar((int)$usuarioId);
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res);
        break;

    case 'POST':
        $accion = $data['accion'] ?? 'crear';
        if ($accion === 'actualizar' || !empty($data['id'])) {
            $id     = (int)($data['id'] ?? 0);
            $nombre = (string)($data['nombre'] ?? '');
            $unidad = (string)($data['unidad'] ?? '');
            $precio = (float)($data['precio'] ?? 0);
            $res    = $controller->actualizar($id, (int)$usuarioId, $nombre, $unidad, $precio);
        } else {
            $nombre = (string)($data['nombre'] ?? '');
            $unidad = (string)($data['unidad'] ?? '');
            $precio = (float)($data['precio'] ?? 0);
            $res    = $controller->crear((int)$usuarioId, $nombre, $unidad, $precio);
        }
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res);
        break;

    case 'DELETE':
        // Puede venir por query string ?id=X&forzar=1 o por JSON
        $id     = (int)($_GET['id'] ?? $inputJson['id'] ?? 0);
        $forzar = !empty($_GET['forzar']) || !empty($inputJson['forzar']);
        $res    = $controller->eliminar($id, (int)$usuarioId, $forzar);
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'mensaje' => 'Método HTTP no permitido.']);
        break;
}
