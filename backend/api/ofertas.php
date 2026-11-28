<?php
/**
 * ofertas.php — API REST para el módulo de «Ofertas de Cierre / Rescate de Excedentes»
 *
 * GET  ?public=1           -> Lista pública de vitrina (sin sesión, sin datos de costo privado)
 * GET                      -> Lista de ofertas del negocio autenticado
 * POST accion=crear        -> Publica nueva oferta (requiere sesión)
 * POST accion=descontar_unidad -> Descuenta 1 unidad vendida (requiere sesión)
 * POST accion=retirar      -> Retira oferta manualmente (requiere sesión)
 * POST accion=reportar     -> Reporte sanitario público con baja preventiva inmediata
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../controllers/OfertaController.php';
require_once __DIR__ . '/../config/Session.php';

Session::iniciar();

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $controller = new OfertaController();
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Base de datos temporalmente no disponible. Operando en modo local.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($metodo === 'GET') {
    if (isset($_GET['public']) && $_GET['public'] === '1') {
        $res = $controller->listarPublicas();
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        exit;
    }

    $usuarioId = $_SESSION['usuario_id'] ?? null;
    if (!$usuarioId) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'mensaje' => 'No autorizado. Inicia sesión para gestionar tus ofertas de cierre.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $res = $controller->listarPorUsuario((int)$usuarioId);
    http_response_code($res['codigo'] ?? 200);
    unset($res['codigo']);
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($metodo === 'POST') {
    $inputRaw  = file_get_contents('php://input');
    $inputJson = json_decode($inputRaw, true);
    $data      = array_merge($_POST, is_array($inputJson) ? $inputJson : []);
    $accion    = $data['accion'] ?? 'crear';

    if ($accion === 'reportar') {
        $id     = (int)($data['id'] ?? 0);
        $motivo = (string)($data['motivo'] ?? '');
        $res    = $controller->reportar($id, $motivo);
        http_response_code($res['codigo'] ?? 200);
        unset($res['codigo']);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        exit;
    }

    $usuarioId = $_SESSION['usuario_id'] ?? null;
    if (!$usuarioId) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'mensaje' => 'No autorizado. Debes iniciar sesión para modificar tus ofertas.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($accion === 'descontar_unidad') {
        $res = $controller->descontarUnidad((int)($data['id'] ?? 0), (int)$usuarioId);
    } elseif ($accion === 'retirar') {
        $res = $controller->retirar((int)($data['id'] ?? 0), (int)$usuarioId);
    } else {
        $res = $controller->crear((int)$usuarioId, $data);
    }

    http_response_code($res['codigo'] ?? 200);
    unset($res['codigo']);
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode([
    'status'  => 'error',
    'mensaje' => 'Método HTTP no permitido.',
], JSON_UNESCAPED_UNICODE);
