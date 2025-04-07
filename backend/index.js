const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());

// Configurar conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'remesadorDB',
  password: 'Pluma28carterA@',
  port: 5432,
});

// Middleware para autenticar usuarios y obtener owner_id
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const result = await pool.query(
      `SELECT u.id AS user_id, COALESCE(u.owner_id, u.id) AS owner_id
       FROM sesiones s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.token = $1 AND s.fecha_expiracion > CURRENT_TIMESTAMP`,
      [token]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Sesión expirada o inválida' });

    req.userId = result.rows[0].user_id;
    req.ownerId = result.rows[0].owner_id; // Asignar el owner_id del usuario autenticado
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
      `SELECT id, clave_hash FROM usuarios WHERE usuario = $1`,
      [usuario]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { id, clave_hash } = result.rows[0];
    if (clave !== clave_hash) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = crypto.randomBytes(64).toString('hex');
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await pool.query(
      `INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES ($1, $2, $3)`,
      [id, token, fechaExpiracion]
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}); // <-- Aquí faltaba cerrar correctamente la función

// Obtener todas las remesas
app.get('/api/remesas', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.nombre_completo AS cliente_nombre, u.usuario AS operador
      FROM remesas r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.owner_id = $1
      ORDER BY r.fecha_hora DESC
    `, [req.ownerId]);
    res.json(result.rows);
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

    const result = await pool.query(
      `INSERT INTO remesas (
        cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, estado,
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        beneficiario_nombre, notas, owner_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        cliente_id, usuario_id, pais_origen_id, pais_destino_id, monto_origen,
        monto_destino, tasa_cambio, comision, ganancia, estado || 'Pendiente',
        wallet_origen_id, wallet_destino_id, cuenta_bancaria_id,
        beneficiario_nombre, notas, req.ownerId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear remesa:', err);
    res.status(500).json({ error: 'Error al crear remesa' });
  }
});

// Eliminar (lógicamente) una remesa (marcar como cancelada)
app.delete('/api/remesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE remesas SET estado = 'Cancelada' WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
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
    const updates = Object.keys(fields).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    const values = Object.values(fields);
    values.push(id);

    const result = await pool.query(
      `UPDATE remesas SET ${updates} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar remesa' });
  }
});

// Obtener todos los clientes con el nombre del país
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.nombre AS pais_nombre
      FROM clientes c
      LEFT JOIN paises p ON c.pais_id = p.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre_completo, identificacion, telefono, email, direccion, pais_id } = req.body;
    const result = await pool.query(
      `INSERT INTO clientes (nombre_completo, identificacion, telefono, email, direccion, pais_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre_completo, identificacion, telefono, email, direccion, pais_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Obtener todos los países
app.get('/api/paises', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM paises');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener países' });
  }
});

// Obtener tasa de cambio para un par de países
app.get('/api/tasas_cambios', async (req, res) => {
  const { origen, destino } = req.query;
  try {
    const result = await pool.query(
      `SELECT tasa AS tasa_cambio
       FROM tasas_cambios
       WHERE pais_origen_id = $1 AND pais_destino_id = $2`,
      [origen, destino]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tasa de cambio' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
