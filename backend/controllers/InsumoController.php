<?php
/**
 * InsumoController.php
 * Controlador encargado de la gestión de materias primas (CRUD e integridad).
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Insumo.php';

class InsumoController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Lista todos los insumos pertenecientes al usuario especificado.
     * Incluye información de qué productos usan actualmente cada insumo.
     */
    public function listar(int $usuarioId): array {
        try {
            $sql = "
                SELECT 
                    i.id,
                    i.usuario_id,
                    i.nombre,
                    i.unidad,
                    i.precio,
                    COUNT(DISTINCT r.producto_id) AS total_recetas,
                    GROUP_CONCAT(DISTINCT p.nombre ORDER BY p.nombre SEPARATOR ', ') AS productos_usados
                FROM insumos i
                LEFT JOIN receta_items r ON i.id = r.insumo_id
                LEFT JOIN productos p ON r.producto_id = p.id
                WHERE i.usuario_id = ?
                GROUP BY i.id, i.usuario_id, i.nombre, i.unidad, i.precio
                ORDER BY i.nombre ASC
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$usuarioId]);
            $filas = $stmt->fetchAll();

            $resultado = array_map(function ($row) {
                return [
                    'id'               => (int)$row['id'],
                    'usuario_id'       => (int)$row['usuario_id'],
                    'nombre'           => $row['nombre'],
                    'unidad'           => $row['unidad'],
                    'precio'           => (float)$row['precio'],
                    'total_recetas'    => (int)$row['total_recetas'],
                    'productos_usados' => $row['productos_usados'] ? explode(', ', $row['productos_usados']) : [],
                ];
            }, $filas);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'insumos' => $resultado,
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al obtener la lista de insumos en la base de datos.',
            ];
        }
    }

    /**
     * Crea un nuevo insumo para el usuario.
     */
    public function crear(int $usuarioId, string $nombre, string $unidad, float $precio): array {
        $nombre = trim($nombre);
        $unidad = trim($unidad);

        if (empty($nombre) || empty($unidad) || $precio < 0) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Por favor completa todos los campos con valores válidos.',
            ];
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO insumos (usuario_id, nombre, unidad, precio)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$usuarioId, $nombre, $unidad, $precio]);
            $nuevoId = (int)$this->db->lastInsertId();

            return [
                'status'  => 'success',
                'codigo'  => 201,
                'mensaje' => 'Insumo creado exitosamente.',
                'insumo'  => [
                    'id'               => $nuevoId,
                    'usuario_id'       => $usuarioId,
                    'nombre'           => $nombre,
                    'unidad'           => $unidad,
                    'precio'           => $precio,
                    'total_recetas'    => 0,
                    'productos_usados' => [],
                ],
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al guardar el insumo en la base de datos.',
            ];
        }
    }

    /**
     * Actualiza un insumo existente validando que pertenezca al usuario.
     */
    public function actualizar(int $id, int $usuarioId, string $nombre, string $unidad, float $precio): array {
        $nombre = trim($nombre);
        $unidad = trim($unidad);

        if ($id <= 0 || empty($nombre) || empty($unidad) || $precio < 0) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Datos inválidos para actualizar el insumo.',
            ];
        }

        try {
            // Verificar existencia y propiedad
            $stmtCheck = $this->db->prepare("SELECT id FROM insumos WHERE id = ? AND usuario_id = ?");
            $stmtCheck->execute([$id, $usuarioId]);
            if (!$stmtCheck->fetch()) {
                return [
                    'status'  => 'error',
                    'codigo'  => 404,
                    'mensaje' => 'El insumo no existe o no tienes permiso para modificarlo.',
                ];
            }

            $stmt = $this->db->prepare("
                UPDATE insumos
                SET nombre = ?, unidad = ?, precio = ?
                WHERE id = ? AND usuario_id = ?
            ");
            $stmt->execute([$nombre, $unidad, $precio, $id, $usuarioId]);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => 'Insumo actualizado exitosamente.',
                'insumo'  => [
                    'id'         => $id,
                    'usuario_id' => $usuarioId,
                    'nombre'     => $nombre,
                    'unidad'     => $unidad,
                    'precio'     => $precio,
                ],
            ];

        } catch (PDOException $e) {
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al actualizar el insumo en la base de datos.',
            ];
        }
    }

    /**
     * Elimina un insumo, verificando previamente si está siendo utilizado en recetas activas.
     */
    public function eliminar(int $id, int $usuarioId, bool $forzar = false): array {
        if ($id <= 0) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'ID de insumo no válido.',
            ];
        }

        try {
            // 1. Verificar si existe y pertenece al usuario
            $stmtCheck = $this->db->prepare("SELECT nombre FROM insumos WHERE id = ? AND usuario_id = ?");
            $stmtCheck->execute([$id, $usuarioId]);
            $insumo = $stmtCheck->fetch();

            if (!$insumo) {
                return [
                    'status'  => 'error',
                    'codigo'  => 404,
                    'mensaje' => 'El insumo no existe o no pertenece a tu cuenta.',
                ];
            }

            // 2. Verificar si está en uso en alguna receta
            $stmtUso = $this->db->prepare("
                SELECT DISTINCT p.nombre
                FROM receta_items r
                JOIN productos p ON r.producto_id = p.id
                WHERE r.insumo_id = ? AND p.usuario_id = ?
            ");
            $stmtUso->execute([$id, $usuarioId]);
            $productosEnUso = $stmtUso->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($productosEnUso) && !$forzar) {
                return [
                    'status'    => 'alerta_en_uso',
                    'codigo'    => 409,
                    'mensaje'   => 'Este insumo está siendo utilizado en ' . count($productosEnUso) . ' producto(s).',
                    'productos' => $productosEnUso,
                ];
            }

            // 3. Si se fuerza o no está en uso, proceder con la eliminación
            $this->db->beginTransaction();

            if (!empty($productosEnUso) && $forzar) {
                $stmtDelRecetas = $this->db->prepare("DELETE FROM receta_items WHERE insumo_id = ?");
                $stmtDelRecetas->execute([$id]);
            }

            $stmtDel = $this->db->prepare("DELETE FROM insumos WHERE id = ? AND usuario_id = ?");
            $stmtDel->execute([$id, $usuarioId]);

            $this->db->commit();

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => 'Insumo eliminado exitosamente.',
            ];

        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al eliminar el insumo de la base de datos.',
            ];
        }
    }
}
