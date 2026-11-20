<?php
/**
 * AuthController.php
 * Controlador encargado de la lógica de autenticación y registro de usuarios.
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Session.php';
require_once __DIR__ . '/../models/Usuario.php';

class AuthController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene la IP del cliente considerando proxies y cabeceras estándar.
     */
    public static function obtenerIpCliente(): string {
        $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $trustedProxies = ['127.0.0.1', '::1'];
        $envTrusted = getenv('TRUSTED_PROXIES');
        if ($envTrusted) {
            $trustedProxies = array_merge($trustedProxies, array_map('trim', explode(',', $envTrusted)));
        }

        // Solo si la conexión directa proviene de un proxy confiable evaluamos cabeceras reenviadas
        if (in_array($remoteAddr, $trustedProxies, true)) {
            $forwarded = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null;
            if ($forwarded) {
                $partes = explode(',', $forwarded);
                $ipCandidata = trim($partes[0]);
                if (filter_var($ipCandidata, FILTER_VALIDATE_IP)) {
                    return $ipCandidata;
                }
            }
        }

        return filter_var($remoteAddr, FILTER_VALIDATE_IP) ? $remoteAddr : '127.0.0.1';
    }

    /**
     * Ruta al archivo de almacenamiento temporal de rate limit por IP.
     */
    public static function obtenerRutaRateLimit(string $ip): string {
        return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'costia_login_rate_' . md5($ip) . '.json';
    }

    /**
     * Verifica si una IP o sesión ha superado el límite de intentos de login.
     * Si supera 5 intentos fallidos consecutivos en menos de 10 minutos (600s),
     * impone una espera de 60 segundos devolviendo HTTP 429.
     */
    public static function verificarRateLimit(?string $ip = null): ?array {
        $ip = $ip ?: self::obtenerIpCliente();
        $ahora = time();
        $archivo = self::obtenerRutaRateLimit($ip);
        $datosIp = null;

        if (file_exists($archivo)) {
            $raw = @file_get_contents($archivo);
            if ($raw) {
                $datosIp = json_decode($raw, true);
            }
        }

        // Limpiar ventana de 10 minutos si ya expiró
        if ($datosIp && isset($datosIp['primer_intento']) && ($ahora - $datosIp['primer_intento'] > 600)) {
            $datosIp = null;
            @unlink($archivo);
        }

        // Verificar también en sesión si existe
        $datosSesion = (session_status() === PHP_SESSION_ACTIVE) ? ($_SESSION['login_rate_limit'] ?? null) : null;
        if ($datosSesion && isset($datosSesion['primer_intento']) && ($ahora - $datosSesion['primer_intento'] > 600)) {
            $datosSesion = null;
            if (session_status() === PHP_SESSION_ACTIVE) {
                unset($_SESSION['login_rate_limit']);
            }
        }

        $intentosIp = $datosIp['intentos'] ?? 0;
        $intentosSesion = $datosSesion['intentos'] ?? 0;
        $intentos = max($intentosIp, $intentosSesion);

        $ultimoIntentoIp = $datosIp['ultimo_intento'] ?? 0;
        $ultimoIntentoSesion = $datosSesion['ultimo_intento'] ?? 0;
        $ultimoIntento = max($ultimoIntentoIp, $ultimoIntentoSesion);

        if ($intentos >= 5) {
            $segundosTranscurridos = $ahora - $ultimoIntento;
            if ($segundosTranscurridos < 60) {
                return [
                    'status'  => 'error',
                    'codigo'  => 429,
                    'mensaje' => 'Demasiados intentos fallidos. Por seguridad, espera 60 segundos antes de reintentar.'
                ];
            }
        }

        return null;
    }

    /**
     * Registra un intento fallido de autenticación tanto en la caché temporal de IP como en la sesión.
     */
    public static function registrarIntentoFallido(?string $ip = null): void {
        $ip = $ip ?: self::obtenerIpCliente();
        $ahora = time();
        $archivo = self::obtenerRutaRateLimit($ip);
        $datos = null;

        if (file_exists($archivo)) {
            $raw = @file_get_contents($archivo);
            if ($raw) {
                $datos = json_decode($raw, true);
            }
        }

        if (!$datos || !isset($datos['primer_intento']) || ($ahora - $datos['primer_intento'] > 600)) {
            $datos = [
                'intentos'       => 1,
                'primer_intento' => $ahora,
                'ultimo_intento' => $ahora
            ];
        } else {
            $datos['intentos'] = ($datos['intentos'] ?? 0) + 1;
            $datos['ultimo_intento'] = $ahora;
        }

        @file_put_contents($archivo, json_encode($datos), LOCK_EX);

        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION['login_rate_limit'] = $datos;
        }
    }

    /**
     * Reinicia el contador de intentos fallidos al completarse un login exitoso.
     */
    public static function reiniciarIntentosFallidos(?string $ip = null): void {
        $ip = $ip ?: self::obtenerIpCliente();
        $archivo = self::obtenerRutaRateLimit($ip);
        if (file_exists($archivo)) {
            @unlink($archivo);
        }
        if (session_status() === PHP_SESSION_ACTIVE) {
            unset($_SESSION['login_rate_limit']);
        }
    }

    /**
     * Procesa el inicio de sesión del usuario con protección contra ataques de fuerza bruta.
     */
    public function login(string $email, string $password): array {
        Session::iniciar();
        $ip = self::obtenerIpCliente();

        // Verificar si la IP o sesión excede el rate limit
        $bloqueo = self::verificarRateLimit($ip);
        if ($bloqueo !== null) {
            return $bloqueo;
        }

        $email    = trim($email);
        $password = trim($password);

        if (empty($email) || empty($password)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Por favor ingresa tu correo y contraseña.'
            ];
        }

        try {
            $stmt = $this->db->prepare("SELECT id, negocio, email, password FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $fila = $stmt->fetch();

            if (!$fila) {
                self::registrarIntentoFallido($ip);
                return [
                    'status'  => 'error',
                    'codigo'  => 401,
                    'mensaje' => 'Correo electrónico o contraseña incorrectos.'
                ];
            }

            $usuario = new Usuario($fila['negocio'], $fila['email'], $fila['password'], (int)$fila['id']);

            if (!$usuario->verificarPassword($password)) {
                self::registrarIntentoFallido($ip);
                return [
                    'status'  => 'error',
                    'codigo'  => 401,
                    'mensaje' => 'Correo electrónico o contraseña incorrectos.'
                ];
            }

            // Inicio de sesión exitoso: reiniciar contador de intentos fallidos
            self::reiniciarIntentosFallidos($ip);

            // Regenerar ID de sesión para mitigar Session Fixation (OWASP)
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_regenerate_id(true);
            }

            // Iniciar sesión segura con cookies HttpOnly / SameSite
            $_SESSION['usuario_id'] = $usuario->getId();
            $_SESSION['negocio']    = $usuario->getNegocio();
            $_SESSION['email']      = $usuario->getEmail();

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => '¡Bienvenido de vuelta!',
                'usuario' => $usuario->toArray()
            ];

        } catch (PDOException $e) {
            error_log("Error PDO en login: " . $e->getMessage());
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Ocurrió un error en el servidor al intentar iniciar sesión. Por favor reintenta.'
            ];
        }
    }

    /**
     * Procesa el registro de un nuevo usuario e inicializa sus datos iniciales.
     */
    public function registrar(
        string $negocio,
        string $email,
        string $password,
        bool $aceptoTerminos = true,
        bool $aceptoPrivacidad = true,
        ?string $ipRegistro = null
    ): array {
        $negocio  = trim($negocio);
        $email    = trim($email);
        $password = trim($password);

        if (!$aceptoTerminos) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Debes aceptar los Términos y Condiciones de Uso del servicio.'
            ];
        }

        if (!$aceptoPrivacidad) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Debes autorizar el tratamiento de datos personales conforme a la Política de Privacidad (Habeas Data).'
            ];
        }

        if (empty($negocio) || empty($email) || empty($password)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'Por favor completa todos los campos obligatorios.'
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'El correo electrónico ingresado no tiene un formato válido.'
            ];
        }

        if (strlen($password) < 8) {
            return [
                'status'  => 'error',
                'codigo'  => 400,
                'mensaje' => 'La contraseña debe tener al menos 8 caracteres.'
            ];
        }

        try {
            // Verificar si el correo ya existe
            $stmtCheck = $this->db->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmtCheck->execute([$email]);

            if ($stmtCheck->fetch()) {
                return [
                    'status'  => 'error',
                    'codigo'  => 409,
                    'mensaje' => 'Este correo electrónico ya se encuentra registrado.'
                ];
            }

            // Iniciar transacción para crear usuario y sembrar datos iniciales
            $this->db->beginTransaction();

            $usuario = new Usuario($negocio, $email, $password);
            $usuario->hashearPassword();

            $ipAudit = $ipRegistro ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');

            $stmtInsert = $this->db->prepare("
                INSERT INTO usuarios (negocio, email, password, acepto_terminos, acepto_privacidad, ip_registro, fecha_aceptacion)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmtInsert->execute([
                $usuario->getNegocio(),
                $usuario->getEmail(),
                $usuario->getPassword(),
                $aceptoTerminos ? 1 : 0,
                $aceptoPrivacidad ? 1 : 0,
                $ipAudit
            ]);

            $nuevoId = (int)$this->db->lastInsertId();

            // Sembrar datos iniciales para el nuevo usuario
            $this->sembrarDatosIniciales($nuevoId);

            $this->db->commit();

            // Iniciar sesión segura con cookies HttpOnly / SameSite
            Session::iniciar();
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_regenerate_id(true);
            }
            $_SESSION['usuario_id'] = $nuevoId;
            $_SESSION['negocio']    = $usuario->getNegocio();
            $_SESSION['email']      = $usuario->getEmail();

            return [
                'status'  => 'success',
                'codigo'  => 200,
                'mensaje' => '¡Cuenta creada con éxito!',
                'usuario' => [
                    'id'      => $nuevoId,
                    'negocio' => $usuario->getNegocio(),
                    'email'   => $usuario->getEmail()
                ]
            ];

        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Error PDO en registro: " . $e->getMessage());
            return [
                'status'  => 'error',
                'codigo'  => 500,
                'mensaje' => 'Error en el servidor al registrar el usuario. Por favor verifica la conexión a la base de datos.'
            ];
        }
    }

    /**
     * Siembra insumos y productos base en la cuenta de un usuario recién creado.
     */
    private function sembrarDatosIniciales(int $usuarioId): void {
        $insumosBase = [
            ['Harina de trigo',  'kg',     3200.00],
            ['Levadura seca',    'g',      45.00],
            ['Mantequilla',      'g',      18.00],
            ['Azúcar blanca',     'kg',     2800.00],
            ['Huevo',             'unidad', 350.00],
            ['Chocolate amargo',  'g',      62.00],
            ['Leche entera',      'l',      4200.00],
            ['Café molido',       'g',      55.00],
            ['Queso campesino',   'g',      24.00],
            ['Avena en hojuelas', 'g',      9.00],
        ];

        $insumoIds = [];
        $stmtIns = $this->db->prepare("
            INSERT INTO insumos (usuario_id, nombre, unidad, precio)
            VALUES (?, ?, ?, ?)
        ");

        foreach ($insumosBase as $idx => $ins) {
            $stmtIns->execute([$usuarioId, $ins[0], $ins[1], $ins[2]]);
            $insumoIds[$idx + 1] = (int)$this->db->lastInsertId();
        }

        $stmtProd = $this->db->prepare("
            INSERT INTO productos (usuario_id, nombre, modo, valor_modo, tipo_margen, unidades_producidas, costo_empaque, porcentaje_merma, costo_mano_obra, precio_venta_anterior)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtItem = $this->db->prepare("
            INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta)
            VALUES (?, ?, ?, ?)
        ");

        // Pan artesanal
        $stmtProd->execute([$usuarioId, 'Pan artesanal', 'margen', 35.00, 'venta', 10, 50.00, 5.00, 800.00, 821.92]);
        $p1 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p1, $insumoIds[1], 500, 'g']);
        $stmtItem->execute([$p1, $insumoIds[2], 10,  'g']);
        $stmtItem->execute([$p1, $insumoIds[3], 100, 'g']);

        // Torta de chocolate
        $stmtProd->execute([$usuarioId, 'Torta de chocolate', 'margen', 38.00, 'venta', 1, 1800.00, 4.00, 3200.00, 34836.13]);
        $p2 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p2, $insumoIds[1], 300,  'g']);
        $stmtItem->execute([$p2, $insumoIds[3], 200,  'g']);
        $stmtItem->execute([$p2, $insumoIds[4], 0.25, 'kg']);
        $stmtItem->execute([$p2, $insumoIds[5], 4,    'unidad']);
        $stmtItem->execute([$p2, $insumoIds[6], 150,  'g']);

        // Galletas de avena
        $stmtProd->execute([$usuarioId, 'Galletas de avena', 'margen', 40.00, 'venta', 24, 35.00, 3.00, 700.00, 397.35]);
        $p3 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p3, $insumoIds[1],  200, 'g']);
        $stmtItem->execute([$p3, $insumoIds[10], 150, 'g']);
        $stmtItem->execute([$p3, $insumoIds[3],  80,  'g']);
        $stmtItem->execute([$p3, $insumoIds[4],  0.1, 'kg']);
        $stmtItem->execute([$p3, $insumoIds[5],  1,   'unidad']);

        // Croissant de mantequilla
        $stmtProd->execute([$usuarioId, 'Croissant de mantequilla', 'margen', 40.00, 'venta', 12, 120.00, 6.00, 2200.00, 1780.94]);
        $p4 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p4, $insumoIds[1], 600, 'g']);
        $stmtItem->execute([$p4, $insumoIds[2], 15,  'g']);
        $stmtItem->execute([$p4, $insumoIds[3], 250, 'g']);
        $stmtItem->execute([$p4, $insumoIds[7], 250, 'ml']);
        $stmtItem->execute([$p4, $insumoIds[4], 60,  'g']);
        $stmtItem->execute([$p4, $insumoIds[5], 1,   'unidad']);

        // Pan de queso campesino
        $stmtProd->execute([$usuarioId, 'Pan de queso campesino', 'margen', 35.00, 'venta', 12, 90.00, 4.00, 1800.00, 1981.23]);
        $p5 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p5, $insumoIds[1], 400, 'g']);
        $stmtItem->execute([$p5, $insumoIds[9], 350, 'g']);
        $stmtItem->execute([$p5, $insumoIds[3], 60,  'g']);
        $stmtItem->execute([$p5, $insumoIds[5], 2,   'unidad']);
        $stmtItem->execute([$p5, $insumoIds[7], 150, 'ml']);

        // Capuchino artesanal (12 oz)
        $stmtProd->execute([$usuarioId, 'Capuchino artesanal (12 oz)', 'margen', 45.00, 'venta', 1, 420.00, 5.00, 550.00, 5471.09]);
        $p6 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p6, $insumoIds[8], 18,  'g']);
        $stmtItem->execute([$p6, $insumoIds[7], 220, 'ml']);
        $stmtItem->execute([$p6, $insumoIds[4], 10,  'g']);

        // Brownie de chocolate
        $stmtProd->execute([$usuarioId, 'Brownie de chocolate', 'multiplicador', 2.20, 'costo', 16, 60.00, 2.00, 0.00, 2529.43]);
        $p7 = (int)$this->db->lastInsertId();
        $stmtItem->execute([$p7, $insumoIds[6], 200, 'g']);
        $stmtItem->execute([$p7, $insumoIds[3], 150, 'g']);
        $stmtItem->execute([$p7, $insumoIds[4], 200, 'g']);
        $stmtItem->execute([$p7, $insumoIds[5], 3,   'unidad']);
        $stmtItem->execute([$p7, $insumoIds[1], 120, 'g']);
    }
}
