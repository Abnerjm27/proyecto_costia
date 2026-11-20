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

    // 1. Limpiar insumos y productos existentes del usuario y restablecer configuración del negocio
    $stmtResetUser = $db->prepare("UPDATE usuarios SET negocio = 'Panadería El Roble', config_gastos = NULL WHERE id = ?");
    $stmtResetUser->execute([$usuarioId]);
    $_SESSION['negocio'] = 'Panadería El Roble';

    $stmtDelProd = $db->prepare("DELETE FROM productos WHERE usuario_id = ?");
    $stmtDelProd->execute([$usuarioId]);

    $stmtDelIns = $db->prepare("DELETE FROM insumos WHERE usuario_id = ?");
    $stmtDelIns->execute([$usuarioId]);

    // 2. Insertar insumos demo
    $insumosDemo = [
        ['Harina de trigo',   'kg',     3200.00],
        ['Levadura seca',     'g',      45.00],
        ['Mantequilla',       'g',      18.00],
        ['Azúcar blanca',     'kg',     2800.00],
        ['Huevo',             'unidad', 350.00],
        ['Chocolate amargo',  'g',      62.00],
        ['Leche entera',      'l',      4200.00],
        ['Café molido',       'g',      55.00],
        ['Queso campesino',   'g',      24.00],
        ['Avena en hojuelas', 'g',      9.00],
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

    // 3. Insertar productos y recetas demo (con merma, empaque y gastos proporcionales)
    $stmtInsProd = $db->prepare("
        INSERT INTO productos (usuario_id, nombre, modo, valor_modo, tipo_margen, unidades_producidas, costo_empaque, porcentaje_merma, costo_mano_obra, precio_venta_anterior)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtInsItem = $db->prepare("
        INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta)
        VALUES (?, ?, ?, ?)
    ");

    // Producto 1: Pan artesanal
    $stmtInsProd->execute([$usuarioId, 'Pan artesanal', 'margen', 35.00, 'venta', 10, 50.00, 5.00, 800.00, 821.92]);
    $p1 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p1, $mapaInsumos[1], 500, 'g']);
    $stmtInsItem->execute([$p1, $mapaInsumos[2], 10,  'g']);
    $stmtInsItem->execute([$p1, $mapaInsumos[3], 100, 'g']);

    // Producto 2: Torta de chocolate
    $stmtInsProd->execute([$usuarioId, 'Torta de chocolate', 'margen', 38.00, 'venta', 1, 1800.00, 4.00, 3200.00, 34836.13]);
    $p2 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p2, $mapaInsumos[1], 300,  'g']);
    $stmtInsItem->execute([$p2, $mapaInsumos[3], 200,  'g']);
    $stmtInsItem->execute([$p2, $mapaInsumos[4], 0.25, 'kg']);
    $stmtInsItem->execute([$p2, $mapaInsumos[5], 4,    'unidad']);
    $stmtInsItem->execute([$p2, $mapaInsumos[6], 150,  'g']);

    // Producto 3: Galletas de avena
    $stmtInsProd->execute([$usuarioId, 'Galletas de avena', 'margen', 40.00, 'venta', 24, 35.00, 3.00, 700.00, 397.35]);
    $p3 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p3, $mapaInsumos[1],  200, 'g']);
    $stmtInsItem->execute([$p3, $mapaInsumos[10], 150, 'g']);
    $stmtInsItem->execute([$p3, $mapaInsumos[3],  80,  'g']);
    $stmtInsItem->execute([$p3, $mapaInsumos[4],  0.1, 'kg']);
    $stmtInsItem->execute([$p3, $mapaInsumos[5],  1,   'unidad']);

    // Producto 4: Croissant de mantequilla
    $stmtInsProd->execute([$usuarioId, 'Croissant de mantequilla', 'margen', 40.00, 'venta', 12, 120.00, 6.00, 2200.00, 1780.94]);
    $p4 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p4, $mapaInsumos[1], 600, 'g']);
    $stmtInsItem->execute([$p4, $mapaInsumos[2], 15,  'g']);
    $stmtInsItem->execute([$p4, $mapaInsumos[3], 250, 'g']);
    $stmtInsItem->execute([$p4, $mapaInsumos[7], 250, 'ml']);
    $stmtInsItem->execute([$p4, $mapaInsumos[4], 60,  'g']);
    $stmtInsItem->execute([$p4, $mapaInsumos[5], 1,   'unidad']);

    // Producto 5: Pan de queso campesino
    $stmtInsProd->execute([$usuarioId, 'Pan de queso campesino', 'margen', 35.00, 'venta', 12, 90.00, 4.00, 1800.00, 1981.23]);
    $p5 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p5, $mapaInsumos[1], 400, 'g']);
    $stmtInsItem->execute([$p5, $mapaInsumos[9], 350, 'g']);
    $stmtInsItem->execute([$p5, $mapaInsumos[3], 60,  'g']);
    $stmtInsItem->execute([$p5, $mapaInsumos[5], 2,   'unidad']);
    $stmtInsItem->execute([$p5, $mapaInsumos[7], 150, 'ml']);

    // Producto 6: Capuchino artesanal (12 oz)
    $stmtInsProd->execute([$usuarioId, 'Capuchino artesanal (12 oz)', 'margen', 45.00, 'venta', 1, 420.00, 5.00, 550.00, 5471.09]);
    $p6 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p6, $mapaInsumos[8], 18,  'g']);
    $stmtInsItem->execute([$p6, $mapaInsumos[7], 220, 'ml']);
    $stmtInsItem->execute([$p6, $mapaInsumos[4], 10,  'g']);

    // Producto 7: Brownie de chocolate
    $stmtInsProd->execute([$usuarioId, 'Brownie de chocolate', 'multiplicador', 2.20, 'costo', 16, 60.00, 2.00, 0.00, 2529.43]);
    $p7 = (int)$db->lastInsertId();
    $stmtInsItem->execute([$p7, $mapaInsumos[6], 200, 'g']);
    $stmtInsItem->execute([$p7, $mapaInsumos[3], 150, 'g']);
    $stmtInsItem->execute([$p7, $mapaInsumos[4], 200, 'g']);
    $stmtInsItem->execute([$p7, $mapaInsumos[5], 3,   'unidad']);
    $stmtInsItem->execute([$p7, $mapaInsumos[1], 120, 'g']);

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
