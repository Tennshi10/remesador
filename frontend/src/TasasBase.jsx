import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function TasasBase() {
  const [metodos, setMetodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMetodo, setEditMetodo] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    moneda: '',
    tasa_base: '',
    comision_porcentaje: ''
  });

  useEffect(() => {
    fetchMetodos();
  }, []);

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setMetodos(res.data);
  };

  const handleEdit = (metodo) => {
    setEditMetodo(metodo);
    setForm({
      nombre: metodo.nombre,
      moneda: metodo.moneda,
      tasa_base: metodo.tasa_base,
      comision_porcentaje: metodo.comision_porcentaje
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este método?')) {
      await axios.delete(`${API_URL}/api/metodos/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchMetodos();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editMetodo) {
      await axios.put(`${API_URL}/api/metodos/${editMetodo.id}`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } else {
      await axios.post(`${API_URL}/api/metodos`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    }
    setShowModal(false);
    setEditMetodo(null);
    setForm({ nombre: '', moneda: '', tasa_base: '', comision_porcentaje: '' });
    fetchMetodos();
  };

  const handleRecalcularTasas = async () => {
    if (!window.confirm('¿Desea recalcular todas las tasas automáticamente usando el porcentaje de cada cruce?')) return;
    await axios.post(`${API_URL}/api/tasas_cambios/recalcular`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    alert('Tasas recalculadas correctamente');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Tasas Base de Métodos</h2>
        <button className="btn btn-success" onClick={() => { setEditMetodo(null); setForm({ nombre: '', moneda: '', tasa_base: '', comision_porcentaje: '' }); setShowModal(true); }}>
          <i className="bi bi-plus-circle"></i> Agregar Método
        </button>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Tasas Base</h2>
        <button className="btn btn-warning" onClick={handleRecalcularTasas}>
          <i className="bi bi-arrow-repeat"></i> Recalcular Tasas
        </button>
      </div>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Moneda</th>
            <th>Tasa Base</th>
            <th>% Comisión</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {metodos.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.nombre}</td>
              <td>{m.moneda}</td>
              <td>{m.tasa_base}</td>
              <td>{m.comision_porcentaje}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(m)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editMetodo ? 'Editar Método' : 'Agregar Método'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Moneda</label>
                    <input className="form-control" name="moneda" value={form.moneda} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Tasa Base</label>
                    <input className="form-control" name="tasa_base" type="number" step="0.0001" value={form.tasa_base} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>% Comisión</label>
                    <input className="form-control" name="comision_porcentaje" type="number" step="0.01" value={form.comision_porcentaje} onChange={handleChange} />
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

export default TasasBase;
