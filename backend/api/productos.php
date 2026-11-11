<?php
/**
 * productos.php — API REST para la gestión de productos y recetas del usuario
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../controllers/ProductoController.php';

require_once __DIR__ . '/../config/Session.php';
Session::iniciar();

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'No autorizado. Debes iniciar sesión para gestionar tus productos.',
    ]);
    exit;
}

$controller = new ProductoController();
$metodo     = $_SERVER['REQUEST_METHOD'];

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
        $accion = $data['accion'] ?? 'guardar';
        if ($accion === 'aceptar_alerta') {
            $id          = (int)($data['id'] ?? 0);
            $nuevoPrecio = (float)($data['precio'] ?? 0);
            $res         = $controller->aceptarCambioPrecio($id, (int)$usuarioId, $nuevoPrecio);
        } else {
            $res = $controller->guardar((int)$usuarioId, $data);
        }
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res);
        break;

    case 'DELETE':
        $id  = (int)($_GET['id'] ?? $inputJson['id'] ?? 0);
        $res = $controller->eliminar($id, (int)$usuarioId);
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'mensaje' => 'Método HTTP no permitido.']);
        break;
}
