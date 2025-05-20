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

-- Crear tabla de metodos (antes paises)
CREATE TABLE metodos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    moneda VARCHAR(50),
    tasa_base DECIMAL(12,4) NOT NULL,
    comision_porcentaje DECIMAL(5,2) DEFAULT 0,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Crear tabla de proveedores
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    metodo_id INT NOT NULL,
    telefono VARCHAR(30),
    correo VARCHAR(100),
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (metodo_id) REFERENCES metodos(id) ON DELETE CASCADE
);

-- Clientes (referencia a metodos)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    identificacion VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    metodo_id INT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (metodo_id) REFERENCES metodos(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Bancos (referencia a metodos)
CREATE TABLE bancos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    metodo_id INT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (metodo_id) REFERENCES metodos(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Cuentas bancarias
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

-- Wallets (referencia a metodos)
CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    metodo_id INT,
    saldo_inicial DECIMAL(12,2),
    saldo_actual DECIMAL(12,2),
    descripcion TEXT,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (metodo_id) REFERENCES metodos(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tasas de cambio (referencia a metodos)
CREATE TABLE tasas_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metodo_origen_id INT,
    metodo_destino_id INT,
    tasa DECIMAL(12,4) NOT NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (metodo_origen_id) REFERENCES metodos(id) ON DELETE CASCADE,
    FOREIGN KEY (metodo_destino_id) REFERENCES metodos(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Remesas (referencia a metodos)
CREATE TABLE remesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id INT,
    usuario_id INT,
    metodo_origen_id INT,
    metodo_destino_id INT,
    monto_origen DECIMAL(12,2),
    monto_destino DECIMAL(12,2),
    tasa_cambio DECIMAL(12,4),
    comision DECIMAL(12,2),
    ganancia DECIMAL(12,2),
    estado VARCHAR(20),
    wallet_origen_id INT,
    wallet_destino_id INT,
    cuenta_bancaria_id INT,
    notas TEXT,
    proveedor_id INT,
    nombre_destinatario VARCHAR(100),
    cedula_destinatario VARCHAR(50),
    cuenta_banco_destinatario VARCHAR(100),
    monto_recibir DECIMAL(12,2),
    owner_id INT,
    misc1 VARCHAR(255),
    misc2 VARCHAR(255),
    misc3 VARCHAR(255),
    misc4 VARCHAR(255),
    misc5 VARCHAR(255),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (metodo_origen_id) REFERENCES metodos(id) ON DELETE SET NULL,
    FOREIGN KEY (metodo_destino_id) REFERENCES metodos(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_origen_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_destino_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Crear tabla comprobantes_remesa
CREATE TABLE comprobantes_remesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remesa_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    tipo_pago ENUM('cliente','operador') NOT NULL,
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

-- Script para borrar todas las tablas
DROP TABLE IF EXISTS remesas;
DROP TABLE IF EXISTS tasas_cambios;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS cuentas_bancarias;
DROP TABLE IF EXISTS bancos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS metodos;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS comprobantes_remesa;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS usuarios;

-- Datos de prueba

-- Usuarios
INSERT INTO usuarios (id, usuario, clave_hash, rol, activo) VALUES
(1, 'admin', 'admin123', 'owner', 1),
(2, 'operador1', 'operador123', 'operador', 1),
(3, 'cliente1', 'cliente123', 'cliente', 1);

-- Métodos (paises/metodos)
INSERT INTO metodos (id, nombre, moneda, tasa_base, comision_porcentaje, owner_id) VALUES
(1, 'México', 'MXN', 20.00, 3.00, 1),
(2, 'USA', 'USD', 1.00, 2.00, 1),
(3, 'USDT', 'USDT', 1.00, 1.00, 1);

-- Proveedores
INSERT INTO proveedores (nombre, metodo_id, telefono, correo) VALUES
('Proveedor MX', 1, '555-111-2222', 'mx@proveedor.com'),
('Proveedor USA', 2, '555-333-4444', 'usa@proveedor.com');

-- Clientes
INSERT INTO clientes (id, nombre_completo, identificacion, telefono, email, direccion, metodo_id, owner_id) VALUES
(1, 'Juan Pérez', '123456789', '5551234567', 'juan@example.com', 'Calle Falsa 123', 1, 1),
(2, 'María Gómez', '987654321', '5559876543', 'maria@example.com', 'Av. Siempre Viva 742', 2, 1);

-- Bancos
INSERT INTO bancos (id, nombre, metodo_id, owner_id) VALUES
(1, 'Banco Nacional de México', 1, 1),
(2, 'Bank of America', 2, 1);

-- Cuentas bancarias
INSERT INTO cuentas_bancarias (id, banco_id, cliente_id, numero_cuenta, nombre_titular, tipo_cuenta, moneda, owner_id) VALUES
(1, 1, 1, '1234567890', 'Juan Pérez', 'ahorros', 'MXN', 1),
(2, 2, 2, '9876543210', 'María Gómez', 'corriente', 'USD', 1);

-- Wallets
INSERT INTO wallets (id, nombre, metodo_id, saldo_inicial, saldo_actual, descripcion, owner_id) VALUES
(1, 'Caja USD Efectivo', 2, 10000, 10000, 'Caja operativa en efectivo en USD', 1),
(2, 'Fondo MXN Banco', 1, 50000, 50000, 'Cuenta bancaria MXN', 1);

-- Tasas de cambio
INSERT INTO tasas_cambios (metodo_origen_id, metodo_destino_id, tasa, owner_id) VALUES
(1, 2, 0.05, 1),
(2, 1, 20.00, 1),
(2, 3, 1.00, 1),
(3, 1, 20.00, 1);

-- Remesas
INSERT INTO remesas (
    id, cliente_id, usuario_id, metodo_origen_id, metodo_destino_id, monto_origen,
    monto_destino, tasa_cambio, comision, ganancia, estado,
    wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
    notas, proveedor_id, nombre_destinatario, cedula_destinatario,
    cuenta_banco_destinatario, monto_recibir, owner_id
) VALUES
(1, 1, 1, 1, 2, 2000.00, 100.00, 0.05, 60.00, 10.00, 'Completada', 2, 1, 1, 'Pago rápido vía banco', 1, 'Carlos López', '123456789', '1234567890', 100.00, 1),
(2, 2, 2, 2, 1, 100.00, 2000.00, 20.00, 5.00, 15.00, 'Pendiente', 1, 2, 2, 'Remesa mensual', 2, 'Ana Ruiz', '987654321', '9876543210', 2000.00, 1);
