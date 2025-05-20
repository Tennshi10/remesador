import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('token');

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
    metodo_origen_id: '',
    metodo_destino_id: '',
    monto_origen: '',
    tasa_cambio: '',
    monto_recibir: '',
    estado: 'Pendiente',
    wallet_origen_id: 1,
    wallet_destino_id: 1,
    cuenta_bancaria_id: 1,
    nombre_destinatario: '',
    cedula_destinatario: '',
    cuenta_banco_destinatario: ''
  });
  const [clientes, setClientes] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [filteredDestinos, setFilteredDestinos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [tasas, setTasas] = useState([]);
  const rol = localStorage.getItem('rol') || '';
  const [adjuntosCliente, setAdjuntosCliente] = useState([]);
  const [adjuntosOperador, setAdjuntosOperador] = useState([]);
  const [adjuntosClienteExtra, setAdjuntosClienteExtra] = useState([]);
  const [adjuntosOperadorExtra, setAdjuntosOperadorExtra] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editRemesa, setEditRemesa] = useState(null);
  const [adjuntosOperadorEdit, setAdjuntosOperadorEdit] = useState([]);

  useEffect(() => {
    fetchRemesas();
    fetchUsuarios();
    fetchClientes();
    fetchMetodos();
    fetchProveedores();
    fetchTasas();
  }, []);

  const fetchRemesas = async () => {
    const res = await axios.get(`${API_URL}/api/remesas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRemesas(res.data);
    console.log('Remesas cargadas:', res.data); // <-- depuración
  };

  const fetchUsuarios = async () => {
    const res = await axios.get(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsuarios(res.data);
  };

  const fetchClientes = async () => {
    const res = await axios.get(`${API_URL}/api/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setClientes(res.data);
  };

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMetodos(res.data);
  };

  const fetchProveedores = async () => {
    const res = await axios.get(`${API_URL}/api/proveedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProveedores(res.data);
  };

  const fetchTasas = async () => {
    const res = await axios.get(`${API_URL}/api/tasas_cambios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasas(res.data);
  };

  const getMetodosDestino = () => {
    if (!remesaForm.metodo_origen_id) return [];
    return metodos.filter(dest =>
      tasas.some(t =>
        t.metodo_origen_id === parseInt(remesaForm.metodo_origen_id) &&
        t.metodo_destino_id === dest.id
      )
    );
  };

  useEffect(() => {
    const calcularTasaYRecibir = async () => {
      if (remesaForm.metodo_origen_id && remesaForm.metodo_destino_id && remesaForm.monto_origen) {
        const res = await axios.get(`${API_URL}/api/tasas_cambios?origen=${remesaForm.metodo_origen_id}&destino=${remesaForm.metodo_destino_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tasa = res.data?.tasa_cambio || '';
        const montoRecibir = tasa ? (parseFloat(remesaForm.monto_origen) * parseFloat(tasa)).toFixed(2) : '';
        setRemesaForm(f => ({
          ...f,
          tasa_cambio: tasa,
          monto_recibir: montoRecibir,
          monto_destino: montoRecibir
        }));
      }
    };
    calcularTasaYRecibir();
    // eslint-disable-next-line
  }, [remesaForm.metodo_origen_id, remesaForm.metodo_destino_id, remesaForm.monto_origen]);

  const handleFiltrar = () => {
    fetchRemesas();
  };

  const filteredRemesas = remesas.filter(r => {
    let match = true;
    if (!estado && !fechaInicio && !fechaFin && !search && rolFiltro === 'Todos') return true;
    if (estado && estado !== 'Todos' && r.estado !== estado) match = false;
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
        !r.operador?.toLowerCase().includes(s) &&
        !r.metodo_origen_nombre?.toLowerCase().includes(s) &&
        !r.metodo_destino_nombre?.toLowerCase().includes(s) &&
        !r.proveedor_nombre?.toLowerCase().includes(s) &&
        !r.revendedor_nombre?.toLowerCase().includes(s)
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
    setShowModal(true); // Mostrar el modal inmediatamente
    try {
      const res = await axios.get(`${API_URL}/api/comprobantes/${remesa.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComprobantes(res.data);
    } catch (err) {
      setComprobantes([]); // Si falla, deja comprobantes vacío
      // Opcional: puedes mostrar un mensaje de error aquí si lo deseas
    }
  };

  const handleCambiarEstado = async (remesa, nuevoEstado) => {
    await axios.put(`${API_URL}/api/remesas/${remesa.id}`, { estado: nuevoEstado }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchRemesas();
  };

  const handleEliminar = async (remesa) => {
    if (window.confirm('¿Seguro que deseas eliminar esta remesa?')) {
      await axios.put(`${API_URL}/api/remesas/${remesa.id}`, { estado: 'Eliminada' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRemesas();
    }
  };

  // Agrega la función fetchTasaCambio para evitar el error de referencia
  const fetchTasaCambio = async (origenId, destinoId) => {
    if (!origenId || !destinoId) return;
    try {
      const res = await axios.get(`${API_URL}/api/tasas_cambios?origen=${origenId}&destino=${destinoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tasa = res.data?.tasa_cambio || '';
      setRemesaForm(f => ({
        ...f,
        tasa_cambio: tasa,
        monto_recibir: tasa && f.monto_origen ? (parseFloat(f.monto_origen) * parseFloat(tasa)).toFixed(2) : '',
        monto_destino: tasa && f.monto_origen ? (parseFloat(f.monto_origen) * parseFloat(tasa)).toFixed(2) : ''
      }));
    } catch (err) {
      setRemesaForm(f => ({
        ...f,
        tasa_cambio: '',
        monto_recibir: '',
        monto_destino: ''
      }));
    }
  };

  const handleRemesaFormChange = (e) => {
    const { name, value } = e.target;
    setRemesaForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'metodo_origen_id') {
      setFilteredDestinos(metodos.filter((metodo) => metodo.id !== parseInt(value)));
      setRemesaForm((prev) => ({ ...prev, metodo_destino_id: '', tasa_cambio: '', monto_recibir: '' }));
    }
    if (name === 'metodo_destino_id' && remesaForm.metodo_origen_id) {
      fetchTasaCambio(remesaForm.metodo_origen_id, value);
    }
    // Si cambia monto_origen, recalcula monto_recibir si ya hay tasa
    if (name === 'monto_origen' && remesaForm.tasa_cambio) {
      setRemesaForm((prev) => ({
        ...prev,
        monto_recibir: prev.tasa_cambio && value ? (parseFloat(value) * parseFloat(prev.tasa_cambio)).toFixed(2) : ''
      }));
    }
  };

  const handleRegistrarRemesa = async (e) => {
    e.preventDefault();
    try {
      const monto_destino = parseFloat(remesaForm.monto_origen) * parseFloat(remesaForm.tasa_cambio);
      const data = {
        ...remesaForm,
        usuario_id: parseInt(localStorage.getItem('user_id')),
        monto_destino: parseFloat(monto_destino ? monto_destino.toFixed(2) : 0),
        monto_origen: parseFloat(remesaForm.monto_origen),
        tasa_cambio: parseFloat(remesaForm.tasa_cambio),
        cuenta_bancaria_id: parseInt(remesaForm.cuenta_bancaria_id),
        wallet_origen_id: parseInt(remesaForm.wallet_origen_id),
        wallet_destino_id: parseInt(remesaForm.wallet_destino_id),
        metodo_origen_id: parseInt(remesaForm.metodo_origen_id),
        metodo_destino_id: parseInt(remesaForm.metodo_destino_id),
        cliente_id: parseInt(remesaForm.cliente_id),
      };

      // Registrar la remesa
      const res = await axios.post(`${API_URL}/api/remesas`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const remesaId = res.data.id;

      // Subir adjuntos cliente
      if (adjuntosCliente.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        formData.append('tipo_pago', 'cliente');
        adjuntosCliente.forEach(file => formData.append('comprobantes', file));
        await axios.post(`${API_URL}/api/comprobantes`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      // Subir adjuntos operador (solo si operador/admin)
      if (rol !== 'cliente' && adjuntosOperador.length > 0) {
        const formData = new FormData();
        formData.append('remesa_id', remesaId);
        formData.append('tipo_pago', 'operador');
        adjuntosOperador.forEach(file => formData.append('comprobantes', file));
        await axios.post(`${API_URL}/api/comprobantes`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowRemesaModal(false);
      setRemesaForm({
        cliente_id: '',
        usuario_id: localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : 1,
        metodo_origen_id: '',
        metodo_destino_id: '',
        monto_origen: '',
        tasa_cambio: '',
        monto_recibir: '',
        estado: 'Pendiente',
        wallet_origen_id: 1,
        wallet_destino_id: 1,
        cuenta_bancaria_id: 1,
        nombre_destinatario: '',
        cedula_destinatario: '',
        cuenta_banco_destinatario: ''
      });
      setAdjuntosCliente([]);
      setAdjuntosOperador([]);
      fetchRemesas();
    } catch (err) {
      alert('Error al registrar remesa');
    }
  };

  const handleAdjuntarPagos = async (tipo) => {
    if (!selectedRemesa) return;
    const files = tipo === 'cliente' ? adjuntosClienteExtra : adjuntosOperadorExtra;
    if (!files.length) return;
    const formData = new FormData();
    formData.append('remesa_id', selectedRemesa.id);
    formData.append('tipo_pago', tipo);
    files.forEach(file => formData.append('comprobantes', file));
    await axios.post(`${API_URL}/api/comprobantes`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    setAdjuntosClienteExtra([]);
    setAdjuntosOperadorExtra([]);
    // Recarga comprobantes
    const res = await axios.get(`${API_URL}/api/comprobantes/${selectedRemesa.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComprobantes(res.data);
  };

  const handleEditRemesa = (remesa) => {
    setEditMode(true);
    setEditRemesa({ ...remesa });
    setShowModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRemesa(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    await axios.put(`${API_URL}/api/remesas/${editRemesa.id}`, editRemesa, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setEditMode(false);
    setShowModal(false);
    fetchRemesas();
  };

  const handleAdjuntarOperadorEdit = async () => {
    if (!editRemesa || adjuntosOperadorEdit.length === 0) return;
    const formData = new FormData();
    formData.append('remesa_id', editRemesa.id);
    formData.append('tipo_pago', 'operador');
    adjuntosOperadorEdit.forEach(file => formData.append('comprobantes', file));
    await axios.post(`${API_URL}/api/comprobantes`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    setAdjuntosOperadorEdit([]);
    // Recarga comprobantes
    const res = await axios.get(`${API_URL}/api/comprobantes/${editRemesa.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComprobantes(res.data);
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
        <div className="me-2 mb-2" style={{ maxWidth: 180 }}>
          <label className="form-label mb-0" htmlFor="filtro-estado">Estatus</label>
          <select
            id="filtro-estado"
            className="form-select"
            value={estado}
            onChange={e => setEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Comprobar Pago">Comprobar Pago</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completada">Completada</option>
          </select>
        </div>
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
            <th>Operador</th>
            <th>Revendedor</th>
            <th>Proveedor</th>
            <th>Método Origen</th>
            <th>Método Destino</th>
            <th>Monto Enviado</th>
            <th>Monto Recibido</th>
            <th>Estado</th>
            {/* <th>Comprobantes</th> */}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRemesas.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.fecha_hora).toLocaleDateString()}</td>
              <td>{r.cliente_nombre}</td>
              <td>{r.operador}</td>
              <td>{r.revendedor_nombre || r.revendedor_id || ''}</td>
              <td>{r.proveedor_nombre || r.proveedor_id || ''}</td>
              <td>{r.metodo_origen_nombre || r.metodo_origen_id}</td>
              <td>{r.metodo_destino_nombre || r.metodo_destino_id}</td>
              <td>{r.monto_origen}</td>
              <td>{r.monto_destino}</td>
              <td>
                <span className={`badge bg-${
                  r.estado === 'Comprobar Pago' ? 'info' :
                  r.estado === 'Pendiente' ? 'warning' :
                  r.estado === 'Completada' ? 'success' : 'secondary'
                }`}>
                  {r.estado}
                </span>
              </td>
              {/* <td>
                ...comprobantes column removed...
              </td> */}
              <td>
                <button className="btn btn-sm btn-info me-1" onClick={() => handleVer(r)}>Ver</button>
                {r.estado === 'Comprobar Pago' && (
                  <button className="btn btn-sm btn-primary me-1" onClick={() => handleCambiarEstado(r, 'Pendiente')}>
                    Pago Comprobado
                  </button>
                )}
                {r.estado === 'Pendiente' && (
                  <>
                    <button className="btn btn-sm btn-success me-1" onClick={() => handleCambiarEstado(r, 'Completada')}>
                      Completar
                    </button>
                    <button className="btn btn-sm btn-warning me-1" onClick={() => handleCambiarEstado(r, 'Comprobar Pago')}>
                      Marcar Comprobar Pago
                    </button>
                  </>
                )}
                {r.estado === 'Completada' && (
                  <button className="btn btn-sm btn-warning me-1" onClick={() => handleCambiarEstado(r, 'Pendiente')}>
                    Marcar Pendiente
                  </button>
                )}
                <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(r)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
                  {rol === 'cliente' && (
                    <div className="alert alert-info">
                      Por favor indique los datos de su envío, en la brevedad un Operador se pondrá en contacto para confirmar su pago y proceder con el envío.
                    </div>
                  )}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label>Cliente que envía</label>
                      <select
                        name="cliente_id"
                        className="form-control"
                        value={remesaForm.cliente_id}
                        onChange={handleRemesaFormChange}
                        required
                        disabled={rol === 'cliente'}
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <label>Nombre Destinatario</label>
                      <input
                        name="nombre_destinatario"
                        className="form-control"
                        value={remesaForm.nombre_destinatario || ''}
                        onChange={handleRemesaFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label>Cédula Destinatario</label>
                      <input
                        name="cedula_destinatario"
                        className="form-control"
                        value={remesaForm.cedula_destinatario || ''}
                        onChange={handleRemesaFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label>Cuenta Banco Destinatario</label>
                      <input
                        name="cuenta_banco_destinatario"
                        className="form-control"
                        value={remesaForm.cuenta_banco_destinatario || ''}
                        onChange={handleRemesaFormChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <label>Monto a Enviar</label>
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
                      <label>Método de Origen</label>
                      <select
                        name="metodo_origen_id"
                        className="form-control"
                        value={remesaForm.metodo_origen_id}
                        onChange={handleRemesaFormChange}
                        required
                      >
                        <option value="">Seleccione</option>
                        {metodos.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label>Método de Destino</label>
                      <select
                        name="metodo_destino_id"
                        className="form-control"
                        value={remesaForm.metodo_destino_id}
                        onChange={handleRemesaFormChange}
                        required
                        disabled={!remesaForm.metodo_origen_id}
                      >
                        <option value="">Seleccione</option>
                        {getMetodosDestino().map(m => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <label>Tasa Aplicada</label>
                      <input
                        name="tasa_cambio"
                        type="number"
                        className="form-control"
                        value={remesaForm.tasa_cambio}
                        readOnly
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label>Monto a Recibir (Aprox)</label>
                      <input
                        name="monto_recibir"
                        type="number"
                        className="form-control"
                        value={remesaForm.monto_recibir}
                        readOnly
                        required
                      />
                    </div>
                  </div>
                  {rol !== 'cliente' && (
                    <div className="mb-2">
                      <label>Proveedor</label>
                      <select
                        name="proveedor_id"
                        className="form-control"
                        value={remesaForm.proveedor_id || ''}
                        onChange={handleRemesaFormChange}
                        required
                      >
                        <option value="">Seleccione un proveedor</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mb-2">
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
                  {rol !== 'cliente' && (
                    <div className="mb-2">
                      <label>Adjuntos Pago(s) Operador</label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={e => setAdjuntosOperador(Array.from(e.target.files))}
                      />
                    </div>
                  )}
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
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditMode(false); }}></button>
              </div>
              <div className="modal-body">
                {editMode ? (
                  <>
                    <div className="row mb-2">
                      <div className="col-md-6">
                        <label>Proveedor</label>
                        <select
                          className="form-control"
                          name="proveedor_id"
                          value={editRemesa.proveedor_id || ''}
                          onChange={handleEditChange}
                        >
                          <option value="">Seleccione un proveedor</option>
                          {proveedores.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Monto Origen</label>
                        <input
                          className="form-control"
                          name="monto_origen"
                          value={editRemesa.monto_origen || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-md-4">
                        <label>Nombre Destinatario</label>
                        <input
                          className="form-control"
                          name="nombre_destinatario"
                          value={editRemesa.nombre_destinatario || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Cédula Destinatario</label>
                        <input
                          className="form-control"
                          name="cedula_destinatario"
                          value={editRemesa.cedula_destinatario || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Cuenta Banco Destinatario</label>
                        <input
                          className="form-control"
                          name="cuenta_banco_destinatario"
                          value={editRemesa.cuenta_banco_destinatario || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label>Adjuntar más pagos operador</label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={e => setAdjuntosOperadorEdit(Array.from(e.target.files))}
                      />
                      <button className="btn btn-primary mt-2" type="button" onClick={handleAdjuntarOperadorEdit}>
                        Subir Adjuntos Operador
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p><b>Proveedor:</b> {
                      proveedores.find(p => String(p.id) === String(selectedRemesa.proveedor_id))?.nombre || selectedRemesa.proveedor_id
                    }</p>
                    <p><b>Monto Origen:</b> {selectedRemesa.monto_origen}</p>
                    <p><b>Monto Destino:</b> {selectedRemesa.monto_destino}</p>
                    <p><b>Estado:</b> {selectedRemesa.estado}</p>
                    <p><b>Nombre Destinatario:</b> {selectedRemesa.nombre_destinatario}</p>
                    <p><b>Cédula Destinatario:</b> {selectedRemesa.cedula_destinatario}</p>
                    <p><b>Cuenta Banco Destinatario:</b> {selectedRemesa.cuenta_banco_destinatario}</p>
                  </>
                )}
                <hr />
                <h6>Adjuntos Pago(s) Cliente</h6>
                <ul>
                  {comprobantes.filter(c => c.tipo_pago === 'cliente').length === 0 && <li>No hay comprobantes</li>}
                  {comprobantes.filter(c => c.tipo_pago === 'cliente').map(c => (
                    <li key={c.id}>
                      <button
                        className="btn btn-link p-0"
                        style={{ textDecoration: 'underline', color: '#007bff' }}
                        onClick={() => setShowComprobante(c)}
                        type="button"
                      >
                        {c.nombre_archivo}
                      </button>
                    </li>
                  ))}
                </ul>
                <h6 className="mt-3">Adjuntos Pago(s) Operador</h6>
                <ul>
                  {comprobantes.filter(c => c.tipo_pago === 'operador').length === 0 && <li>No hay comprobantes</li>}
                  {comprobantes.filter(c => c.tipo_pago === 'operador').map(c => (
                    <li key={c.id}>
                      <button
                        className="btn btn-link p-0"
                        style={{ textDecoration: 'underline', color: '#007bff' }}
                        onClick={() => setShowComprobante(c)}
                        type="button"
                      >
                        {c.nombre_archivo}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                {editMode ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancelar</button>
                    <button className="btn btn-success" onClick={handleSaveEdit}>Guardar Cambios</button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={() => handleEditRemesa(selectedRemesa)}>Editar</button>
                )}
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditMode(false); }}>Cerrar</button>
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
                  <img src={API_URL + showComprobante.ruta} alt="comprobante" style={{ maxWidth: '100%' }} />
                ) : showComprobante.ruta.match(/\.pdf$/i) ? (
                  <iframe src={API_URL + showComprobante.ruta} title="comprobante" style={{ width: '100%', height: '70vh' }}></iframe>
                ) : (
                  <a href={API_URL + showComprobante.ruta} target="_blank" rel="noopener noreferrer">Descargar</a>
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
