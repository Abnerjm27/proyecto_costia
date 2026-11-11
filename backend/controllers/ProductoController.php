<?php
/**
 * ProductoController.php
 * Controlador encargado de la gestión de productos y sus recetas asociadas con transacciones PDO.
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/RecetaItem.php';

class ProductoController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Lista todos los productos del usuario junto con su receta completa e insumos.
     */
    public function listar(int $usuarioId): array {
        try {
            // 1. Obtener todos los productos del usuario
            $stmtProd = $this->db->prepare("
                SELECT id, usuario_id, nombre, modo, valor_modo, tipo_margen, unidades_producidas, 
                       costo_empaque, porcentaje_merma, costo_mano_obra,
                       precio_venta_anterior, costo_snapshot, created_at
                FROM productos
                WHERE usuario_id = ?
                ORDER BY id DESC
            ");
            $stmtProd->execute([$usuarioId]);
            $productos = $stmtProd->fetchAll();

            if (empty($productos)) {
                return [
                    'status'    => 'success',
                    'codigo'    => 200,
                    'productos' => [],
                ];
            }

            // 2. Obtener todos los items de receta de estos productos
            $productoIds = array_column($productos, 'id');
            $inPlaceholders = implode(',', array_fill(0, count($productoIds), '?'));

            $sqlItems = "
                SELECT 
                    r.id,
                    r.producto_id,
                    r.insumo_id,
                    r.cantidad,
                    r.unidad_receta,
                    i.nombre AS insumo_nombre,
                    i.unidad AS insumo_unidad,
                    i.precio AS insumo_precio
                FROM receta_items r
                LEFT JOIN insumos i ON r.insumo_id = i.id
                WHERE r.producto_id IN ($inPlaceholders)
                ORDER BY r.id ASC
            ";
            $stmtItems = $this->db->prepare($sqlItems);
            $stmtItems->execute($productoIds);
            $itemsReceta = $stmtItems->fetchAll();

            // Indexar items por producto_id
            $recetasPorProducto = [];
            foreach ($itemsReceta as $item) {
                $pid = (int)$item['producto_id'];
                if (!isset($recetasPorProducto[$pid])) {
                    $recetasPorProducto[$pid] = [];
                }
                $recetasPorProducto[$pid][] = [
                    'id'            => (int)$item['id'],
                    'insumoId'      => (int)$item['insumo_id'],
                    'cantidad'      => (float)$item['cantidad'],
                    'unidadReceta'  => $item['unidad_receta'],
                    'insumo_nombre' => $item['insumo_nombre'],
                    'insumo_unidad' => $item['insumo_unidad'],
                    'insumo_precio' => $item['insumo_precio'] !== null ? (float)$item['insumo_precio'] : null,
                ];
            }

            // 3. Ensamblar lista final
            $resultado = [];
            foreach ($productos as $prod) {
                $pid = (int)$prod['id'];
                $resultado[] = [
                    'id'                  => $pid,
                    'usuario_id'          => (int)$prod['usuario_id'],
                    'nombre'              => $prod['nombre'],
                    'modo'                => $prod['modo'],
                    'valorModo'           => (float)$prod['valor_modo'],
                    'tipoMargen'          => $prod['tipo_margen'] ?? 'costo',
                    'unidadesProducidas'  => (int)$prod['unidades_producidas'],
                    'costoEmpaque'        => (float)($prod['costo_empaque'] ?? 0),
                    'porcentajeMerma'     => (float)($prod['porcentaje_merma'] ?? 0),
                    'costoManoObra'       => (float)($prod['costo_mano_obra'] ?? 0),
                    'precioVentaAnterior' => $prod['precio_venta_anterior'] !== null ? (float)$prod['precio_venta_anterior'] : null,
                    'costoSnapshot'       => $prod['costo_snapshot'] !== null ? (float)$prod['costo_snapshot'] : null,
                    'receta'              => $recetasPorProducto[$pid] ?? [],
                ];
            }

            return [
                'status'    => 'success',
                'codigo'    => 200,
                'productos' => $resultado,
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al obtener los productos de la base de datos.',
            ];
        }
    }

    /**
     * Guarda un producto (Crear o Editar) junto con sus líneas de receta de manera atómica.
     */
    public function guardar(int $usuarioId, array $datos): array {
        $id                 = isset($datos['id']) ? (int)$datos['id'] : null;
        $nombre             = trim($datos['nombre'] ?? '');
        $modo               = ($datos['modo'] ?? 'margen') === 'multiplicador' ? 'multiplicador' : 'margen';
        $valorModo          = (float)($datos['valorModo'] ?? ($modo === 'multiplicador' ? 2.0 : 30.0));
        $tipoMargen         = ($datos['tipoMargen'] ?? 'costo') === 'venta' ? 'venta' : 'costo';
        $unidadesProducidas = max(1, (int)($datos['unidadesProducidas'] ?? 1));
        $costoEmpaque       = max(0.0, (float)($datos['costoEmpaque'] ?? 0.0));
        $porcentajeMerma    = max(0.0, (float)($datos['porcentajeMerma'] ?? 0.0));
        $costoManoObra      = max(0.0, (float)($datos['costoManoObra'] ?? 0.0));
        $precioVentaAnterior = isset($datos['precioVentaAnterior']) && is_numeric($datos['precioVentaAnterior'])
            ? (float)$datos['precioVentaAnterior']
            : null;
        $receta             = is_array($datos['receta'] ?? null) ? $datos['receta'] : [];

        if (empty($nombre)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'El nombre del producto es obligatorio.',
            ];
        }

        if (empty($receta)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'La receta debe contener al menos un insumo.',
            ];
        }

        try {
            $this->db->beginTransaction();

            if ($id && $id > 0) {
                // Verificar pertenencia del producto
                $stmtCheck = $this->db->prepare("SELECT id FROM productos WHERE id = ? AND usuario_id = ?");
                $stmtCheck->execute([$id, $usuarioId]);
                if (!$stmtCheck->fetch()) {
                    $this->db->rollBack();
                    return [
                        'status'  => 'error',
                        'codigo'  => 404,
                        'mensaje' => 'El producto no existe o no tienes permiso para modificarlo.',
                    ];
                }

                // Actualizar cabecera del producto
                $stmtUpd = $this->db->prepare("
                    UPDATE productos
                    SET nombre = ?, modo = ?, valor_modo = ?, tipo_margen = ?, unidades_producidas = ?,
                        costo_empaque = ?, porcentaje_merma = ?, costo_mano_obra = ?,
                        precio_venta_anterior = COALESCE(?, precio_venta_anterior)
                    WHERE id = ? AND usuario_id = ?
                ");
                $stmtUpd->execute([
                    $nombre, $modo, $valorModo, $tipoMargen, $unidadesProducidas,
                    $costoEmpaque, $porcentajeMerma, $costoManoObra,
                    $precioVentaAnterior,
                    $id, $usuarioId
                ]);
                $productoId = $id;

                // Eliminar items de receta anteriores para reemplazarlos de forma limpia
                $stmtDel = $this->db->prepare("DELETE FROM receta_items WHERE producto_id = ?");
                $stmtDel->execute([$productoId]);

            } else {
                // Crear nuevo producto
                $stmtIns = $this->db->prepare("
                    INSERT INTO productos (usuario_id, nombre, modo, valor_modo, tipo_margen, unidades_producidas, costo_empaque, porcentaje_merma, costo_mano_obra, precio_venta_anterior)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmtIns->execute([
                    $usuarioId, $nombre, $modo, $valorModo, $tipoMargen, $unidadesProducidas,
                    $costoEmpaque, $porcentajeMerma, $costoManoObra, $precioVentaAnterior
                ]);
                $productoId = (int)$this->db->lastInsertId();
            }

            // Validar pertenencia de cada insumo antes de insertar (Mitigación BOLA/IDOR)
            $stmtCheckInsumo = $this->db->prepare("SELECT id FROM insumos WHERE id = ? AND usuario_id = ?");

            // Insertar items de receta
            $stmtItem = $this->db->prepare("
                INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta)
                VALUES (?, ?, ?, ?)
            ");

            foreach ($receta as $item) {
                $insumoId     = (int)($item['insumoId'] ?? $item['insumo_id'] ?? 0);
                $cantidad     = (float)($item['cantidad'] ?? 0);
                $unidadReceta = trim($item['unidadReceta'] ?? $item['unidad_receta'] ?? '');

                if ($insumoId > 0 && $cantidad > 0 && !empty($unidadReceta)) {
                    $stmtCheckInsumo->execute([$insumoId, $usuarioId]);
                    if (!$stmtCheckInsumo->fetch()) {
                        $this->db->rollBack();
                        return [
                            'status'  => 'error',
                            'codigo'  => 403,
                            'mensaje' => 'Uno o más insumos seleccionados no pertenecen a tu cuenta.',
                        ];
                    }
                    $stmtItem->execute([$productoId, $insumoId, $cantidad, $unidadReceta]);
                }
            }

            $this->db->commit();

            return [
                'status'     => 'success',
                'codigo'     => $id ? 200 : 201,
                'mensaje'    => $id ? 'Producto actualizado con éxito.' : 'Producto creado con éxito.',
                'productoId' => $productoId,
            ];

        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al guardar el producto en la base de datos.',
            ];
        }
    }

    /**
     * Elimina un producto y sus items de receta (por cascada).
     */
    public function eliminar(int $id, int $usuarioId): array {
        if ($id <= 0) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'ID de producto no válido.',
            ];
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM productos WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$id, $usuarioId]);

            if ($stmt->rowCount() === 0) {
                return [
                    'status'  => 'error',
                    'codigo'  => 404,
                    'mensaje' => 'El producto no existe o no tienes permiso para eliminarlo.',
                ];
            }

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => 'Producto eliminado correctamente.',
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al eliminar el producto de la base de datos.',
            ];
        }
    }

    /**
     * Actualiza el precio de venta anterior (cuando el usuario acepta la alerta de cambio de costo).
     */
    public function aceptarCambioPrecio(int $id, int $usuarioId, float $nuevoPrecio): array {
        try {
            $stmt = $this->db->prepare("
                UPDATE productos
                SET precio_venta_anterior = ?
                WHERE id = ? AND usuario_id = ?
            ");
            $stmt->execute([$nuevoPrecio, $id, $usuarioId]);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => 'Precio confirmado y alerta actualizada.',
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al actualizar el estado de la alerta.',
            ];
        }
    }
}
