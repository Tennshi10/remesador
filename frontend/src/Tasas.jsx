import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function Tasas() {
  const [tasas, setTasas] = useState([]); // Siempre array
  const [metodos, setMetodos] = useState([]); // Siempre array
  const [form, setForm] = useState({
    metodo_origen_id: '',
    metodo_destino_id: '',
    tasa: '',
    porcentaje: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [newMetodo, setNewMetodo] = useState({ nombre: '', moneda: '', tasa_base: '', comision_porcentaje: '' });
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({
    desde: '',
    hasta: '',
    comision: ''
  });
  const [calcResult, setCalcResult] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editPorcentaje, setEditPorcentaje] = useState('');

  useEffect(() => {
    fetchTasas();
    fetchMetodos();
  }, []);

  const fetchTasas = async () => {
    const res = await axios.get(`${API_URL}/api/tasas_cambios`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    // Si porcentaje (misc1) es null, pon 0
    setTasas(Array.isArray(res.data) ? res.data.map(t => ({
      ...t,
      porcentaje: t.porcentaje === null ? 0 : t.porcentaje
    })) : []);
  };

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setMetodos(Array.isArray(res.data) ? res.data : []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si cambia porcentaje, recalcula la tasa automáticamente
    if (name === 'porcentaje' || name === 'metodo_origen_id' || name === 'metodo_destino_id') {
      let porc = name === 'porcentaje' ? value : form.porcentaje;
      let origenId = name === 'metodo_origen_id' ? value : form.metodo_origen_id;
      let destinoId = name === 'metodo_destino_id' ? value : form.metodo_destino_id;
      if (origenId && destinoId) {
        const metodoDesde = metodos.find(m => m.id === parseInt(origenId));
        const metodoHasta = metodos.find(m => m.id === parseInt(destinoId));
        if (metodoDesde && metodoHasta) {
          const baseDesde = parseFloat(metodoDesde.tasa_base);
          const baseHasta = parseFloat(metodoHasta.tasa_base);
          const porcNum = parseFloat(porc || 0);
          let tasa = (baseHasta / baseDesde) * (1 - porcNum / 100);
          tasa = Math.round(tasa * 10000) / 10000;
          setForm((prev) => ({
            ...prev,
            [name]: value,
            tasa: isNaN(tasa) ? '' : tasa
          }));
          return;
        }
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/tasas_cambios`, {
      metodo_origen_id: form.metodo_origen_id,
      metodo_destino_id: form.metodo_destino_id,
      tasa: form.tasa,
      porcentaje: form.porcentaje
    });
    setForm({ metodo_origen_id: '', metodo_destino_id: '', tasa: '', porcentaje: '' });
    fetchTasas();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tasa?')) {
      await axios.delete(`${API_URL}/api/tasas_cambios/${id}`);
      fetchTasas();
    }
  };

  const handleNewMetodoChange = (e) => {
    const { name, value } = e.target;
    setNewMetodo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMetodo = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/metodos`, newMetodo, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setNewMetodo({ nombre: '', moneda: '', tasa_base: '', comision_porcentaje: '' });
    setShowModal(false);
    fetchMetodos();
  };

  // Calculadora de tasas
  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setCalcForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalcular = () => {
    const metodoDesde = metodos.find(m => m.id === parseInt(calcForm.desde));
    const metodoHasta = metodos.find(m => m.id === parseInt(calcForm.hasta));
    if (!metodoDesde || !metodoHasta) {
      setCalcResult(null);
      return;
    }
    const baseDesde = parseFloat(metodoDesde.tasa_base);
    const baseHasta = parseFloat(metodoHasta.tasa_base);
    const comision = parseFloat(calcForm.comision || 0);
    if (!baseDesde || !baseHasta) {
      setCalcResult(null);
      return;
    }
    // Formula: (TasaBaseHasta / TasaBaseDesde) * (1- Comision% / 100)
    let tasa = (baseHasta / baseDesde) * (1 - comision / 100);
    tasa = Math.round(tasa); // redondear al entero más cercano
    setCalcResult({
      tasa,
      desde: metodoDesde.nombre,
      hasta: metodoHasta.nombre
    });
  };

  const handleUsarTasa = async () => {
    if (!calcForm.desde || !calcForm.hasta || !calcResult) return;
    // Preguntar si desea guardar/actualizar
    if (!window.confirm('¿Desea guardar esta tasa como fija entre estos métodos?')) return;
    await axios.post(`${API_URL}/api/tasas_cambios`, {
      metodo_origen_id: calcForm.desde,
      metodo_destino_id: calcForm.hasta,
      tasa: calcResult.tasa
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchTasas();
    setShowCalc(false);
    setCalcForm({ desde: '', hasta: '', comision: '' });
    setCalcResult(null);
  };

  // Edición rápida de porcentaje/tasa (solo para el botón Guardar)
  const handleSaveEditTasa = async (t) => {
    let newPorc = editPorcentaje;
    // Recalcula tasa
    const metodoDesde = metodos.find(m => m.id === t.metodo_origen_id);
    const metodoHasta = metodos.find(m => m.id === t.metodo_destino_id);
    let newTasa = t.tasa;
    if (metodoDesde && metodoHasta) {
      const baseDesde = parseFloat(metodoDesde.tasa_base);
      const baseHasta = parseFloat(metodoHasta.tasa_base);
      const porcNum = parseFloat(newPorc || 0);
      newTasa = Math.round((baseHasta / baseDesde) * (1 - porcNum / 100) * 10000) / 10000;
    }
    await axios.put(`${API_URL}/api/tasas_cambios/${t.id}`, {
      metodo_origen_id: t.metodo_origen_id,
      metodo_destino_id: t.metodo_destino_id,
      tasa: newTasa,
      porcentaje: newPorc
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setEditRowId(null);
    setEditPorcentaje('');
    fetchTasas();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Tasas y Comisiones</h2>
        <button className="btn btn-secondary" onClick={() => setShowCalc(true)}>
          <i className="bi bi-calculator"></i> Calculadora
        </button>
      </div>
      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="row">
          <div className="col-md-3 mb-2">
            <label>Método Origen</label>
            <select className="form-control" name="metodo_origen_id" value={form.metodo_origen_id} onChange={handleChange} required>
              <option value="">Seleccione</option>
              {(metodos || []).map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <label>Método Destino</label>
            <select className="form-control" name="metodo_destino_id" value={form.metodo_destino_id} onChange={handleChange} required>
              <option value="">Seleccione</option>
              {(metodos || []).map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label>Porcentaje (%)</label>
            <input className="form-control" name="porcentaje" type="number" step="0.01" value={form.porcentaje === undefined || form.porcentaje === null ? 0 : form.porcentaje} onChange={handleChange} required />
          </div>
          <div className="col-md-2 mb-2">
            <label>Tasa</label>
            <input className="form-control" name="tasa" type="number" step="0.0001" value={form.tasa} onChange={handleChange} required readOnly />
          </div>
          <div className="col-md-2 mb-2 d-flex align-items-end">
            <button type="submit" className="btn btn-primary w-100">Agregar/Actualizar</button>
          </div>
        </div>
        <div className="mt-2">
          <button type="button" className="btn btn-link" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle"></i> Agregar Método
          </button>
        </div>
      </form>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Porcentaje (%)</th>
            <th>Tasa</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(tasas || []).map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{(metodos.find(m => m.id === t.metodo_origen_id) || {}).nombre || t.metodo_origen_id}</td>
              <td>{(metodos.find(m => m.id === t.metodo_destino_id) || {}).nombre || t.metodo_destino_id}</td>
              <td>
                {editRowId === t.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editPorcentaje}
                    style={{ width: 70 }}
                    onChange={e => setEditPorcentaje(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={t.porcentaje === undefined || t.porcentaje === null ? 0 : t.porcentaje}
                    style={{ width: 70 }}
                    disabled
                  />
                )}
              </td>
              <td>{t.tasa}</td>
              <td>
                {editRowId === t.id ? (
                  <button
                    className="btn btn-success btn-sm me-1"
                    onClick={() => handleSaveEditTasa(t)}
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm me-1"
                    onClick={() => {
                      setEditRowId(t.id);
                      setEditPorcentaje(t.porcentaje === undefined || t.porcentaje === null ? 0 : t.porcentaje);
                    }}
                  >
                    Editar
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Calculadora */}
      {showCalc && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Calculadora de Tasas</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCalc(false); setCalcResult(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label>Método/Pais Desde</label>
                  <select className="form-control" name="desde" value={calcForm.desde} onChange={handleCalcChange} required>
                    <option value="">Seleccione</option>
                    {metodos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label>Método/Pais Hasta</label>
                  <select className="form-control" name="hasta" value={calcForm.hasta} onChange={handleCalcChange} required>
                    <option value="">Seleccione</option>
                    {metodos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label>Comisión adicional (%)</label>
                  <input className="form-control" name="comision" type="number" step="0.01" value={calcForm.comision} onChange={handleCalcChange} />
                </div>
                <button className="btn btn-primary" type="button" onClick={handleCalcular}>Calcular</button>
                {calcResult && (
                  <div className="alert alert-info mt-3">
                    <b>Resultado:</b> Por cada unidad de <b>{calcResult.desde}</b> recibirás <b>{calcResult.tasa}</b> en <b>{calcResult.hasta}</b>
                    <div className="mt-2">
                      <button className="btn btn-success" onClick={handleUsarTasa}>Usar esta Tasa</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar método */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Método</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateMetodo}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input className="form-control" name="nombre" value={newMetodo.nombre} onChange={handleNewMetodoChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Moneda</label>
                    <input className="form-control" name="moneda" value={newMetodo.moneda} onChange={handleNewMetodoChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Tasa Base</label>
                    <input className="form-control" name="tasa_base" type="number" step="0.0001" value={newMetodo.tasa_base} onChange={handleNewMetodoChange} required />
                  </div>
                  <div className="mb-2">
                    <label>% Comisión</label>
                    <input className="form-control" name="comision_porcentaje" type="number" step="0.01" value={newMetodo.comision_porcentaje} onChange={handleNewMetodoChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasas;
