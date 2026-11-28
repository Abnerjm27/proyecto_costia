<?php
/**
 * Database.php
 * Clase para gestionar la conexión a la base de datos MySQL mediante el patrón Singleton.
 * Admite variables de entorno o valores por defecto para entornos locales como XAMPP.
 */

class Database {
    private static ?PDO $conexion = null;

    // Constructor privado para evitar instanciación directa
    private function __construct() {}

    /**
     * Retorna la única instancia de la conexión PDO.
     */
    public static function getConnection(): PDO {
        if (self::$conexion === null) {
            $host    = getenv('DB_HOST') ?: '127.0.0.1';
            $dbname  = getenv('DB_NAME') ?: 'costia_db';
            $usuario = getenv('DB_USER') ?: 'root';
            $clave   = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
            $puerto  = getenv('DB_PORT') ?: '3306';

            try {
                $pdo = new PDO(
                    "mysql:host={$host};port={$puerto};charset=utf8mb4",
                    $usuario,
                    $clave,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ]
                );

                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $pdo->exec("USE `{$dbname}`");

                self::asegurarEsquema($pdo);
                self::$conexion = $pdo;
            } catch (PDOException $e) {
                // Registrar log interno y lanzar mensaje amigable
                error_log("Error de conexión PDO: " . $e->getMessage());
                throw new PDOException("No se pudo conectar a la base de datos MySQL ({$dbname}). Verifica que Apache y MySQL estén iniciados en XAMPP.", (int)$e->getCode());
            }
        }

        return self::$conexion;
    }

    /**
     * Verifica y actualiza automáticamente el esquema de tablas si proviene de una versión anterior.
     */
    private static function asegurarEsquema(PDO $pdo): void {
        // 1. Tabla usuarios
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                negocio VARCHAR(100) NOT NULL,
                config_gastos TEXT NULL DEFAULT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $colsUsuarios = $pdo->query("SHOW COLUMNS FROM usuarios")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('config_gastos', $colsUsuarios, true)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN config_gastos TEXT NULL DEFAULT NULL AFTER negocio");
        }
        if (!in_array('acepto_terminos', $colsUsuarios, true)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN acepto_terminos TINYINT(1) NOT NULL DEFAULT 1 AFTER password");
        }
        if (!in_array('acepto_privacidad', $colsUsuarios, true)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN acepto_privacidad TINYINT(1) NOT NULL DEFAULT 1 AFTER acepto_terminos");
        }
        if (!in_array('ip_registro', $colsUsuarios, true)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN ip_registro VARCHAR(45) NULL AFTER acepto_privacidad");
        }
        if (!in_array('fecha_aceptacion', $colsUsuarios, true)) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN fecha_aceptacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ip_registro");
        }

        // 2. Tabla insumos
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS insumos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL DEFAULT 1,
                nombre VARCHAR(150) NOT NULL,
                unidad VARCHAR(30) NOT NULL,
                precio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_insumos_usuario (usuario_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $colsInsumos = $pdo->query("SHOW COLUMNS FROM insumos")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('usuario_id', $colsInsumos, true)) {
            $pdo->exec("ALTER TABLE insumos ADD COLUMN usuario_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_insumos_usuario (usuario_id)");
        }
        if (!in_array('created_at', $colsInsumos, true)) {
            $pdo->exec("ALTER TABLE insumos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        }
        if (!in_array('updated_at', $colsInsumos, true)) {
            $pdo->exec("ALTER TABLE insumos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        }

        // 3. Tabla productos
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL DEFAULT 1,
                nombre VARCHAR(150) NOT NULL,
                modo ENUM('margen', 'multiplicador') NOT NULL DEFAULT 'margen',
                valor_modo DECIMAL(8, 2) NOT NULL DEFAULT 30.00,
                tipo_margen ENUM('costo', 'venta') NOT NULL DEFAULT 'costo',
                unidades_producidas INT NOT NULL DEFAULT 1,
                costo_empaque DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                porcentaje_merma DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                costo_mano_obra DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                precio_venta_anterior DECIMAL(12, 2) NULL DEFAULT NULL,
                costo_snapshot DECIMAL(12, 2) NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_productos_usuario (usuario_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $colsProductos = $pdo->query("SHOW COLUMNS FROM productos")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('usuario_id', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN usuario_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_productos_usuario (usuario_id)");
        }
        if (!in_array('modo', $colsProductos, true)) {
            if (in_array('modo_calculo', $colsProductos, true)) {
                $pdo->exec("ALTER TABLE productos CHANGE COLUMN modo_calculo modo ENUM('margen', 'multiplicador') NOT NULL DEFAULT 'margen'");
            } else {
                $pdo->exec("ALTER TABLE productos ADD COLUMN modo ENUM('margen', 'multiplicador') NOT NULL DEFAULT 'margen' AFTER nombre");
            }
        }
        if (!in_array('tipo_margen', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN tipo_margen ENUM('costo', 'venta') NOT NULL DEFAULT 'costo' AFTER valor_modo");
        }
        if (!in_array('costo_empaque', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN costo_empaque DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER unidades_producidas");
        }
        if (!in_array('porcentaje_merma', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN porcentaje_merma DECIMAL(5, 2) NOT NULL DEFAULT 0.00 AFTER costo_empaque");
        }
        if (!in_array('costo_mano_obra', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN costo_mano_obra DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER porcentaje_merma");
        }
        if (!in_array('precio_venta_anterior', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN precio_venta_anterior DECIMAL(12, 2) NULL DEFAULT NULL AFTER costo_mano_obra");
        }
        if (!in_array('costo_snapshot', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN costo_snapshot DECIMAL(12, 2) NULL DEFAULT NULL AFTER precio_venta_anterior");
        }
        if (!in_array('created_at', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        }
        if (!in_array('updated_at', $colsProductos, true)) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        }

        // 4. Tabla receta_items
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS receta_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT NOT NULL,
                insumo_id INT NOT NULL,
                cantidad DECIMAL(12, 4) NOT NULL,
                unidad_receta VARCHAR(30) NOT NULL,
                INDEX idx_receta_producto (producto_id),
                INDEX idx_receta_insumo (insumo_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // 5. Tabla ofertas_cierre (Vitrina de Liquidación de Excedentes)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ofertas_cierre (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                producto_id INT NULL,
                negocio_nombre VARCHAR(120) NOT NULL,
                producto_nombre VARCHAR(150) NOT NULL,
                categoria ENUM('panaderia','pasteleria','cafeteria','empacados') NOT NULL DEFAULT 'panaderia',
                precio_regular DECIMAL(12, 2) NOT NULL,
                costo_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                precio_oferta DECIMAL(12, 2) NOT NULL,
                unidades_disponibles INT NOT NULL DEFAULT 1,
                horario_recogida VARCHAR(80) NOT NULL,
                pais VARCHAR(80) NOT NULL DEFAULT 'Colombia',
                departamento VARCHAR(80) NOT NULL DEFAULT 'Bogotá D.C.',
                municipio VARCHAR(80) NOT NULL DEFAULT 'Bogotá',
                direccion_recogida VARCHAR(200) NOT NULL,
                contacto_publico VARCHAR(80) NOT NULL,
                alergenos VARCHAR(255) NULL DEFAULT '',
                nota_frescura VARCHAR(200) NULL DEFAULT 'Excedente del día · 100% apto para consumo',
                imagen_url MEDIUMTEXT NULL DEFAULT NULL,
                latitud DECIMAL(10, 7) NULL DEFAULT NULL,
                longitud DECIMAL(10, 7) NULL DEFAULT NULL,
                declaracion_sanitaria TINYINT(1) NOT NULL DEFAULT 1,
                expira_en DATETIME NOT NULL,
                estado ENUM('activa','agotada','retirada','reportada') NOT NULL DEFAULT 'activa',
                motivo_reporte VARCHAR(255) NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ofertas_usuario (usuario_id),
                INDEX idx_ofertas_estado_expira (estado, expira_en)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $colsOfertas = $pdo->query("SHOW COLUMNS FROM ofertas_cierre")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('imagen_url', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN imagen_url MEDIUMTEXT NULL DEFAULT NULL AFTER nota_frescura");
        }
        if (!in_array('latitud', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN latitud DECIMAL(10, 7) NULL DEFAULT NULL AFTER imagen_url");
        }
        if (!in_array('longitud', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN longitud DECIMAL(10, 7) NULL DEFAULT NULL AFTER latitud");
        }
        if (!in_array('pais', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN pais VARCHAR(80) NOT NULL DEFAULT 'Colombia' AFTER horario_recogida");
        }
        if (!in_array('departamento', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN departamento VARCHAR(80) NOT NULL DEFAULT 'Bogotá D.C.' AFTER pais");
        }
        if (!in_array('municipio', $colsOfertas, true)) {
            $pdo->exec("ALTER TABLE ofertas_cierre ADD COLUMN municipio VARCHAR(80) NOT NULL DEFAULT 'Bogotá' AFTER departamento");
        }
    }
}
