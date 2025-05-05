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

app.use(cors());
app.use(express.json());

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

// Obtener todas las remesas
app.get('/api/remesas', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT r.*, c.nombre_completo AS cliente_nombre, u.usuario AS operador
      FROM remesas r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.owner_id = ?
      ORDER BY r.fecha_hora DESC
    `, [req.ownerId]);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener remesas' });
  }
});

// Crear una nueva remesa
app.post('/api/remesas', authenticate, async (req, res) => {
  try {
    const {
      cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
      monto_destino, tasa_cambio, comision, ganancia, estado,
      wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
      beneficiario_nombre, notas
    } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!cliente_id || !usuario_id || !pais_origen_id || !pais_destino_id || !monto_origen || !tasa_cambio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO remesas (
        cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, estado,
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        beneficiario_nombre, notas, owner_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, estado || 'Pendiente',
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        beneficiario_nombre, notas, req.ownerId
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

// Eliminar (lógicamente) una remesa (marcar como cancelada)
app.delete('/api/remesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE remesas SET estado = 'Cancelada' WHERE id = ?`,
      [id]
    );
    // Opcional: devolver la remesa actualizada
    const [rows] = await pool.query(`SELECT * FROM remesas WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cancelar remesa' });
  }
});

// Actualizar remesa
app.put('/api/remesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updates = Object.keys(fields).map((key) => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(id);

    await pool.query(
      `UPDATE remesas SET ${updates} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(`SELECT * FROM remesas WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar remesa' });
  }
});

// Obtener todos los clientes con el nombre del país
app.get('/api/clientes', async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT c.*, p.nombre AS pais_nombre
      FROM clientes c
      LEFT JOIN paises p ON c.pais_id = p.id
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
    const { nombre_completo, identificacion, telefono, email, direccion, pais_id } = req.body;
    const [result] = await pool.query(
      `INSERT INTO clientes (nombre_completo, identificacion, telefono, email, direccion, pais_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_completo, identificacion, telefono, email, direccion, pais_id]
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

// Obtener todos los países
app.get('/api/paises', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT id, nombre FROM paises');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener países' });
  }
});

// Crear país
app.post('/api/paises', authenticate, async (req, res) => {
  try {
    const { nombre, codigo_iso, moneda, codigo_moneda, simbolo_moneda } = req.body;
    if (!nombre || !codigo_iso || !moneda || !codigo_moneda) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    await pool.query(
      'INSERT INTO paises (nombre, codigo_iso, moneda, codigo_moneda, simbolo_moneda) VALUES (?, ?, ?, ?, ?)',
      [nombre, codigo_iso, moneda, codigo_moneda, simbolo_moneda]
    );
    res.status(201).json({ message: 'País creado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear país' });
  }
});

// Obtener todas las tasas o una específica según query params
app.get('/api/tasas_cambios', authenticate, async (req, res) => {
  const { origen, destino } = req.query;
  try {
    if (origen && destino) {
      // Si hay query params, devuelve solo esa tasa
      const [result] = await pool.query(
        `SELECT tasa AS tasa_cambio
         FROM tasas_cambios
         WHERE pais_origen_id = ? AND pais_destino_id = ?`,
        [origen, destino]
      );
      res.json(result[0] || null);
    } else {
      // Si no hay query params, devuelve todas las tasas
      const [result] = await pool.query('SELECT * FROM tasas_cambios');
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tasas' });
  }
});

// Crear o actualizar una tasa de cambio
app.post('/api/tasas_cambios', authenticate, async (req, res) => {
  try {
    const { pais_origen_id, pais_destino_id, tasa } = req.body;
    if (!pais_origen_id || !pais_destino_id || !tasa) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Si ya existe, actualiza, si no, inserta
    const [exist] = await pool.query(
      'SELECT id FROM tasas_cambios WHERE pais_origen_id = ? AND pais_destino_id = ?',
      [pais_origen_id, pais_destino_id]
    );
    if (exist.length > 0) {
      await pool.query(
        'UPDATE tasas_cambios SET tasa = ?, fecha_actualizacion = NOW() WHERE id = ?',
        [tasa, exist[0].id]
      );
      res.json({ message: 'Tasa actualizada' });
    } else {
      await pool.query(
        'INSERT INTO tasas_cambios (pais_origen_id, pais_destino_id, tasa) VALUES (?, ?, ?)',
        [pais_origen_id, pais_destino_id, tasa]
      );
      res.status(201).json({ message: 'Tasa creada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar tasa' });
  }
});

// Eliminar una tasa de cambio
app.delete('/api/tasas_cambios/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasas_cambios WHERE id = ?', [id]);
    res.json({ message: 'Tasa eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tasa' });
  }
});

// Subir comprobantes (uno o varios)
app.post('/api/comprobantes', authenticate, upload.array('comprobantes', 10), async (req, res) => {
  try {
    const remesaId = req.body.remesa_id;
    if (!remesaId) return res.status(400).json({ error: 'remesa_id requerido' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se subieron archivos' });

    const values = req.files.map(file => [
      remesaId,
      file.filename,
      `/uploads/comprobantes/${file.filename}`
    ]);
    // Inserta todos los comprobantes
    await pool.query(
      `INSERT INTO comprobantes_remesa (remesa_id, nombre_archivo, ruta) VALUES ?`,
      [values]
    );
    res.status(201).json({ message: 'Comprobantes guardados', archivos: values.map(v => v[2]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar comprobantes' });
  }
});

// Obtener comprobantes de una remesa
app.get('/api/comprobantes/:remesaId', authenticate, async (req, res) => {
  try {
    const { remesaId } = req.params;
    const [result] = await pool.query(
      `SELECT id, nombre_archivo, ruta, fecha_subida FROM comprobantes_remesa WHERE remesa_id = ?`,
      [remesaId]
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener comprobantes' });
  }
});

// Obtener todos los usuarios (para filtro de transacciones)
app.get('/api/usuarios', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT id, usuario, rol FROM usuarios`
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Servir archivos estáticos de comprobantes
app.use('/uploads/comprobantes', express.static(UPLOADS_DIR));

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
