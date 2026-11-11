<?php
/**
 * demo.php — Endpoint para cargar o restaurar los datos de demostración en MySQL para el usuario activo
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';

require_once __DIR__ . '/../config/Session.php';
Session::iniciar();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Método no permitido. Solo se acepta POST para restaurar datos demo.'
    ]);
    exit;
}

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Debes iniciar sesión para restaurar datos demo en tu cuenta.',
    ]);
    exit;
}

try {
    $db = Database::getConnection();
    $db->beginTransaction();

    // 1. Limpiar insumos y productos existentes del usuario
    $stmtDelProd = $db->prepare("DELETE FROM productos WHERE usuario_id = ?");
    $stmtDelProd->execute([$usuarioId]);

    $stmtDelIns = $db->prepare("DELETE FROM insumos WHERE usuario_id = ?");
    $stmtDelIns->execute([$usuarioId]);

    // 2. Insertar insumos demo
    $insumosDemo = [
        ['Harina de trigo',  'kg',     3200.00],
        ['Levadura seca',    'g',      45.00],
        ['Mantequilla',      'g',      18.00],
        ['Azúcar blanca',    'kg',     2800.00],
        ['Huevo',            'unidad', 350.00],
        ['Chocolate amargo', 'g',      62.00],
    ];

    $mapaInsumos = [];
    $stmtInsInsumo = $db->prepare("
        INSERT INTO insumos (usuario_id, nombre, unidad, precio)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($insumosDemo as $idx => $ins) {
        $stmtInsInsumo->execute([$usuarioId, $ins[0], $ins[1], $ins[2]]);
        $mapaInsumos[$idx + 1] = (int)$db->lastInsertId();
    }

    // 3. Insertar productos y recetas demo
    $stmtInsProd = $db->prepare("
        INSERT INTO productos (usuario_id, nombre, modo, valor_modo, unidades_producidas, precio_venta_anterior)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmtInsItem = $db->prepare("
        INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta)
        VALUES (?, ?, ?, ?)
    ");

    // Producto 1: Pan artesanal
    $stmtInsProd->execute([$usuarioId, 'Pan artesanal', 'margen', 45.00, 10, 558.25]);
    $p1 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p1, $mapaInsumos[1], 500, 'g']);
    $stmtInsItem->execute([$p1, $mapaInsumos[2], 10,  'g']);
    $stmtInsItem->execute([$p1, $mapaInsumos[3], 100, 'g']);

    // Producto 2: Torta de chocolate
    $stmtInsProd->execute([$usuarioId, 'Torta de chocolate', 'multiplicador', 2.50, 1, 39900.00]);
    $p2 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p2, $mapaInsumos[1], 300,  'g']);
    $stmtInsItem->execute([$p2, $mapaInsumos[3], 200,  'g']);
    $stmtInsItem->execute([$p2, $mapaInsumos[4], 0.25, 'kg']);
    $stmtInsItem->execute([$p2, $mapaInsumos[5], 4,    'unidad']);
    $stmtInsItem->execute([$p2, $mapaInsumos[6], 150,  'g']);

    // Producto 3: Galletas de avena
    $stmtInsProd->execute([$usuarioId, 'Galletas de avena', 'margen', 60.00, 24, 180.67]);
    $p3 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p3, $mapaInsumos[1], 200, 'g']);
    $stmtInsItem->execute([$p3, $mapaInsumos[3], 80,  'g']);
    $stmtInsItem->execute([$p3, $mapaInsumos[4], 0.1, 'kg']);
    $stmtInsItem->execute([$p3, $mapaInsumos[5], 1,   'unidad']);

    $db->commit();

    echo json_encode([
        'status'  => 'success',
        'mensaje' => 'Datos de demostración restaurados correctamente en tu cuenta de base de datos.',
    ]);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'mensaje' => 'Error al restaurar datos de demostración en la base de datos.',
    ]);
}
