const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const app = express();

app.use(cors({
  origin: 'https://latamcambios.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Solo si usas cookies o headers de autenticación personalizados
}));
/*app.use(cors({}));*/


app.use(express.json());

// Servir archivos de comprobantes de forma estática
app.use('/uploads/comprobantes', express.static(path.join(__dirname, 'uploads', 'comprobantes')));

// Configurar conexión a MySQL usando variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'remesadordb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Carpeta para guardar comprobantes
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'comprobantes');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Nombre único: remesaID-timestamp-originalname
    const remesaId = req.body.remesa_id || 'tmp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${remesaId}-${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Middleware para autenticar usuarios y obtener owner_id
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const [rows] = await pool.query(
      `SELECT u.id AS user_id, COALESCE(u.owner_id, u.id) AS owner_id
       FROM sesiones s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.token = ? AND s.fecha_expiracion > CURRENT_TIMESTAMP`,
      [token]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Sesión expirada o inválida' });

    req.userId = rows[0].user_id;
    req.ownerId = rows[0].owner_id; // Asignar el owner_id del usuario autenticado
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al autenticar' });
  }
};

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
  const { usuario, clave } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, clave_hash, rol FROM usuarios WHERE usuario = ?`,
      [usuario]
    );
    if (result[0].length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { id, clave_hash, rol } = result[0][0];
    if (clave !== clave_hash) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = crypto.randomBytes(64).toString('hex');
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await pool.query(
      `INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES (?, ?, ?)`,
      [id, token, fechaExpiracion]
    );

    res.json({ token, rol, user_id: id }); // <-- Devuelve también el id
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener todas las remesas (no mostrar eliminadas)
app.get('/api/remesas', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT r.*,
        c.nombre_completo AS cliente_nombre,
        u.usuario AS operador,
        mo.nombre AS metodo_origen_nombre,
        md.nombre AS metodo_destino_nombre,
        p.nombre AS proveedor_nombre
      FROM remesas r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN metodos mo ON r.metodo_origen_id = mo.id
      LEFT JOIN metodos md ON r.metodo_destino_id = md.id
      LEFT JOIN proveedores p ON r.proveedor_id = p.id
      WHERE r.estado <> 'Eliminada'
      ORDER BY r.fecha_hora DESC
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener remesas' });
  }
});

// Crear una nueva remesa (siempre estado "Comprobar Pago")
app.post('/api/remesas', authenticate, async (req, res) => {
  try {
    const {
      cliente_id, usuario_id, metodo_origen_id, metodo_destino_id, monto_origen,
      monto_destino, tasa_cambio, comision, ganancia,
      wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
      proveedor_id,
      nombre_destinatario, cedula_destinatario, cuenta_banco_destinatario, monto_recibir,
    } = req.body;

    // Validar campos obligatorios
    // Solo exige proveedor_id si viene en el body (operador/admin), no para clientes
    if (
      !cliente_id || !usuario_id || !metodo_origen_id || !metodo_destino_id ||
      !monto_origen || !tasa_cambio ||
      !nombre_destinatario || !cedula_destinatario || !cuenta_banco_destinatario || !monto_recibir
    ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Si el usuario es operador/admin, exige proveedor_id
    if ((req.body.proveedor_id !== undefined && req.body.proveedor_id !== null && req.body.proveedor_id !== '') && !proveedor_id) {
      return res.status(400).json({ error: 'Falta proveedor_id' });
    }

    const [result] = await pool.query(
      `INSERT INTO remesas (
        cliente_id, usuario_id, metodo_origen_id, metodo_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, estado,
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        notas, proveedor_id, nombre_destinatario, cedula_destinatario,
        cuenta_banco_destinatario, monto_recibir, owner_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cliente_id, usuario_id, metodo_origen_id, metodo_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, 'Comprobar Pago',
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        req.body.notas || '', proveedor_id || null, nombre_destinatario, cedula_destinatario,
        cuenta_banco_destinatario, monto_recibir, req.ownerId
      ]
    );

    // Obtener la remesa insertada
    const [rows] = await pool.query(
      `SELECT * FROM remesas WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear remesa:', err);
    res.status(500).json({ error: 'Error al crear remesa' });
  }
});

// Eliminar (marcar como eliminada)
app.delete('/api/remesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE remesas SET estado = 'Eliminada' WHERE id = ?`,
      [id]
    );
    const [rows] = await pool.query(`SELECT * FROM remesas WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar remesa' });
  }
});

// Actualizar remesa
app.put('/api/remesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    // Solo permite actualizar campos válidos de la tabla remesas
    const allowed = [
      'cliente_id', 'usuario_id', 'metodo_origen_id', 'metodo_destino_id', 'monto_origen',
      'monto_destino', 'tasa_cambio', 'comision', 'ganancia', 'estado',
      'wallet_origen_id', 'wallet_destino_id', 'cuenta_bancaria_id',
      'notas', 'proveedor_id', 'nombre_destinatario', 'cedula_destinatario',
      'cuenta_banco_destinatario', 'monto_recibir', 'owner_id',
      'misc1', 'misc2', 'misc3', 'misc4', 'misc5'
    ];
    const updates = [];
    const values = [];
    for (const key of Object.keys(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }
    values.push(id);

    await pool.query(
      `UPDATE remesas SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(`SELECT * FROM remesas WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar remesa' });
  }
});

// Obtener todos los clientes con el nombre del método
app.get('/api/clientes', async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT c.*, m.nombre AS metodo_nombre
      FROM clientes c
      LEFT JOIN metodos m ON c.metodo_id = m.id
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre_completo, identificacion, telefono, email, direccion, metodo_id } = req.body;
    const [result] = await pool.query(
      `INSERT INTO clientes (nombre_completo, identificacion, telefono, email, direccion, metodo_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_completo, identificacion, telefono, email, direccion, metodo_id]
    );
    // Obtener el cliente insertado
    const [rows] = await pool.query(
      `SELECT * FROM clientes WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Actualizar cliente (PUT /api/clientes/:id)
app.put('/api/clientes/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    // Solo permite actualizar campos válidos de la tabla clientes
    const allowed = [
      'nombre_completo', 'identificacion', 'telefono', 'email', 'direccion', 'metodo_id',
      'owner_id', 'misc1', 'misc2', 'misc3', 'misc4', 'misc5'
    ];
    const updates = [];
    const values = [];
    for (const key of Object.keys(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }
    values.push(id);

    await pool.query(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(`SELECT * FROM clientes WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Obtener todos los métodos (antes paises)
app.get('/api/metodos', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM metodos');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener métodos' });
  }
});

// Crear método
app.post('/api/metodos', authenticate, async (req, res) => {
  try {
    const { nombre, moneda, tasa_base, comision_porcentaje } = req.body;
    if (!nombre || !tasa_base) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    await pool.query(
      'INSERT INTO metodos (nombre, moneda, tasa_base, comision_porcentaje, owner_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, moneda, tasa_base, comision_porcentaje || 0, req.ownerId]
    );
    res.status(201).json({ message: 'Método creado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear método' });
  }
});

// Actualizar método
app.put('/api/metodos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, moneda, tasa_base, comision_porcentaje } = req.body;
    await pool.query(
      'UPDATE metodos SET nombre=?, moneda=?, tasa_base=?, comision_porcentaje=? WHERE id=?',
      [nombre, moneda, tasa_base, comision_porcentaje, id]
    );
    res.json({ message: 'Método actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar método' });
  }
});

// Eliminar método
app.delete('/api/metodos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM metodos WHERE id=?', [id]);
    res.json({ message: 'Método eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar método' });
  }
});

// CRUD proveedores
app.get('/api/proveedores', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT p.*, m.nombre as metodo_nombre FROM proveedores p LEFT JOIN metodos m ON p.metodo_id = m.id`
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

app.post('/api/proveedores', authenticate, async (req, res) => {
  try {
    const { nombre, metodo_id, telefono, correo } = req.body;
    await pool.query(
      'INSERT INTO proveedores (nombre, metodo_id, telefono, correo) VALUES (?, ?, ?, ?)',
      [nombre, metodo_id, telefono, correo]
    );
    res.status(201).json({ message: 'Proveedor creado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

app.put('/api/proveedores/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, metodo_id, telefono, correo } = req.body;
    await pool.query(
      'UPDATE proveedores SET nombre=?, metodo_id=?, telefono=?, correo=? WHERE id=?',
      [nombre, metodo_id, telefono, correo, id]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

app.delete('/api/proveedores/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM proveedores WHERE id=?', [id]);
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// Obtener todas las tasas o una específica según query params
app.get('/api/tasas_cambios', authenticate, async (req, res) => {
  const { origen, destino } = req.query;
  try {
    if (origen && destino) {
      const [result] = await pool.query(
        `SELECT tasa AS tasa_cambio, misc1 AS porcentaje, id, metodo_origen_id, metodo_destino_id
         FROM tasas_cambios
         WHERE metodo_origen_id = ? AND metodo_destino_id = ?`,
        [origen, destino]
      );
      res.json(result[0] || null);
    } else {
      const [result] = await pool.query(
        'SELECT id, metodo_origen_id, metodo_destino_id, tasa, misc1 AS porcentaje FROM tasas_cambios'
      );
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tasas' });
  }
});

// Crear o actualizar una tasa de cambio (usa porcentaje/misc1 y recalcula la tasa)
app.post('/api/tasas_cambios', authenticate, async (req, res) => {
  try {
    const { metodo_origen_id, metodo_destino_id, porcentaje } = req.body;
    let tasa = req.body.tasa;
    let porc = porcentaje !== undefined && porcentaje !== null ? porcentaje : 0;

    // Si no se envía tasa, la calcula automáticamente
    if (!tasa || isNaN(Number(tasa))) {
      // Buscar tasa_base de ambos métodos
      const [[origen]] = await pool.query('SELECT tasa_base FROM metodos WHERE id = ?', [metodo_origen_id]);
      const [[destino]] = await pool.query('SELECT tasa_base FROM metodos WHERE id = ?', [metodo_destino_id]);
      if (!origen || !destino) return res.status(400).json({ error: 'Métodos inválidos' });
      tasa = (parseFloat(destino.tasa_base) / parseFloat(origen.tasa_base)) * (1 - (parseFloat(porc) / 100));
    }

    // Si ya existe, actualiza, si no, inserta
    const [exist] = await pool.query(
      'SELECT id FROM tasas_cambios WHERE metodo_origen_id = ? AND metodo_destino_id = ?',
      [metodo_origen_id, metodo_destino_id]
    );
    if (exist.length > 0) {
      await pool.query(
        'UPDATE tasas_cambios SET tasa = ?, misc1 = ?, fecha_actualizacion = NOW() WHERE id = ?',
        [tasa, porc, exist[0].id]
      );
      res.json({ message: 'Tasa actualizada' });
    } else {
      await pool.query(
        'INSERT INTO tasas_cambios (metodo_origen_id, metodo_destino_id, tasa, misc1) VALUES (?, ?, ?, ?)',
        [metodo_origen_id, metodo_destino_id, tasa, porc]
      );
      res.status(201).json({ message: 'Tasa creada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar tasa' });
  }
});

// Recalcular todas las tasas usando el porcentaje (misc1)
app.post('/api/tasas_cambios/recalcular', authenticate, async (req, res) => {
  try {
    const [tasas] = await pool.query('SELECT id, metodo_origen_id, metodo_destino_id, misc1 FROM tasas_cambios');
    const [metodos] = await pool.query('SELECT id, tasa_base FROM metodos');
    const metodoMap = {};
    metodos.forEach(m => { metodoMap[m.id] = parseFloat(m.tasa_base); });

    for (const t of tasas) {
      const baseOrigen = metodoMap[t.metodo_origen_id];
      const baseDestino = metodoMap[t.metodo_destino_id];
      const porc = t.misc1 !== null && t.misc1 !== undefined ? parseFloat(t.misc1) : 0;
      if (!baseOrigen || !baseDestino) continue;
      const nuevaTasa = (baseDestino / baseOrigen) * (1 - (porc / 100));
      await pool.query(
        'UPDATE tasas_cambios SET tasa = ?, fecha_actualizacion = NOW() WHERE id = ?',
        [nuevaTasa, t.id]
      );
    }
    res.json({ message: 'Tasas recalculadas' });
  } catch (err) {
    res.status(500).json({ error: 'Error al recalcular tasas' });
  }
});

// Editar una tasa de cambio (PUT)
app.put('/api/tasas_cambios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_origen_id, metodo_destino_id, porcentaje } = req.body;
    let tasa = req.body.tasa;
    let porc = porcentaje !== undefined && porcentaje !== null ? porcentaje : 0;

    // Si no se envía tasa, la calcula automáticamente
    if (!tasa || isNaN(Number(tasa))) {
      const [[origen]] = await pool.query('SELECT tasa_base FROM metodos WHERE id = ?', [metodo_origen_id]);
      const [[destino]] = await pool.query('SELECT tasa_base FROM metodos WHERE id = ?', [metodo_destino_id]);
      if (!origen || !destino) return res.status(400).json({ error: 'Métodos inválidos' });
      tasa = (parseFloat(destino.tasa_base) / parseFloat(origen.tasa_base)) * (1 - (parseFloat(porc) / 100));
    }

    await pool.query(
      'UPDATE tasas_cambios SET tasa = ?, misc1 = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [tasa, porc, id]
    );
    res.json({ message: 'Tasa actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tasa' });
  }
});

// Obtener todos los usuarios (protegido)
app.get('/api/usuarios', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT id, usuario, rol, activo FROM usuarios`
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear usuario
app.post('/api/usuarios', authenticate, async (req, res) => {
  try {
    const { usuario, clave, rol, activo } = req.body;
    if (!usuario || !clave || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Puedes agregar validación para evitar usuarios duplicados aquí
    await pool.query(
      `INSERT INTO usuarios (usuario, clave_hash, rol, activo) VALUES (?, ?, ?, ?)`,
      [usuario, clave, rol, activo ? 1 : 0]
    );
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Editar usuario
app.put('/api/usuarios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, clave, rol, activo } = req.body;
    const fields = [];
    const values = [];
    if (usuario !== undefined) { fields.push('usuario = ?'); values.push(usuario); }
    if (clave !== undefined && clave !== '') { fields.push('clave_hash = ?'); values.push(clave); }
    if (rol !== undefined) { fields.push('rol = ?'); values.push(rol); }
    if (activo !== undefined) { fields.push('activo = ?'); values.push(activo ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    values.push(id);
    await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Reporte de transacciones (puedes personalizar los filtros según tu frontend)
app.get('/api/reportes/transacciones', authenticate, async (req, res) => {
  try {
    // Filtros desde query params
    const {
      fechaInicio, fechaFin, estado, search,
      usuario_id, operador_tipo,
      proveedor_id, revendedor_id, cliente_id, metodo_origen_id
    } = req.query;
    let where = "r.estado <> 'Eliminada'";
    const params = [];

    if (estado && estado !== 'Todos') {
      where += " AND r.estado = ?";
      params.push(estado);
    }
    if (fechaInicio) {
      where += " AND DATE(r.fecha_hora) >= ?";
      params.push(fechaInicio);
    }
    if (fechaFin) {
      where += " AND DATE(r.fecha_hora) <= ?";
      params.push(fechaFin);
    }
    // Filtro especial: operador_tipo=cliente
    if (operador_tipo === 'cliente') {
      where += " AND u.rol = 'cliente'";
    } else if (usuario_id && usuario_id !== 'Todos') {
      where += " AND r.usuario_id = ?";
      params.push(usuario_id);
    }
    if (proveedor_id) {
      where += " AND r.proveedor_id = ?";
      params.push(proveedor_id);
    }
    if (revendedor_id) {
      where += " AND r.revendedor_id = ?";
      params.push(revendedor_id);
    }
    if (cliente_id) {
      where += " AND r.cliente_id = ?";
      params.push(cliente_id);
    }
    if (metodo_origen_id) {
      where += " AND r.metodo_origen_id = ?";
      params.push(metodo_origen_id);
    }
    if (search) {
      where += ` AND (
        c.nombre_completo LIKE ? OR
        u.usuario LIKE ? OR
        mo.nombre LIKE ? OR
        md.nombre LIKE ? OR
        p.nombre LIKE ?
      )`;
      for (let i = 0; i < 5; i++) params.push(`%${search}%`);
    }

    const [remesas] = await pool.query(`
      SELECT r.*,
        c.nombre_completo AS cliente_nombre,
        u.usuario AS operador,
        u.rol AS usuario_rol,
        mo.nombre AS metodo_origen_nombre,
        md.nombre AS metodo_destino_nombre,
        p.nombre AS proveedor_nombre
      FROM remesas r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN metodos mo ON r.metodo_origen_id = mo.id
      LEFT JOIN metodos md ON r.metodo_destino_id = md.id
      LEFT JOIN proveedores p ON r.proveedor_id = p.id
      WHERE ${where}
      ORDER BY r.fecha_hora DESC
    `, params);

    // Obtener comprobantes solo si hay remesas
    let comprobantesMap = {};
    if (remesas.length > 0) {
      const remesaIds = remesas.map(r => r.id);
      const [comprobantes] = await pool.query(
        `SELECT * FROM comprobantes_remesa WHERE remesa_id IN (${remesaIds.map(() => '?').join(',')})`,
        remesaIds
      );
      comprobantesMap = comprobantes.reduce((acc, c) => {
        if (!acc[c.remesa_id]) acc[c.remesa_id] = [];
        acc[c.remesa_id].push(c);
        return acc;
      }, {});
    }

    const remesasConComprobantes = remesas.map(r => ({
      ...r,
      comprobantes: comprobantesMap[r.id] || []
    }));

    res.json(remesasConComprobantes);
  } catch (err) {
    console.error('Error en /api/reportes/transacciones:', err); // <-- para depuración
    res.status(500).json({ error: 'Error al obtener reporte de transacciones' });
  }
});

// Obtener comprobantes de una remesa (debe devolver array, nunca 404)
app.get('/api/comprobantes/:remesaId', authenticate, async (req, res) => {
  try {
    const { remesaId } = req.params;
    const [comprobantes] = await pool.query(
      'SELECT * FROM comprobantes_remesa WHERE remesa_id = ?',
      [remesaId]
    );
    res.json(comprobantes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener comprobantes' });
  }
});

// Subir comprobantes de remesa (POST /api/comprobantes)
app.post('/api/comprobantes', authenticate, upload.any(), async (req, res) => {
  try {
    const remesaId = req.body.remesa_id;
    const tipoPago = req.body.tipo_pago || null;
    if (!remesaId || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Faltan archivos o remesa_id' });
    }
    // Guardar solo los campos que existen en la tabla: remesa_id, nombre_archivo, ruta, tipo_pago
    const values = req.files.map(file => [
      remesaId,
      file.filename,
      '/uploads/comprobantes/' + file.filename,
      tipoPago
    ]);
    await pool.query(
      `INSERT INTO comprobantes_remesa (remesa_id, nombre_archivo, ruta, tipo_pago)
       VALUES ?`,
      [values]
    );
    res.status(201).json({ message: 'Comprobantes subidos' });
  } catch (err) {
    console.error('Error al subir comprobantes:', err);
    res.status(500).json({ error: 'Error al subir comprobantes' });
  }
});

// Eliminar tasa de cambio (DELETE /api/tasas_cambios/:id)
app.delete('/api/tasas_cambios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasas_cambios WHERE id = ?', [id]);
    res.json({ message: 'Tasa eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tasa' });
  }
});

app.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000');
});
