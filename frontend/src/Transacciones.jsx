import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000'; // Cambia si tu backend está en otro host

function Transacciones() {
  const [remesas, setRemesas] = useState([]);
  const [estado, setEstado] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRemesa, setSelectedRemesa] = useState(null);
  const [comprobantes, setComprobantes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showComprobante, setShowComprobante] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [rolFiltro, setRolFiltro] = useState('Todos');
  const [showRemesaModal, setShowRemesaModal] = useState(false);
  const [remesaForm, setRemesaForm] = useState({
    cliente_id: '',
    usuario_id: localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : 1,
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
  const [clientes, setClientes] = useState([]);
  const [paises, setPaises] = useState([]);
  const [filteredDestinos, setFilteredDestinos] = useState([]);

  useEffect(() => {
    fetchRemesas();
    fetchUsuarios();
    fetchClientes();
    fetchPaises();
  }, []);

  const fetchRemesas = async () => {
    const res = await axios.get('/api/remesas');
    setRemesas(res.data);
  };

  const fetchUsuarios = async () => {
    const res = await axios.get('/api/usuarios');
    setUsuarios(res.data);
  };

  const fetchClientes = async () => {
    const res = await axios.get('/api/clientes');
    setClientes(res.data);
  };

  const fetchPaises = async () => {
    const res = await axios.get('/api/paises');
    setPaises(res.data);
  };

  const fetchTasaCambio = async (origenId, destinoId) => {
    try {
      const res = await axios.get(`/api/tasas_cambios?origen=${origenId}&destino=${destinoId}`);
      if (res.data) {
        setRemesaForm((prev) => ({ ...prev, tasa_cambio: res.data.tasa_cambio }));
      } else {
        setRemesaForm((prev) => ({ ...prev, tasa_cambio: '' }));
      }
    } catch (err) {
      // Opcional: manejar error
    }
  };

  const handleFiltrar = () => {
    fetchRemesas();
  };

  const filteredRemesas = remesas.filter(r => {
    let match = true;
    if (estado !== 'Todos' && r.estado !== estado) match = false;
    if (fechaInicio) {
      const fechaRemesa = new Date(r.fecha_hora).toISOString().slice(0, 10);
      if (fechaRemesa < fechaInicio) match = false;
    }
    if (fechaFin) {
      const fechaRemesa = new Date(r.fecha_hora).toISOString().slice(0, 10);
      if (fechaRemesa > fechaFin) match = false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (
        !r.cliente_nombre?.toLowerCase().includes(s) &&
        !r.operador?.toLowerCase().includes(s)
      ) match = false;
    }
    if (rolFiltro !== 'Todos') {
      const usuario = usuarios.find(u => u.id === r.usuario_id);
      if (!usuario) return false;
      if (rolFiltro === 'operador') {
        if (!(usuario.rol === 'operador' || usuario.rol === 'owner')) return false;
      } else {
        if (usuario.rol !== rolFiltro) return false;
      }
    }
    return match;
  });

  const handleVer = async (remesa) => {
    setSelectedRemesa(remesa);
    const res = await axios.get(`/api/comprobantes/${remesa.id}`);
    setComprobantes(res.data);
    setShowModal(true);
  };

  const handleCambiarEstado = async (remesa, nuevoEstado) => {
    await axios.put(`/api/remesas/${remesa.id}`, { estado: nuevoEstado });
    fetchRemesas();
  };

  const handleEliminar = async (remesa) => {
    if (window.confirm('¿Seguro que deseas eliminar esta remesa?')) {
      await axios.delete(`/api/remesas/${remesa.id}`);
      fetchRemesas();
    }
  };

  const handleRemesaFormChange = (e) => {
    const { name, value } = e.target;
    setRemesaForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'pais_origen_id') {
      setFilteredDestinos(paises.filter((pais) => pais.id !== parseInt(value)));
      setRemesaForm((prev) => ({ ...prev, pais_destino_id: '', tasa_cambio: '' }));
    }
    if (name === 'pais_destino_id' && remesaForm.pais_origen_id) {
      fetchTasaCambio(remesaForm.pais_origen_id, value);
    }
  };

  const handleRemesaComprobantesChange = (e) => {
    setComprobantes(Array.from(e.target.files));
  };

  const handleRegistrarRemesa = async (e) => {
    e.preventDefault();
    try {
      const monto_destino = parseFloat(remesaForm.monto_origen) * parseFloat(remesaForm.tasa_cambio);
      const data = {
        ...remesaForm,
        usuario_id: parseInt(localStorage.getItem('user_id')),
        monto_destino: parseFloat(monto_destino.toFixed(2)),
        monto_origen: parseFloat(remesaForm.monto_origen),
        tasa_cambio: parseFloat(remesaForm.tasa_cambio),
        comision: parseFloat(remesaForm.comision),
        ganancia: parseFloat(remesaForm.ganancia),
        cuenta_bancaria_id: parseInt(remesaForm.cuenta_bancaria_id),
        wallet_origen_id: parseInt(remesaForm.wallet_origen_id),
        wallet_destino_id: parseInt(remesaForm.wallet_destino_id),
        pais_origen_id: parseInt(remesaForm.pais_origen_id),
        pais_destino_id: parseInt(remesaForm.pais_destino_id),
        cliente_id: parseInt(remesaForm.cliente_id),
      };

      // 1. Registrar la remesa
      const res = await axios.post('/api/remesas', data);
      const remesaId = res.data.id;

      // 2. Subir comprobantes si hay
      if (comprobantes.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        comprobantes.forEach(file => formData.append('comprobantes', file));
        await axios.post('/api/comprobantes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowRemesaModal(false);
      setRemesaForm({
        cliente_id: '',
        usuario_id: localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : 1,
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
      setComprobantes([]);
      fetchRemesas();
    } catch (err) {
      alert('Error al registrar remesa');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Historial de Todas las Transacciones</h2>
        <button className="btn btn-success" onClick={() => setShowRemesaModal(true)}>
          <i className="bi bi-plus-circle"></i> Registrar Remesa
        </button>
      </div>
      <div className="d-flex mb-3 flex-wrap">
        <input
          type="text"
          className="form-control me-2 mb-2"
          style={{ maxWidth: 200 }}
          placeholder="Buscar por nombre o método..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select me-2 mb-2" style={{ maxWidth: 150 }} value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Completada">Completada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <input
          type="date"
          className="form-control me-2 mb-2"
          style={{ maxWidth: 170 }}
          value={fechaInicio}
          onChange={e => setFechaInicio(e.target.value)}
          placeholder="Fecha inicio"
        />
        <input
          type="date"
          className="form-control me-2 mb-2"
          style={{ maxWidth: 170 }}
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          placeholder="Fecha fin"
        />
        <select className="form-select me-2 mb-2" style={{ maxWidth: 170 }} value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}>
          <option value="Todos">Todos los usuarios</option>
          <option value="cliente">Clientes</option>
          <option value="revendedor">Revendedores</option>
          <option value="operador">Operadores/Owner</option>
        </select>
        <button className="btn btn-primary mb-2" onClick={handleFiltrar}>Aplicar Filtros</button>
      </div>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Monto Enviado</th>
            <th>Monto Recibido</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRemesas.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.fecha_hora).toLocaleDateString()}</td>
              <td>{r.cliente_nombre}</td>
              <td>{r.monto_origen}</td>
              <td>{r.monto_destino}</td>
              <td>
                <span className={`badge bg-${r.estado === 'Pendiente' ? 'warning' : r.estado === 'Completada' ? 'success' : 'secondary'}`}>
                  {r.estado}
                </span>
              </td>
              <td>
                <button className="btn btn-sm btn-info me-1" onClick={() => handleVer(r)}>Ver</button>
                <button className="btn btn-sm btn-secondary me-1" onClick={() => handleCambiarEstado(r, r.estado === 'Pendiente' ? 'Completada' : 'Pendiente')}>
                  {r.estado === 'Pendiente' ? 'Completar' : 'Marcar Pendiente'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(r)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para registrar nueva remesa */}
      {showRemesaModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleRegistrarRemesa}>
                <div className="modal-header">
                  <h5 className="modal-title">Registrar Nueva Remesa</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRemesaModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label>Cliente</label>
                      <select
                        name="cliente_id"
                        className="form-control"
                        value={remesaForm.cliente_id}
                        onChange={handleRemesaFormChange}
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label>Beneficiario</label>
                      <input
                        name="beneficiario_nombre"
                        className="form-control"
                        value={remesaForm.beneficiario_nombre}
                        onChange={handleRemesaFormChange}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label>País Origen</label>
                      <select
                        name="pais_origen_id"
                        className="form-control"
                        value={remesaForm.pais_origen_id}
                        onChange={handleRemesaFormChange}
                        required
                      >
                        <option value="">Seleccione</option>
                        {paises.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label>País Destino</label>
                      <select
                        name="pais_destino_id"
                        className="form-control"
                        value={remesaForm.pais_destino_id}
                        onChange={handleRemesaFormChange}
                        required
                        disabled={!remesaForm.pais_origen_id}
                      >
                        <option value="">Seleccione</option>
                        {filteredDestinos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <label>Monto Origen</label>
                      <input
                        name="monto_origen"
                        type="number"
                        className="form-control"
                        value={remesaForm.monto_origen}
                        onChange={handleRemesaFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label>Tasa de Cambio</label>
                      <input
                        name="tasa_cambio"
                        type="number"
                        className="form-control"
                        value={remesaForm.tasa_cambio}
                        onChange={handleRemesaFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label>Comisión</label>
                      <input
                        name="comision"
                        type="number"
                        className="form-control"
                        value={remesaForm.comision}
                        onChange={handleRemesaFormChange}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <label>Ganancia</label>
                      <input
                        name="ganancia"
                        type="number"
                        className="form-control"
                        value={remesaForm.ganancia}
                        onChange={handleRemesaFormChange}
                      />
                    </div>
                    <div className="col-md-8">
                      <label>Notas</label>
                      <input
                        name="notas"
                        className="form-control"
                        value={remesaForm.notas}
                        onChange={handleRemesaFormChange}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Comprobantes de Pago</label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleRemesaComprobantesChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRemesaModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles y comprobantes */}
      {showModal && selectedRemesa && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalle de Remesa #{selectedRemesa.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><b>Cliente:</b> {selectedRemesa.cliente_nombre}</p>
                <p><b>Monto Origen:</b> {selectedRemesa.monto_origen}</p>
                <p><b>Monto Destino:</b> {selectedRemesa.monto_destino}</p>
                <p><b>Estado:</b> {selectedRemesa.estado}</p>
                <p><b>Notas:</b> {selectedRemesa.notas}</p>
                <hr />
                <h6>Comprobantes de Pago</h6>
                <ul>
                  {comprobantes.length === 0 && <li>No hay comprobantes</li>}
                  {comprobantes.map(c => (
                    <li key={c.id}>
                      <button
                        className="btn btn-link p-0"
                        onClick={() => setShowComprobante(c)}
                        style={{ textDecoration: 'underline', color: '#007bff' }}
                      >
                        {c.nombre_archivo}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar comprobante (imagen/pdf) */}
      {showComprobante && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{showComprobante.nombre_archivo}</h5>
                <button type="button" className="btn-close" onClick={() => setShowComprobante(null)}></button>
              </div>
              <div className="modal-body text-center">
                {showComprobante.ruta.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={BACKEND_URL + showComprobante.ruta} alt="comprobante" style={{ maxWidth: '100%' }} />
                ) : showComprobante.ruta.match(/\.pdf$/i) ? (
                  <iframe src={BACKEND_URL + showComprobante.ruta} title="comprobante" style={{ width: '100%', height: '70vh' }}></iframe>
                ) : (
                  <a href={BACKEND_URL + showComprobante.ruta} target="_blank" rel="noopener noreferrer">Descargar</a>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowComprobante(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transacciones;
