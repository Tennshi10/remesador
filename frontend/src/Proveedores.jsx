import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProveedor, setEditProveedor] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    metodo_id: '',
    telefono: '',
    correo: ''
  });

  useEffect(() => {
    fetchProveedores();
    fetchMetodos();
  }, []);

  const fetchProveedores = async () => {
    const res = await axios.get(`${API_URL}/api/proveedores`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setProveedores(res.data);
  };

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setMetodos(res.data);
  };

  const handleEdit = (proveedor) => {
    setEditProveedor(proveedor);
    setForm({
      nombre: proveedor.nombre,
      metodo_id: proveedor.metodo_id,
      telefono: proveedor.telefono,
      correo: proveedor.correo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este proveedor?')) {
      await axios.delete(`${API_URL}/api/proveedores/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProveedores();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editProveedor) {
      await axios.put(`${API_URL}/api/proveedores/${editProveedor.id}`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } else {
      await axios.post(`${API_URL}/api/proveedores`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    }
    setShowModal(false);
    setEditProveedor(null);
    setForm({ nombre: '', metodo_id: '', telefono: '', correo: '' });
    fetchProveedores();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Proveedores</h2>
        <button className="btn btn-success" onClick={() => { setEditProveedor(null); setForm({ nombre: '', metodo_id: '', telefono: '', correo: '' }); setShowModal(true); }}>
          <i className="bi bi-plus-circle"></i> Agregar Proveedor
        </button>
      </div>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Método</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.metodo_nombre}</td>
              <td>{p.telefono}</td>
              <td>{p.correo}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(p)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
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
                  <h5 className="modal-title">{editProveedor ? 'Editar Proveedor' : 'Agregar Proveedor'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Método</label>
                    <select className="form-control" name="metodo_id" value={form.metodo_id} onChange={handleChange} required>
                      <option value="">Seleccione</option>
                      {metodos.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label>Teléfono</label>
                    <input className="form-control" name="telefono" value={form.telefono} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label>Correo</label>
                    <input className="form-control" name="correo" value={form.correo} onChange={handleChange} />
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

export default Proveedores;
