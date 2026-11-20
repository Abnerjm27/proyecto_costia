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
    config_gastos TEXT NULL DEFAULT NULL,
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
(6, 1, 'Chocolate amargo', 'g', 62.00),
(7, 1, 'Leche entera', 'l', 4200.00),
(8, 1, 'Café molido', 'g', 55.00),
(9, 1, 'Queso campesino', 'g', 24.00),
(10, 1, 'Avena en hojuelas', 'g', 9.00)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), unidad=VALUES(unidad), precio=VALUES(precio);

-- Productos de prueba para el usuario 1
INSERT INTO productos (id, usuario_id, nombre, modo, valor_modo, tipo_margen, unidades_producidas, costo_empaque, porcentaje_merma, costo_mano_obra, precio_venta_anterior) VALUES
(1, 1, 'Pan artesanal', 'margen', 35.00, 'venta', 10, 50.00, 5.00, 800.00, 821.92),
(2, 1, 'Torta de chocolate', 'margen', 38.00, 'venta', 1, 1800.00, 4.00, 3200.00, 34836.13),
(3, 1, 'Galletas de avena', 'margen', 40.00, 'venta', 24, 35.00, 3.00, 700.00, 397.35),
(4, 1, 'Croissant de mantequilla', 'margen', 40.00, 'venta', 12, 120.00, 6.00, 2200.00, 1780.94),
(5, 1, 'Pan de queso campesino', 'margen', 35.00, 'venta', 12, 90.00, 4.00, 1800.00, 1981.23),
(6, 1, 'Capuchino artesanal (12 oz)', 'margen', 45.00, 'venta', 1, 420.00, 5.00, 550.00, 5471.09),
(7, 1, 'Brownie de chocolate', 'multiplicador', 2.20, 'costo', 16, 60.00, 2.00, 0.00, 2529.43)
ON DUPLICATE KEY UPDATE
    nombre=VALUES(nombre),
    modo=VALUES(modo),
    valor_modo=VALUES(valor_modo),
    tipo_margen=VALUES(tipo_margen),
    unidades_producidas=VALUES(unidades_producidas),
    costo_empaque=VALUES(costo_empaque),
    porcentaje_merma=VALUES(porcentaje_merma),
    costo_mano_obra=VALUES(costo_mano_obra),
    precio_venta_anterior=VALUES(precio_venta_anterior);

-- Items de receta de prueba
DELETE FROM receta_items WHERE producto_id IN (1, 2, 3, 4, 5, 6, 7);

-- Receta 1: Pan artesanal
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(1, 1, 500.0000, 'g'),
(1, 2, 10.0000, 'g'),
(1, 3, 100.0000, 'g');

-- Receta 2: Torta de chocolate
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(2, 1, 300.0000, 'g'),
(2, 3, 200.0000, 'g'),
(2, 4, 0.2500, 'kg'),
(2, 5, 4.0000, 'unidad'),
(2, 6, 150.0000, 'g');

-- Receta 3: Galletas de avena
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(3, 1, 200.0000, 'g'),
(3, 10, 150.0000, 'g'),
(3, 3, 80.0000, 'g'),
(3, 4, 0.1000, 'kg'),
(3, 5, 1.0000, 'unidad');

-- Receta 4: Croissant de mantequilla
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(4, 1, 600.0000, 'g'),
(4, 2, 15.0000, 'g'),
(4, 3, 250.0000, 'g'),
(4, 7, 250.0000, 'ml'),
(4, 4, 60.0000, 'g'),
(4, 5, 1.0000, 'unidad');

-- Receta 5: Pan de queso campesino
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(5, 1, 400.0000, 'g'),
(5, 9, 350.0000, 'g'),
(5, 3, 60.0000, 'g'),
(5, 5, 2.0000, 'unidad'),
(5, 7, 150.0000, 'ml');

-- Receta 6: Capuchino artesanal (12 oz)
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(6, 8, 18.0000, 'g'),
(6, 7, 220.0000, 'ml'),
(6, 4, 10.0000, 'g');

-- Receta 7: Brownie de chocolate
INSERT INTO receta_items (producto_id, insumo_id, cantidad, unidad_receta) VALUES
(7, 6, 200.0000, 'g'),
(7, 3, 150.0000, 'g'),
(7, 4, 200.0000, 'g'),
(7, 5, 3.0000, 'unidad'),
(7, 1, 120.0000, 'g');
