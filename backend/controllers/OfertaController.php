<?php
/**
 * OfertaController.php
 * Controlador MVC para el módulo de «Ofertas de Cierre / Rescate de Excedentes».
 * Opera bajo el régimen de Portal de Contacto (Art. 53, Ley 1480 de 2011):
 * - No expone costos unitarios ni usuario_id en la vitrina pública.
 * - Exige declaración sanitaria y categorías permitidas de bajo riesgo.
 * - Permite baja preventiva inmediata ante reportes sanitarios.
 */

require_once __DIR__ . '/../config/Database.php';

class OfertaController {
    private PDO $db;
    private const CATEGORIAS_PERMITIDAS = ['panaderia', 'pasteleria', 'cafeteria', 'empacados'];

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Lista las ofertas activas y vigentes para la vitrina pública.
     * Omite deliberadamente costo_unitario y usuario_id por privacidad comercial.
     */
    public function listarPublicas(): array {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    id,
                    producto_id,
                    negocio_nombre,
                    producto_nombre,
                    categoria,
                    precio_regular,
                    precio_oferta,
                    unidades_disponibles,
                    horario_recogida,
                    pais,
                    departamento,
                    municipio,
                    direccion_recogida,
                    contacto_publico,
                    alergenos,
                    nota_frescura,
                    imagen_url,
                    latitud,
                    longitud,
                    expira_en,
                    estado,
                    created_at,
                    GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expira_en)) AS segundos_restantes
                FROM ofertas_cierre
                WHERE estado = 'activa'
                  AND unidades_disponibles > 0
                  AND expira_en > NOW()
                ORDER BY expira_en ASC, id DESC
            ");
            $stmt->execute();
            $filas = $stmt->fetchAll();

            $ofertas = array_map(fn($row) => $this->formatearFila($row, false), $filas);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'ofertas' => $ofertas,
            ];
        } catch (PDOException $e) {
            error_log('Error listarPublicas OfertaController: ' . $e->getMessage());
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'No se pudieron consultar las ofertas públicas.',
            ];
        }
    }

    /**
     * Lista todas las ofertas creadas por el negocio autenticado (incluye costo_unitario para métricas).
     */
    public function listarPorUsuario(int $usuarioId): array {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    id,
                    usuario_id,
                    producto_id,
                    negocio_nombre,
                    producto_nombre,
                    categoria,
                    precio_regular,
                    costo_unitario,
                    precio_oferta,
                    unidades_disponibles,
                    horario_recogida,
                    pais,
                    departamento,
                    municipio,
                    direccion_recogida,
                    contacto_publico,
                    alergenos,
                    nota_frescura,
                    imagen_url,
                    latitud,
                    longitud,
                    declaracion_sanitaria,
                    expira_en,
                    estado,
                    motivo_reporte,
                    created_at,
                    GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expira_en)) AS segundos_restantes
                FROM ofertas_cierre
                WHERE usuario_id = ?
                ORDER BY created_at DESC, id DESC
            ");
            $stmt->execute([$usuarioId]);
            $filas = $stmt->fetchAll();

            $ofertas = array_map(fn($row) => $this->formatearFila($row, true), $filas);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'ofertas' => $ofertas,
            ];
        } catch (PDOException $e) {
            error_log('Error listarPorUsuario OfertaController: ' . $e->getMessage());
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'No se pudieron consultar tus ofertas de cierre.',
            ];
        }
    }

    /**
     * Publica una nueva oferta de excedente con validación sanitaria y de precios.
     */
    public function crear(int $usuarioId, array $data): array {
        $declaracion = filter_var($data['declaracion_sanitaria'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$declaracion) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Debes aceptar la declaración sanitaria de inocuidad antes de publicar.',
            ];
        }

        $categoria = strtolower(trim((string)($data['categoria'] ?? 'panaderia')));
        if (!in_array($categoria, self::CATEGORIAS_PERMITIDAS, true)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Solo se permiten categorías de bajo riesgo (panadería, pastelería, cafetería o empacados vigentes).',
            ];
        }

        $negocioNombre    = mb_substr(trim((string)($data['negocio_nombre'] ?? '')), 0, 120, 'UTF-8');
        $productoNombre   = mb_substr(trim((string)($data['producto_nombre'] ?? '')), 0, 150, 'UTF-8');
        $horarioRecogida  = mb_substr(trim((string)($data['horario_recogida'] ?? '')), 0, 80, 'UTF-8');
        $paisRaw          = trim((string)($data['pais'] ?? 'Colombia'));
        $pais             = mb_substr($paisRaw !== '' ? $paisRaw : 'Colombia', 0, 80, 'UTF-8');
        $departamento     = mb_substr(trim((string)($data['departamento'] ?? '')), 0, 80, 'UTF-8');
        $municipio        = mb_substr(trim((string)($data['municipio'] ?? '')), 0, 80, 'UTF-8');
        $direccion        = mb_substr(trim((string)($data['direccion_recogida'] ?? '')), 0, 200, 'UTF-8');
        $contacto         = mb_substr(trim((string)($data['contacto_publico'] ?? '')), 0, 80, 'UTF-8');

        if ($negocioNombre === '' || $productoNombre === '' || $horarioRecogida === '' || $departamento === '' || $municipio === '' || $direccion === '' || $contacto === '') {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Completa negocio, producto, horario, departamento, municipio, dirección y contacto público.',
            ];
        }

        $unidades = (int)($data['unidades_disponibles'] ?? 0);
        if ($unidades < 1 || $unidades > 50) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Las unidades disponibles deben estar entre 1 y 50.',
            ];
        }

        $ttlHoras = (int)($data['ttl_horas'] ?? 4);
        if ($ttlHoras < 1 || $ttlHoras > 6) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'La vigencia automática de cierre debe estar entre 1 y 6 horas.',
            ];
        }

        $precioRegular = round((float)($data['precio_regular'] ?? 0), 2);
        $precioOferta  = round((float)($data['precio_oferta'] ?? 0), 2);
        $costoUnitario = max(0.0, round((float)($data['costo_unitario'] ?? 0), 2));

        if ($precioRegular <= 0 || $precioOferta <= 0 || $precioOferta >= $precioRegular) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'El precio de cierre debe ser mayor a $0 y menor al precio regular de mostrador.',
            ];
        }

        if ($precioOferta > round($precioRegular * 0.85, 2)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'El precio de cierre debe ofrecer al menos un 15% de descuento real sobre el precio en mostrador (Art. 30, Ley 1480).',
            ];
        }

        $alergenosRaw = $data['alergenos'] ?? '';
        if (is_array($alergenosRaw)) {
            $alergenosRaw = implode(', ', array_filter(array_map('trim', $alergenosRaw)));
        }
        $alergenos = mb_substr(trim((string)$alergenosRaw), 0, 255, 'UTF-8');

        $notaRaw = trim((string)($data['nota_frescura'] ?? ''));
        $notaFrescura = $notaRaw !== ''
            ? mb_substr($notaRaw, 0, 200, 'UTF-8')
            : 'Excedente del día · 100% apto para consumo';

        $productoId = isset($data['producto_id']) && is_numeric($data['producto_id']) && (int)$data['producto_id'] > 0
            ? (int)$data['producto_id']
            : null;
        $imagenUrl = $this->sanitizarImagenUrl($data['imagen_url'] ?? null);
        $latitud   = $this->sanitizarCoordenada($data['latitud'] ?? null, -90.0, 90.0);
        $longitud  = $this->sanitizarCoordenada($data['longitud'] ?? null, -180.0, 180.0);
        if ($latitud === null || $longitud === null) {
            $latitud  = null;
            $longitud = null;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO ofertas_cierre (
                    usuario_id, producto_id, negocio_nombre, producto_nombre, categoria,
                    precio_regular, costo_unitario, precio_oferta, unidades_disponibles,
                    horario_recogida, pais, departamento, municipio, direccion_recogida, contacto_publico,
                    alergenos, nota_frescura, imagen_url, latitud, longitud, declaracion_sanitaria, expira_en, estado
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, 1, TIMESTAMPADD(HOUR, ?, NOW()), 'activa'
                )
            ");
            $stmt->execute([
                $usuarioId,
                $productoId,
                $negocioNombre,
                $productoNombre,
                $categoria,
                $precioRegular,
                $costoUnitario,
                $precioOferta,
                $unidades,
                $horarioRecogida,
                $pais,
                $departamento,
                $municipio,
                $direccion,
                $contacto,
                $alergenos,
                $notaFrescura,
                $imagenUrl,
                $latitud,
                $longitud,
                $ttlHoras,
            ]);

            $nuevoId = (int)$this->db->lastInsertId();
            $stmtGet = $this->db->prepare("
                SELECT *, GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expira_en)) AS segundos_restantes
                FROM ofertas_cierre
                WHERE id = ?
            ");
            $stmtGet->execute([$nuevoId]);
            $fila = $stmtGet->fetch();

            return [
                'status'  => 'success',
                'codigo'  => 201,
                'mensaje' => 'Oferta de cierre publicada en la vitrina.',
                'oferta'  => $fila ? $this->formatearFila($fila, true) : ['id' => $nuevoId],
            ];
        } catch (PDOException $e) {
            error_log('Error crear OfertaController: ' . $e->getMessage());
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error al guardar la oferta de cierre.',
            ];
        }
    }

    /**
     * Descuenta 1 unidad vendida en mostrador; si llega a 0 marca como agotada.
     */
    public function descontarUnidad(int $id, int $usuarioId): array {
        if ($id <= 0) {
            return ['status' => 'error', 'codigo' => 400, 'mensaje' => 'ID de oferta inválido.'];
        }

        try {
            $stmt = $this->db->prepare("
                SELECT id, unidades_disponibles, estado
                FROM ofertas_cierre
                WHERE id = ? AND usuario_id = ?
                LIMIT 1
            ");
            $stmt->execute([$id, $usuarioId]);
            $oferta = $stmt->fetch();

            if (!$oferta) {
                return ['status' => 'error', 'codigo' => 404, 'mensaje' => 'Oferta no encontrada.'];
            }

            if ($oferta['estado'] !== 'activa') {
                return ['status' => 'error', 'codigo' => 400, 'mensaje' => 'Solo puedes descontar unidades de ofertas activas.'];
            }

            $nuevasUnidades = max(0, (int)$oferta['unidades_disponibles'] - 1);
            $nuevoEstado    = $nuevasUnidades === 0 ? 'agotada' : 'activa';

            $upd = $this->db->prepare("
                UPDATE ofertas_cierre
                SET unidades_disponibles = ?, estado = ?
                WHERE id = ? AND usuario_id = ?
            ");
            $upd->execute([$nuevasUnidades, $nuevoEstado, $id, $usuarioId]);

            return [
                'status'               => 'success',
                'codigo'               => 200,
                'unidades_disponibles' => $nuevasUnidades,
                'estado'               => $nuevoEstado,
            ];
        } catch (PDOException $e) {
            error_log('Error descontarUnidad OfertaController: ' . $e->getMessage());
            return ['status' => 'error', 'codigo' => 500, 'mensaje' => 'No se pudo actualizar el inventario de la oferta.'];
        }
    }

    /**
     * Retira manualmente una publicación activa del comercio.
     */
    public function retirar(int $id, int $usuarioId): array {
        if ($id <= 0) {
            return ['status' => 'error', 'codigo' => 400, 'mensaje' => 'ID de oferta inválido.'];
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE ofertas_cierre
                SET estado = 'retirada'
                WHERE id = ? AND usuario_id = ?
            ");
            $stmt->execute([$id, $usuarioId]);

            if ($stmt->rowCount() === 0) {
                return ['status' => 'error', 'codigo' => 404, 'mensaje' => 'Oferta no encontrada o sin permiso.'];
            }

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'estado'  => 'retirada',
                'mensaje' => 'Oferta retirada de la vitrina pública.',
            ];
        } catch (PDOException $e) {
            error_log('Error retirar OfertaController: ' . $e->getMessage());
            return ['status' => 'error', 'codigo' => 500, 'mensaje' => 'No se pudo retirar la oferta.'];
        }
    }

    /**
     * Suspensión preventiva inmediata ante un reporte sanitario o de irregularidad (Sección 6.4).
     */
    public function reportar(int $id, string $motivo): array {
        $motivoLimpio = mb_substr(trim($motivo), 0, 255, 'UTF-8');
        if ($id <= 0 || $motivoLimpio === '') {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Indica el ID de la publicación y el motivo del reporte.',
            ];
        }

        try {
            $stmtCheck = $this->db->prepare("SELECT id, estado FROM ofertas_cierre WHERE id = ? LIMIT 1");
            $stmtCheck->execute([$id]);
            $existe = $stmtCheck->fetch();

            if (!$existe) {
                return ['status' => 'error', 'codigo' => 404, 'mensaje' => 'Publicación no encontrada.'];
            }

            $stmt = $this->db->prepare("
                UPDATE ofertas_cierre
                SET estado = 'reportada', motivo_reporte = ?
                WHERE id = ?
            ");
            $stmt->execute([$motivoLimpio, $id]);

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'estado'  => 'reportada',
                'mensaje' => 'Publicación ocultada preventivamente para revisión sanitaria.',
            ];
        } catch (PDOException $e) {
            error_log('Error reportar OfertaController: ' . $e->getMessage());
            return ['status' => 'error', 'codigo' => 500, 'mensaje' => 'Error al procesar el reporte sanitario.'];
        }
    }

    /**
     * Formatea una fila de base de datos al contrato JSON estándar.
     */
    private function formatearFila(array $row, bool $incluirPrivados): array {
        $segundos = max(0, (int)($row['segundos_restantes'] ?? 0));
        $expiraMs = (time() + $segundos) * 1000;

        $item = [
            'id'                   => (int)$row['id'],
            'producto_id'          => $row['producto_id'] !== null ? (int)$row['producto_id'] : null,
            'negocio_nombre'       => $row['negocio_nombre'],
            'producto_nombre'      => $row['producto_nombre'],
            'categoria'            => $row['categoria'],
            'precio_regular'       => (float)$row['precio_regular'],
            'precio_oferta'        => (float)$row['precio_oferta'],
            'unidades_disponibles' => (int)$row['unidades_disponibles'],
            'horario_recogida'     => $row['horario_recogida'],
            'pais'                 => $row['pais'] ?? 'Colombia',
            'departamento'         => $row['departamento'] ?? 'Bogotá D.C.',
            'municipio'            => $row['municipio'] ?? 'Bogotá',
            'direccion_recogida'   => $row['direccion_recogida'],
            'contacto_publico'     => $row['contacto_publico'],
            'alergenos'            => $row['alergenos'] ?? '',
            'nota_frescura'        => $row['nota_frescura'] ?? '',
            'imagen_url'           => $this->sanitizarImagenUrl($row['imagen_url'] ?? null),
            'latitud'              => isset($row['latitud']) && $row['latitud'] !== null ? (float)$row['latitud'] : null,
            'longitud'             => isset($row['longitud']) && $row['longitud'] !== null ? (float)$row['longitud'] : null,
            'expira_en'            => $row['expira_en'],
            'expira_ts'            => $expiraMs,
            'segundos_restantes'   => $segundos,
            'estado'               => $row['estado'],
            'created_at'           => $row['created_at'],
        ];

        if ($incluirPrivados) {
            $item['costo_unitario']        = (float)($row['costo_unitario'] ?? 0);
            $item['declaracion_sanitaria'] = (bool)($row['declaracion_sanitaria'] ?? true);
            $item['motivo_reporte']        = $row['motivo_reporte'] ?? null;
        }

        return $item;
    }

    /**
     * Valida y restringe imagen_url únicamente a assets locales permitidos o data URI base64 (jpeg/png/webp).
     */
    private function sanitizarImagenUrl($raw): ?string {
        if ($raw === null) return null;
        $valor = trim((string)$raw);
        if ($valor === '') return null;

        if (preg_match('/^\.\.\/assets\/img\/ofertas\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/', $valor)) {
            return $valor;
        }

        if (strlen($valor) <= 450000 && preg_match('/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/', $valor)) {
            return $valor;
        }

        return null;
    }

    /**
     * Valida una coordenada geográfica dentro de rango válido.
     */
    private function sanitizarCoordenada($val, float $min, float $max): ?float {
        if ($val === null || $val === '' || !is_numeric($val)) return null;
        $num = (float)$val;
        if (!is_finite($num) || $num < $min || $num > $max) return null;
        return round($num, 7);
    }
}
