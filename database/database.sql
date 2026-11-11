-- ============================================================
-- Costia — Script de Base de Datos MySQL
-- Sistema de Costeo y Fijación de Precios de Venta
-- ============================================================

CREATE DATABASE IF NOT EXISTS costia_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE costia_db;

-- ------------------------------------------------------------
-- 1. TABLA: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    negocio VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    acepto_terminos TINYINT(1) NOT NULL DEFAULT 1,
    acepto_privacidad TINYINT(1) NOT NULL DEFAULT 1,
    ip_registro VARCHAR(45) NULL,
    fecha_aceptacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. TABLA: insumos (Materias primas por usuario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_insumos_usuario (usuario_id),
    CONSTRAINT fk_insumos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABLA: productos (Fichas de producto por usuario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
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
    INDEX idx_productos_usuario (usuario_id),
    CONSTRAINT fk_productos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABLA: receta_items (Ingredientes y cantidades de cada producto)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receta_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad DECIMAL(12, 4) NOT NULL,
    unidad_receta VARCHAR(30) NOT NULL,
    INDEX idx_receta_producto (producto_id),
    INDEX idx_receta_insumo (insumo_id),
    CONSTRAINT fk_receta_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_receta_insumo
        FOREIGN KEY (insumo_id) REFERENCES insumos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- DATOS DE DEMOSTRACIÓN (Opcional para pruebas)
-- ------------------------------------------------------------
-- Contraseña de prueba: 'admin123' (hasheada con BCRYPT)
INSERT INTO usuarios (id, negocio, email, password)
VALUES (1, 'Panadería El Roble', 'demo@costia.com', '$2y$10$oAodZ/oGW6z5ALTcxTxbPO7fSKLu9DJj3SlMStJqxNCGtdE5stmCK')
ON DUPLICATE KEY UPDATE negocio=VALUES(negocio), password=VALUES(password);

-- Insumos de prueba para el usuario 1
INSERT INTO insumos (id, usuario_id, nombre, unidad, precio) VALUES
(1, 1, 'Harina de trigo', 'kg', 3200.00),
(2, 1, 'Levadura seca', 'g', 45.00),
(3, 1, 'Mantequilla', 'g', 18.00),
(4, 1, 'Azúcar blanca', 'kg', 2800.00),
(5, 1, 'Huevo', 'unidad', 350.00),
(6, 1, 'Chocolate amargo', 'g', 62.00)
ON DUPLICATE KEY UPDATE precio=VALUES(precio);

-- Productos de prueba para el usuario 1
INSERT INTO productos (id, usuario_id, nombre, modo, valor_modo, unidades_producidas, precio_venta_anterior) VALUES
(1, 1, 'Pan artesanal', 'margen', 45.00, 10, 558.25),
(2, 1, 'Torta de chocolate', 'multiplicador', 2.50, 1, 39900.00),
(3, 1, 'Galletas de avena', 'margen', 60.00, 24, 180.67)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), precio_venta_anterior=VALUES(precio_venta_anterior);

-- Items de receta de prueba
DELETE FROM receta_items WHERE producto_id IN (1, 2, 3);

-- Receta: Pan artesanal
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(1, 1, 500.0000, 'g'),
(1, 2, 10.0000, 'g'),
(1, 3, 100.0000, 'g');

-- Receta: Torta de chocolate
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(2, 1, 300.0000, 'g'),
(2, 3, 200.0000, 'g'),
(2, 4, 0.2500, 'kg'),
(2, 5, 4.0000, 'unidad'),
(2, 6, 150.0000, 'g');

-- Receta: Galletas de avena
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(3, 1, 200.0000, 'g'),
(3, 3, 80.0000, 'g'),
(3, 4, 0.1000, 'kg'),
(3, 5, 1.0000, 'unidad');
