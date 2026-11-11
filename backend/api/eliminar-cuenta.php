<?php
/**
 * eliminar-cuenta.php — Endpoint para el ejercicio del Derecho al Olvido (Habeas Data / GDPR)
 *
 * Elimina la cuenta del usuario autenticado y en cascada todos sus datos asociados
 * (recetas, insumos, productos y configuración) de la base de datos, destruyendo la sesión.
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Session.php';

Session::iniciar();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Método no permitido. Solo se acepta POST.'
    ]);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'No autorizado. Debes tener una sesión activa para realizar esta acción.'
    ]);
    exit;
}

try {
    $db = Database::getConnection();
    $db->beginTransaction();

    // 1. Eliminar receta_items vinculados a productos del usuario
    $stmtItemsProd = $db->prepare("
        DELETE ri FROM receta_items ri
        INNER JOIN productos p ON ri.producto_id = p.id
        WHERE p.usuario_id = ?
    ");
    $stmtItemsProd->execute([(int)$usuarioId]);

    // 2. Eliminar receta_items vinculados a insumos del usuario
    $stmtItemsIns = $db->prepare("
        DELETE ri FROM receta_items ri
        INNER JOIN insumos i ON ri.insumo_id = i.id
        WHERE i.usuario_id = ?
    ");
    $stmtItemsIns->execute([(int)$usuarioId]);

    // 3. Eliminar productos del usuario
    $stmtProd = $db->prepare("DELETE FROM productos WHERE usuario_id = ?");
    $stmtProd->execute([(int)$usuarioId]);

    // 4. Eliminar insumos del usuario
    $stmtIns = $db->prepare("DELETE FROM insumos WHERE usuario_id = ?");
    $stmtIns->execute([(int)$usuarioId]);

    // 5. Eliminar usuario de la tabla usuarios
    $stmtUser = $db->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmtUser->execute([(int)$usuarioId]);

    $db->commit();

    // Destruir la sesión activa
    Session::destruir();

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'mensaje' => 'Tu cuenta y recetas han sido eliminadas definitivamente.'
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Error al eliminar cuenta (usuario {$usuarioId}): " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Ocurrió un error en el servidor al intentar eliminar tu cuenta. Por favor reintenta.'
    ]);
}
