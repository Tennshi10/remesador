import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function Tasas() {
  const [tasas, setTasas] = useState([]); // Siempre array
  const [paises, setPaises] = useState([]); // Siempre array
  const [form, setForm] = useState({
    pais_origen_id: '',
    pais_destino_id: '',
    tasa: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [newPais, setNewPais] = useState({ nombre: '', codigo_iso: '', moneda: '', codigo_moneda: '', simbolo_moneda: '' });

  useEffect(() => {
    fetchTasas();
    fetchPaises();
  }, []);

  const fetchTasas = async () => {
    // Cambia la URL para obtener todas las tasas (no solo por origen/destino)
    const res = await axios.get(`${API_URL}/api/tasas_cambios`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setTasas(Array.isArray(res.data) ? res.data : []);
  };

  const fetchPaises = async () => {
    const res = await axios.get(`${API_URL}/api/paises`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setPaises(Array.isArray(res.data) ? res.data : []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/tasas_cambios`, {
      pais_origen_id: form.pais_origen_id,
      pais_destino_id: form.pais_destino_id,
      tasa: form.tasa,
    });
    setForm({ pais_origen_id: '', pais_destino_id: '', tasa: '' });
    fetchTasas();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tasa?')) {
      await axios.delete(`${API_URL}/api/tasas_cambios/${id}`);
      fetchTasas();
    }
  };

  const handleNewPaisChange = (e) => {
    const { name, value } = e.target;
    setNewPais((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePais = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/paises`, newPais);
    setNewPais({ nombre: '', codigo_iso: '', moneda: '', codigo_moneda: '', simbolo_moneda: '' });
    setShowModal(false);
    fetchPaises();
  };

  return (
    <div>
      <h2>Tasas y Comisiones</h2>
      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="row">
          <div className="col-md-4 mb-2">
            <label>País Origen</label>
            <select className="form-control" name="pais_origen_id" value={form.pais_origen_id} onChange={handleChange} required>
              <option value="">Seleccione</option>
              {(paises || []).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-2">
            <label>País Destino</label>
            <select className="form-control" name="pais_destino_id" value={form.pais_destino_id} onChange={handleChange} required>
              <option value="">Seleccione</option>
              {(paises || []).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label>Tasa</label>
            <input className="form-control" name="tasa" type="number" step="0.0001" value={form.tasa} onChange={handleChange} required />
          </div>
          <div className="col-md-2 mb-2 d-flex align-items-end">
            <button type="submit" className="btn btn-primary w-100">Agregar/Actualizar</button>
          </div>
        </div>
        <div className="mt-2">
          <button type="button" className="btn btn-link" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle"></i> Agregar País
          </button>
        </div>
      </form>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Tasa</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(tasas || []).map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{(paises.find(p => p.id === t.pais_origen_id) || {}).nombre || t.pais_origen_id}</td>
              <td>{(paises.find(p => p.id === t.pais_destino_id) || {}).nombre || t.pais_destino_id}</td>
              <td>{t.tasa}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para agregar país */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar País</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreatePais}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input className="form-control" name="nombre" value={newPais.nombre} onChange={handleNewPaisChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Código ISO</label>
                    <input className="form-control" name="codigo_iso" value={newPais.codigo_iso} onChange={handleNewPaisChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Moneda</label>
                    <input className="form-control" name="moneda" value={newPais.moneda} onChange={handleNewPaisChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Código Moneda</label>
                    <input className="form-control" name="codigo_moneda" value={newPais.codigo_moneda} onChange={handleNewPaisChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Simbolo Moneda</label>
                    <input className="form-control" name="simbolo_moneda" value={newPais.simbolo_moneda} onChange={handleNewPaisChange} />
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
