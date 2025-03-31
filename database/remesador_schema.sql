-- Script de creación de base de datos para el sistema de remesas
-- Base de datos: remesador_db

CREATE TABLE paises (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_iso CHAR(5) NOT NULL,
    moneda VARCHAR(50) NOT NULL,
    codigo_moneda CHAR(5) NOT NULL,
    simbolo_moneda VARCHAR(5)
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    identificacion VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    pais_id INTEGER REFERENCES paises(id)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    clave_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE bancos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pais_id INTEGER REFERENCES paises(id)
);

CREATE TABLE cuentas_bancarias (
    id SERIAL PRIMARY KEY,
    banco_id INTEGER REFERENCES bancos(id),
    cliente_id INTEGER REFERENCES clientes(id),
    numero_cuenta VARCHAR(50) NOT NULL,
    nombre_titular VARCHAR(100),
    tipo_cuenta VARCHAR(20),
    moneda VARCHAR(10)
);

CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pais_id INTEGER REFERENCES paises(id),
    saldo_inicial NUMERIC(12,2),
    saldo_actual NUMERIC(12,2),
    descripcion TEXT
);

CREATE TABLE tasas_cambios (
    id SERIAL PRIMARY KEY,
    pais_origen_id INTEGER REFERENCES paises(id),
    pais_destino_id INTEGER REFERENCES paises(id),
    tasa NUMERIC(12,4) NOT NULL,
    fecha_actualizacion DATE DEFAULT CURRENT_DATE
);

CREATE TABLE remesas (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id INTEGER REFERENCES clientes(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    pais_origen_id INTEGER REFERENCES paises(id),
    pais_destino_id INTEGER REFERENCES paises(id),
    monto_origen NUMERIC(12,2),
    monto_destino NUMERIC(12,2),
    tasa_cambio NUMERIC(12,4),
    comision NUMERIC(12,2),
    ganancia NUMERIC(12,2),
    estado VARCHAR(20),
    wallet_origen_id INTEGER REFERENCES wallets(id),
    wallet_destino_id INTEGER REFERENCES wallets(id),
    cuenta_bancaria_id INTEGER REFERENCES cuentas_bancarias(id),
    beneficiario_nombre VARCHAR(100),
    notas TEXT
);

-- Datos de prueba
INSERT INTO paises (nombre, codigo_iso, moneda, codigo_moneda, simbolo_moneda) VALUES
('Estados Unidos', 'US', 'Dólar Estadounidense', 'USD', '$'),
('México', 'MX', 'Peso Mexicano', 'MXN', '$'),
('Guatemala', 'GT', 'Quetzal', 'GTQ', 'Q');

INSERT INTO clientes (nombre_completo, identificacion, telefono, email, direccion, pais_id) VALUES
('Juan Pérez', '123456789', '5551234567', 'juan@example.com', 'Calle Falsa 123', 1),
('María Gómez', '987654321', '5559876543', 'maria@example.com', 'Av. Siempre Viva 742', 2);

INSERT INTO usuarios (usuario, clave_hash, rol, cliente_id) VALUES
('admin', 'hashedpassword1', 'operador', NULL),
('jperez', 'hashedpassword2', 'cliente', 1);

INSERT INTO bancos (nombre, pais_id) VALUES
('Banco Nacional de México', 2),
('Banco de Guatemala', 3);

INSERT INTO cuentas_bancarias (banco_id, cliente_id, numero_cuenta, nombre_titular, tipo_cuenta, moneda) VALUES
(1, 1, '1234567890', 'Juan Pérez', 'ahorros', 'MXN'),
(2, 2, '9876543210', 'María Gómez', 'corriente', 'GTQ');

INSERT INTO wallets (nombre, pais_id, saldo_inicial, saldo_actual, descripcion) VALUES
('Caja USD Efectivo', 1, 10000, 10000, 'Caja operativa en efectivo en USD'),
('Fondo MXN Banco', 2, 50000, 50000, 'Cuenta bancaria MXN');

INSERT INTO tasas_cambios (pais_origen_id, pais_destino_id, tasa) VALUES
(1, 2, 17.5000),
(1, 3, 7.7500);

INSERT INTO remesas (
    cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
    monto_destino, tasa_cambio, comision, ganancia, estado,
    wallet_origen_id, wallet_destino_id, cuenta_bancaria_id, beneficiario_nombre, notas
) VALUES (
    1, 1, 1, 2, 100.00, 1750.00, 17.5000, 5.00, 20.00, 'Completada',
    1, 2, 1, 'Carlos López', 'Pago rápido vía banco'
);
