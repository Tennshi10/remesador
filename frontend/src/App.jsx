import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

function App() {
  const [remesas, setRemesas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    usuario_id: 1,
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
  const [newClientForm, setNewClientForm] = useState({
    nombre_completo: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado para mostrar el modal de logout
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token'); // Eliminar el token del almacenamiento local
    window.location.reload(); // Recargar la página para redirigir al login
  };

  useEffect(() => {
    fetchRemesas();
    fetchClientes();
  }, []);

  const fetchRemesas = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/remesas`);
      setRemesas(res.data);
    } catch (err) {
      console.error('Error fetching remesas:', err);
    }
  };

  const fetchClientes = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`);
    setClientes(res.data);
    setFilteredClientes(res.data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    await axios.post(`${import.meta.env.VITE_API_URL}/api/clientes`, newClientForm);
    setNewClientForm({
      nombre_completo: '',
      identificacion: '',
      telefono: '',
      email: '',
      direccion: ''
    });
    setShowCreateClientModal(false);
    fetchClientes(); // Refresh the client list
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto_destino = parseFloat(form.monto_origen) * parseFloat(form.tasa_cambio);
    const data = {
      ...form,
      monto_destino: parseFloat(monto_destino.toFixed(2)),
      monto_origen: parseFloat(form.monto_origen),
      tasa_cambio: parseFloat(form.tasa_cambio),
      comision: parseFloat(form.comision),
      ganancia: parseFloat(form.ganancia),
      cuenta_bancaria_id: parseInt(form.cuenta_bancaria_id),
      wallet_origen_id: parseInt(form.wallet_origen_id),
      wallet_destino_id: parseInt(form.wallet_destino_id),
      cliente_id: parseInt(form.cliente_id),
      usuario_id: parseInt(form.usuario_id),
    };

    await axios.post(`${import.meta.env.VITE_API_URL}/api/remesas`, data);
    setForm((f) => ({ ...f, monto_origen: '', tasa_cambio: '', comision: '', ganancia: '', beneficiario_nombre: '', notas: '' }));
    fetchRemesas();
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-center">Registro de Remesas</h1>
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
        <div className="mb-3">
          <label className="form-label">Cliente</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={form.cliente_id}
              readOnly
              placeholder="Seleccione un cliente"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre del Beneficiario</label>
          <input name="beneficiario_nombre" value={form.beneficiario_nombre} onChange={handleChange} className="form-control" />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Monto Origen</label>
            <input name="monto_origen" type="number" step="0.01" value={form.monto_origen} onChange={handleChange} className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Comisión</label>
            <input name="comision" type="number" step="0.01" value={form.comision} onChange={handleChange} className="form-control" />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Ganancia</label>
            <input name="ganancia" type="number" step="0.01" value={form.ganancia} onChange={handleChange} className="form-control" />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} className="form-control" />
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-primary">Registrar Remesa</button>
        </div>
      </form>

      <h2 className="text-center mb-4">Movimientos Registrados</h2>
      <table className="table table-striped table-bordered shadow">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Monto Origen</th>
            <th>Destino</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {remesas.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.cliente_nombre}</td>
              <td className="text-end">${r.monto_origen}</td>
              <td className="text-end">${r.monto_destino}</td>
              <td>{r.estado}</td>
              <td>{new Date(r.fecha_hora).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for selecting a client */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
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
                <div className="d-flex justify-content-between mb-3">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={handleSearch}
                  />
                  <button
                    className="btn btn-success"
                    onClick={() => setShowCreateClientModal(true)}
                  >
                    Crear Cliente
                  </button>
                </div>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td>{cliente.id}</td>
                        <td>{cliente.nombre_completo}</td>
                        <td>{cliente.telefono}</td>
                        <td>{cliente.email}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSelectCliente(cliente)}
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating a new client */}
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
              <form onSubmit={handleCreateClient}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={newClientForm.nombre_completo}
                      onChange={handleNewClientChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Identificación</label>
                    <input
                      type="text"
                      name="identificacion"
                      value={newClientForm.identificacion}
                      onChange={handleNewClientChange}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={newClientForm.telefono}
                      onChange={handleNewClientChange}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newClientForm.email}
                      onChange={handleNewClientChange}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <textarea
                      name="direccion"
                      value={newClientForm.direccion}
                      onChange={handleNewClientChange}
                      className="form-control"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateClientModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
