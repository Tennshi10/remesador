-- Script de creación de base de datos para el sistema de remesas
-- Base de datos: remesadordb

-- Crear tabla de usuarios primero
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    clave_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Crear las demás tablas
CREATE TABLE paises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_iso CHAR(5) NOT NULL,
    moneda VARCHAR(50) NOT NULL,
    codigo_moneda CHAR(5) NOT NULL,
    simbolo_moneda VARCHAR(5),
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    identificacion VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    pais_id INT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE bancos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pais_id INT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE cuentas_bancarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    banco_id INT,
    cliente_id INT,
    numero_cuenta VARCHAR(50) NOT NULL,
    nombre_titular VARCHAR(100),
    tipo_cuenta VARCHAR(20),
    moneda VARCHAR(10),
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (banco_id) REFERENCES bancos(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pais_id INT,
    saldo_inicial DECIMAL(12,2),
    saldo_actual DECIMAL(12,2),
    descripcion TEXT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE tasas_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pais_origen_id INT,
    pais_destino_id INT,
    tasa DECIMAL(12,4) NOT NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (pais_origen_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (pais_destino_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE remesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id INT,
    usuario_id INT,
    pais_origen_id INT,
    pais_destino_id INT,
    monto_origen DECIMAL(12,2),
    monto_destino DECIMAL(12,2),
    tasa_cambio DECIMAL(12,4),
    comision DECIMAL(12,2),
    ganancia DECIMAL(12,2),
    estado VARCHAR(20),
    wallet_origen_id INT,
    wallet_destino_id INT,
    cuenta_bancaria_id INT,
    beneficiario_nombre VARCHAR(100),
    notas TEXT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pais_origen_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (pais_destino_id) REFERENCES paises(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_origen_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_destino_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE comprobantes_remesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remesa_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (remesa_id) REFERENCES remesas(id) ON DELETE CASCADE
);

-- Crear tabla para sesiones de usuarios
CREATE TABLE sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    token VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Datos de prueba
INSERT INTO usuarios (usuario, clave_hash, rol, owner_id) VALUES
('admin', 'hashedpassword1', 'owner', NULL), -- Usuario dueño principal
('jperez', 'hashedpassword2', 'cliente', 1), -- Cliente bajo el dueño admin
('operador1', 'hashedpassword3', 'operador', 1), -- Operador bajo el dueño admin
('revendedor1', 'hashedpassword4', 'revendedor', 1); -- Revendedor bajo el dueño admin

INSERT INTO paises (nombre, codigo_iso, moneda, codigo_moneda, simbolo_moneda, owner_id) VALUES
('Estados Unidos', 'US', 'Dólar Estadounidense', 'USD', '$', 1),
('México', 'MX', 'Peso Mexicano', 'MXN', '$', 1),
('Guatemala', 'GT', 'Quetzal', 'GTQ', 'Q', 1);

INSERT INTO clientes (nombre_completo, identificacion, telefono, email, direccion, pais_id, owner_id) VALUES
('Juan Pérez', '123456789', '5551234567', 'juan@example.com', 'Calle Falsa 123', 1, 1),
('María Gómez', '987654321', '5559876543', 'maria@example.com', 'Av. Siempre Viva 742', 2, 1);

INSERT INTO bancos (nombre, pais_id, owner_id) VALUES
('Banco Nacional de México', 2, 1),
('Banco de Guatemala', 3, 1);

INSERT INTO cuentas_bancarias (banco_id, cliente_id, numero_cuenta, nombre_titular, tipo_cuenta, moneda, owner_id) VALUES
(1, 1, '1234567890', 'Juan Pérez', 'ahorros', 'MXN', 1),
(2, 2, '9876543210', 'María Gómez', 'corriente', 'GTQ', 1);

INSERT INTO wallets (nombre, pais_id, saldo_inicial, saldo_actual, descripcion, owner_id) VALUES
('Caja USD Efectivo', 1, 10000, 10000, 'Caja operativa en efectivo en USD', 1),
('Fondo MXN Banco', 2, 50000, 50000, 'Cuenta bancaria MXN', 1);

INSERT INTO tasas_cambios (pais_origen_id, pais_destino_id, tasa, owner_id) VALUES
(1, 2, 17.5000, 1),
(1, 3, 7.7500, 1);

INSERT INTO remesas (
    cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
    monto_destino, tasa_cambio, comision, ganancia, estado,
    wallet_origen_id, wallet_destino_id, cuenta_bancaria_id, beneficiario_nombre, notas, owner_id
) VALUES (
    1, 1, 1, 2, 100.00, 1750.00, 17.5000, 5.00, 20.00, 'Completada',
    1, 2, 1, 'Carlos López', 'Pago rápido vía banco', 1
);

-- Script para borrar todas las tablas
DROP TABLE IF EXISTS remesas;
DROP TABLE IF EXISTS tasas_cambios;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS cuentas_bancarias;
DROP TABLE IF EXISTS bancos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS paises;
DROP TABLE IF EXISTS comprobantes_remesa;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS usuarios;
