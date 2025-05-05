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

function Remesas() {
  const [remesas, setRemesas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [paises, setPaises] = useState([]);
  const [filteredDestinos, setFilteredDestinos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    usuario_id: 1,
    pais_origen_id: '',
    pais_destino_id: '',
    monto_origen: '',
    tasa_cambio: '',
    comision: '',
    ganancia: '',
    estado: 'Pendiente',
    wallet_origen_id: 1,
    wallet_destino_id: 1,
    cuenta_bancaria_id: 1,
    beneficiario_nombre: '',
    notas: ''
  });
  const [isTasaReadOnly, setIsTasaReadOnly] = useState(true);
  const [newClientForm, setNewClientForm] = useState({
    nombre_completo: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    pais_id: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [search, setSearch] = useState('');
  const [comprobantes, setComprobantes] = useState([]); // Archivos seleccionados
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchRemesas();
    fetchClientes();
    fetchPaises();
    // Al cargar, pon el usuario_id real en el form
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setForm((prev) => ({ ...prev, usuario_id: parseInt(userId) }));
    }
  }, []);

  const fetchRemesas = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/remesas');
      setRemesas(res.data);
    } catch (err) {
      console.error('Error fetching remesas:', err);
    }
  };

  const fetchClientes = async () => {
    const res = await axios.get('http://localhost:4000/api/clientes');
    setClientes(res.data);
    setFilteredClientes(res.data);
  };

  const fetchPaises = async () => {
    const res = await axios.get('http://localhost:4000/api/paises');
    setPaises(res.data);
  };

  const fetchTasaCambio = async (origenId, destinoId) => {
    try {
      const res = await axios.get(`/api/tasas_cambios?origen=${origenId}&destino=${destinoId}`);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'pais_origen_id') {
      setFilteredDestinos(paises.filter((pais) => pais.id !== parseInt(value)));
      setForm((prev) => ({ ...prev, pais_destino_id: '', tasa_cambio: '' }));
      setIsTasaReadOnly(true);
    }

    if (name === 'pais_destino_id' && form.pais_origen_id) {
      fetchTasaCambio(form.pais_origen_id, value);
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
    await axios.post('http://localhost:4000/api/clientes', newClientForm);
    setNewClientForm({
      nombre_completo: '',
      identificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      pais_id: ''
    });
    setShowCreateClientModal(false);
    fetchClientes();
  };

  const handleComprobantesChange = (e) => {
    setComprobantes(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const monto_destino = parseFloat(form.monto_origen) * parseFloat(form.tasa_cambio);
      const data = {
        ...form,
        usuario_id: parseInt(localStorage.getItem('user_id')), // <-- fuerza el user_id real
        monto_destino: parseFloat(monto_destino.toFixed(2)),
        monto_origen: parseFloat(form.monto_origen),
        tasa_cambio: parseFloat(form.tasa_cambio),
        comision: parseFloat(form.comision),
        ganancia: parseFloat(form.ganancia),
        cuenta_bancaria_id: parseInt(form.cuenta_bancaria_id),
        wallet_origen_id: parseInt(form.wallet_origen_id),
        wallet_destino_id: parseInt(form.wallet_destino_id),
        pais_origen_id: parseInt(form.pais_origen_id),
        pais_destino_id: parseInt(form.pais_destino_id),
        cliente_id: parseInt(form.cliente_id),
      };

      // 1. Registrar la remesa
      const res = await axios.post('http://localhost:4000/api/remesas', data);
      const remesaId = res.data.id;

      // 2. Subir comprobantes si hay
      if (comprobantes.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        comprobantes.forEach(file => formData.append('comprobantes', file));
        await axios.post('http://localhost:4000/api/comprobantes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setForm((f) => ({ ...f, monto_origen: '', tasa_cambio: '', comision: '', ganancia: '', beneficiario_nombre: '', notas: '' }));
      setComprobantes([]);
      fetchRemesas();
    } catch (err) {
      console.error('Error al registrar remesa:', err.response?.data || err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = '/';
  };

  return (
    <div className="container py-5">
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
        <div className="form-group mb-3">
          <label htmlFor="cliente_id">Cliente</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              id="cliente_id"
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              readOnly
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(true)}
            >
              Seleccionar Cliente
            </button>
          </div>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="pais_origen_id">País de Origen</label>
          <select
            className="form-control"
            id="pais_origen_id"
            name="pais_origen_id"
            value={form.pais_origen_id}
            onChange={handleChange}
          >
            <option value="">Seleccione un país</option>
            {paises.map((pais) => (
              <option key={pais.id} value={pais.id}>
                {pais.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="pais_destino_id">País de Destino</label>
          <select
            className="form-control"
            id="pais_destino_id"
            name="pais_destino_id"
            value={form.pais_destino_id}
            onChange={handleChange}
          >
            <option value="">Seleccione un país</option>
            {filteredDestinos.map((pais) => (
              <option key={pais.id} value={pais.id}>
                {pais.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="monto_origen">Monto de Origen</label>
          <input
            type="number"
            className="form-control"
            id="monto_origen"
            name="monto_origen"
            value={form.monto_origen}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="tasa_cambio">Tasa de Cambio</label>
          <input
            type="number"
            className="form-control"
            id="tasa_cambio"
            name="tasa_cambio"
            value={form.tasa_cambio}
            onChange={handleChange}
            readOnly={isTasaReadOnly}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="comision">Comisión</label>
          <input
            type="number"
            className="form-control"
            id="comision"
            name="comision"
            value={form.comision}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="ganancia">Ganancia</label>
          <input
            type="number"
            className="form-control"
            id="ganancia"
            name="ganancia"
            value={form.ganancia}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="beneficiario_nombre">Nombre del Beneficiario</label>
          <input
            type="text"
            className="form-control"
            id="beneficiario_nombre"
            name="beneficiario_nombre"
            value={form.beneficiario_nombre}
            onChange={handleChange}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="notas">Notas</label>
          <textarea
            className="form-control"
            id="notas"
            name="notas"
            value={form.notas}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="comprobantes">Comprobantes de Pago</label>
          <input
            type="file"
            id="comprobantes"
            name="comprobantes"
            className="form-control"
            multiple
            accept="image/*,application/pdf"
            onChange={handleComprobantesChange}
          />
          <small className="form-text text-muted">
            Puedes adjuntar uno o varios archivos (imágenes o PDF).
          </small>
        </div>
        <button type="submit" className="btn btn-primary">
          Registrar Remesa
        </button>
      </form>

      <h2 className="text-center mb-4">Movimientos Registrados</h2>
      <table className="table table-striped table-bordered shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>País de Origen</th>
            <th>País de Destino</th>
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
              <td>{remesa.cliente_id}</td>
              <td>{remesa.pais_origen_id}</td>
              <td>{remesa.pais_destino_id}</td>
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
                    <label htmlFor="pais_id">País</label>
                    <select
                      className="form-control"
                      id="pais_id"
                      name="pais_id"
                      value={newClientForm.pais_id}
                      onChange={handleNewClientChange}
                    >
                      <option value="">Seleccione un país</option>
                      {paises.map((pais) => (
                        <option key={pais.id} value={pais.id}>
                          {pais.nombre}
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
