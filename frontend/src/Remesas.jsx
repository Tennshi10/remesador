import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css'; // Ensure custom styles are applied

// Configurar Axios para incluir el token en cada solicitud
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const API_URL = import.meta.env.VITE_API_URL;

function Remesas() {
  const [remesas, setRemesas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [filteredDestinos, setFilteredDestinos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    usuario_id: 1,
    metodo_origen_id: '',
    metodo_destino_id: '',
    monto_origen: '',
    monto_destino: '',
    tasa_cambio: '',
    comision: '',
    ganancia: '',
    estado: 'Pendiente',
    wallet_origen_id: 1,
    wallet_destino_id: 1,
    cuenta_bancaria_id: 1,
    beneficiario_nombre: '',
    proveedor_id: '',
    nombre_destinatario: '',
    cedula_destinatario: '',
    cuenta_banco_destinatario: '',
    monto_recibir: ''
  });
  const [isTasaReadOnly, setIsTasaReadOnly] = useState(true);
  const [newClientForm, setNewClientForm] = useState({
    nombre_completo: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    metodo_id: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [search, setSearch] = useState('');
  const [comprobantes, setComprobantes] = useState([]); // Archivos seleccionados
  const [adjuntosCliente, setAdjuntosCliente] = useState([]);
  const [adjuntosOperador, setAdjuntosOperador] = useState([]);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const rol = localStorage.getItem('rol') || '';
  const userId = localStorage.getItem('user_id');
  const [clienteActual, setClienteActual] = useState(null);

  useEffect(() => {
    fetchClientes();
    fetchMetodos();
    fetchProveedores();
    fetchTasas();
  }, []);

  useEffect(() => {
    // Cuando se cargan los clientes, si es cliente, selecciona automáticamente su propio cliente_id
    if (rol === 'cliente' && clientes.length > 0 && userId) {
      // Busca el cliente cuyo id coincida con el userId
      const cliente = clientes.find(c => String(c.id) === String(userId));
      if (cliente) {
        setClienteActual(cliente);
        setForm(prev => ({
          ...prev,
          cliente_id: cliente.id
        }));
      }
    }
  }, [clientes, rol, userId]);

  const fetchRemesas = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/remesas`);
      setRemesas(res.data);
    } catch (err) {
      console.error('Error fetching remesas:', err);
    }
  };

  const fetchClientes = async () => {
    const res = await axios.get(`${API_URL}/api/clientes`);
    setClientes(res.data);
    setFilteredClientes(res.data);
  };

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`);
    setMetodos(res.data);
  };

  const fetchProveedores = async () => {
    const res = await axios.get(`${API_URL}/api/proveedores`);
    setProveedores(res.data);
  };

  const fetchTasas = async () => {
    const res = await axios.get(`${API_URL}/api/tasas_cambios`);
    setTasas(res.data);
  };

  const fetchTasaCambio = async (origenId, destinoId) => {
    try {
      const res = await axios.get(`${API_URL}/api/tasas_cambios?origen=${origenId}&destino=${destinoId}`);
      if (res.data) {
        setForm((prev) => ({ ...prev, tasa_cambio: res.data.tasa_cambio }));
        setIsTasaReadOnly(true);
      } else {
        setForm((prev) => ({ ...prev, tasa_cambio: '' }));
        setIsTasaReadOnly(false);
      }
    } catch (err) {
      console.error('Error fetching tasa de cambio:', err);
    }
  };

  const getMetodosDestino = () => {
    if (!form.metodo_origen_id) return [];
    return metodos.filter(dest =>
      tasas.some(t =>
        t.metodo_origen_id === parseInt(form.metodo_origen_id) &&
        t.metodo_destino_id === dest.id
      )
    );
  };

  useEffect(() => {
    const calcularTasaYRecibir = async () => {
      if (form.metodo_origen_id && form.metodo_destino_id && form.monto_origen) {
        const res = await axios.get(`${API_URL}/api/tasas_cambios?origen=${form.metodo_origen_id}&destino=${form.metodo_destino_id}`);
        const tasa = res.data?.tasa_cambio || '';
        const montoRecibir = tasa ? (parseFloat(form.monto_origen) * parseFloat(tasa)).toFixed(2) : '';
        setForm(f => ({
          ...f,
          tasa_cambio: tasa,
          monto_recibir: montoRecibir,
          monto_destino: montoRecibir
        }));
      }
    };
    calcularTasaYRecibir();
  }, [form.metodo_origen_id, form.metodo_destino_id, form.monto_origen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'metodo_origen_id') {
      setFilteredDestinos(getMetodosDestino());
      setForm((prev) => ({ ...prev, metodo_destino_id: '', tasa_cambio: '', monto_recibir: '' }));
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = clientes.filter((cliente) =>
      cliente.id.toString().includes(value) ||
      cliente.nombre_completo.toLowerCase().includes(value.toLowerCase()) ||
      cliente.telefono.includes(value) ||
      cliente.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredClientes(filtered);
  };

  const handleSelectCliente = (cliente) => {
    setForm((prev) => ({ ...prev, cliente_id: cliente.id }));
    setShowModal(false);
  };

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/clientes`, newClientForm);
    setNewClientForm({
      nombre_completo: '',
      identificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      metodo_id: ''
    });
    setShowCreateClientModal(false);
    fetchClientes();
  };

  const handleComprobantesChange = (e) => {
    setComprobantes(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación obligatoria de todos los campos requeridos
    const requiredFields = [
      'cliente_id', 'nombre_destinatario', 'cedula_destinatario',
      'cuenta_banco_destinatario', 'monto_origen', 'metodo_origen_id', 'metodo_destino_id',
      'tasa_cambio', 'monto_recibir'
    ];
    if (rol !== 'cliente') requiredFields.push('proveedor_id');
    for (const field of requiredFields) {
      if (!form[field]) {
        alert('Todos los campos son obligatorios');
        return;
      }
    }
    try {
      const data = {
        ...form,
        usuario_id: parseInt(userId),
        monto_destino: parseFloat(form.monto_recibir),
        monto_origen: parseFloat(form.monto_origen),
        tasa_cambio: parseFloat(form.tasa_cambio),
        comision: parseFloat(form.comision || 0),
        ganancia: parseFloat(form.ganancia || 0),
        cuenta_bancaria_id: parseInt(form.cuenta_bancaria_id),
        wallet_origen_id: parseInt(form.wallet_origen_id),
        wallet_destino_id: parseInt(form.wallet_destino_id),
        metodo_origen_id: parseInt(form.metodo_origen_id),
        metodo_destino_id: parseInt(form.metodo_destino_id),
        cliente_id: parseInt(form.cliente_id),
        proveedor_id: rol !== 'cliente' ? parseInt(form.proveedor_id) : null,
        monto_recibir: parseFloat(form.monto_recibir)
      };

      // 1. Registrar la remesa
      const res = await axios.post(`${API_URL}/api/remesas`, data);
      const remesaId = res.data.id;

      // 2. Subir adjuntos cliente
      if (adjuntosCliente.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        formData.append('tipo_pago', 'cliente');
        adjuntosCliente.forEach(file => formData.append('comprobantes', file));
        await axios.post(`${API_URL}/api/comprobantes`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      // 3. Subir adjuntos operador (solo si operador/admin)
      if (rol !== 'cliente' && adjuntosOperador.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        formData.append('tipo_pago', 'operador');
        adjuntosOperador.forEach(file => formData.append('comprobantes', file));
        await axios.post(`${API_URL}/api/comprobantes`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setForm((f) => ({ ...f, monto_origen: '', tasa_cambio: '', monto_recibir: '', beneficiario_nombre: '', nombre_destinatario: '', cedula_destinatario: '', cuenta_banco_destinatario: '', proveedor_id: '' }));
      setAdjuntosCliente([]);
      setAdjuntosOperador([]);
      fetchRemesas();
    } catch (err) {
      alert('Error al registrar remesa');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = '/';
  };

  return (
    <div className="container py-5">
      {rol === 'cliente' && (
        <div className="alert alert-info">
          Por favor indique los datos de su envío, en la brevedad un Operador se pondrá en contacto para confirmar su pago y proceder con el envío.
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-2" onClick={() => navigate('/')}>
            <i className="bi bi-arrow-left"></i> Atrás
          </button>
        </div>
        <h1 className="text-center flex-grow-1">Registro de Remesas</h1>
        <button className="btn btn-danger" onClick={() => setShowLogoutModal(true)}>
          Cerrar Sesión
        </button>
      </div>

      {/* Modal de confirmación para cerrar sesión */}
      {showLogoutModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLogoutModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-4 mb-5 shadow">
        {/* Cliente */}
        <div className="form-group mb-3">
          <label>Cliente que envía</label>
          <input
            className="form-control"
            name="cliente_id"
            value={clienteActual ? clienteActual.nombre_completo : ''}
            disabled
            readOnly
          />
        </div>
        {/* Nuevos campos destinatario */}
        <div className="form-group mb-3">
          <label>Nombre Destinatario</label>
          <input
            className="form-control"
            name="nombre_destinatario"
            value={form.nombre_destinatario}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Cédula Destinatario</label>
          <input
            className="form-control"
            name="cedula_destinatario"
            value={form.cedula_destinatario}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Cuenta Banco Destinatario</label>
          <input
            className="form-control"
            name="cuenta_banco_destinatario"
            value={form.cuenta_banco_destinatario}
            onChange={handleChange}
            required
          />
        </div>
        {/* Monto a Enviar */}
        <div className="form-group mb-3">
          <label>Monto a Enviar</label>
          <input
            type="number"
            className="form-control"
            name="monto_origen"
            value={form.monto_origen}
            onChange={handleChange}
            required
          />
        </div>
        {/* Métodos */}
        <div className="form-group mb-3">
          <label>Método de Origen</label>
          <select
            className="form-control"
            name="metodo_origen_id"
            value={form.metodo_origen_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un método</option>
            {metodos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group mb-3">
          <label>Método de Destino</label>
          <select
            className="form-control"
            name="metodo_destino_id"
            value={form.metodo_destino_id}
            onChange={handleChange}
            required
            disabled={!form.metodo_origen_id}
          >
            <option value="">Seleccione un método</option>
            {getMetodosDestino().map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
        {/* Tasa y monto a recibir */}
        <div className="form-group mb-3">
          <label>Tasa Aplicada</label>
          <input
            type="number"
            className="form-control"
            name="tasa_cambio"
            value={form.tasa_cambio}
            readOnly
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Monto a Recibir (Aprox)</label>
          <input
            type="number"
            className="form-control"
            name="monto_recibir"
            value={form.monto_recibir}
            readOnly
            required
          />
        </div>
        {/* Adjuntos de pago cliente */}
        <div className="form-group mb-3">
          <label>Adjuntos Pago(s) Cliente</label>
          <input
            type="file"
            className="form-control"
            multiple
            accept="image/*,application/pdf"
            onChange={e => setAdjuntosCliente(Array.from(e.target.files))}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Registrar Remesa
        </button>
      </form>

      {rol !== 'cliente' && (
        <>
          <h2 className="text-center mb-4">Movimientos Registrados</h2>
          <table className="table table-striped table-bordered shadow">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Método de Origen</th>
                <th>Método de Destino</th>
                <th>Monto de Origen</th>
                <th>Monto de Destino</th>
                <th>Tasa de Cambio</th>
                <th>Comisión</th>
                <th>Ganancia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {remesas.map((remesa) => (
                <tr key={remesa.id}>
                  <td>{remesa.id}</td>
                  <td>{remesa.cliente_nombre || remesa.cliente_id}</td>
                  <td>{remesa.metodo_origen_nombre || remesa.metodo_origen_id}</td>
                  <td>{remesa.metodo_destino_nombre || remesa.metodo_destino_id}</td>
                  <td>{remesa.monto_origen}</td>
                  <td>{remesa.monto_destino}</td>
                  <td>{remesa.tasa_cambio}</td>
                  <td>{remesa.comision}</td>
                  <td>{remesa.ganancia}</td>
                  <td>{remesa.estado}</td>
                  <td>
                    <button className="btn btn-sm btn-primary">Editar</button>
                    <button className="btn btn-sm btn-danger">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modal para seleccionar cliente */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Seleccionar Cliente</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={handleSearch}
                />
                <ul className="list-group">
                  {filteredClientes.map((cliente) => (
                    <li
                      key={cliente.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      {cliente.nombre_completo}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowModal(false);
                    setShowCreateClientModal(true);
                  }}
                >
                  Crear Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear cliente */}
      {showCreateClientModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Cliente</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateClientModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateClient}>
                  <div className="form-group mb-3">
                    <label htmlFor="nombre_completo">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nombre_completo"
                      name="nombre_completo"
                      value={newClientForm.nombre_completo}
                      onChange={handleNewClientChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="identificacion">Identificación</label>
                    <input
                      type="text"
                      className="form-control"
                      id="identificacion"
                      name="identificacion"
                      value={newClientForm.identificacion}
                      onChange={handleNewClientChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      id="telefono"
                      name="telefono"
                      value={newClientForm.telefono}
                      onChange={handleNewClientChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={newClientForm.email}
                      onChange={handleNewClientChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="direccion">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      id="direccion"
                      name="direccion"
                      value={newClientForm.direccion}
                      onChange={handleNewClientChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="metodo_id">Método/Pais</label>
                    <select
                      className="form-control"
                      id="metodo_id"
                      name="metodo_id"
                      value={newClientForm.metodo_id}
                      onChange={handleNewClientChange}
                      required
                    >
                      <option value="">Seleccione un método/pais</option>
                      {metodos.map((metodo) => (
                        <option key={metodo.id} value={metodo.id}>
                          {metodo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Crear Cliente
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Remesas;
