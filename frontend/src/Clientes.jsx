import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [paises, setPaises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState(null);
  const [form, setForm] = useState({
    nombre_completo: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    pais_id: ''
  });

  useEffect(() => {
    fetchClientes();
    fetchPaises();
  }, []);

  const fetchClientes = async () => {
    const res = await axios.get(`${API_URL}/api/clientes`);
    setClientes(res.data);
  };

  const fetchPaises = async () => {
    const res = await axios.get(`${API_URL}/api/paises`);
    setPaises(res.data);
  };

  const handleEdit = (cliente) => {
    setEditCliente(cliente);
    setForm({
      nombre_completo: cliente.nombre_completo,
      identificacion: cliente.identificacion,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      pais_id: cliente.pais_id
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este cliente?')) {
      await axios.delete(`${API_URL}/api/clientes/${id}`);
      fetchClientes();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editCliente) {
      await axios.put(`${API_URL}/api/clientes/${editCliente.id}`, form);
    } else {
      await axios.post(`${API_URL}/api/clientes`, form);
    }
    setShowModal(false);
    setEditCliente(null);
    setForm({
      nombre_completo: '',
      identificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      pais_id: ''
    });
    fetchClientes();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Clientes</h2>
        <button className="btn btn-success" onClick={() => { setEditCliente(null); setForm({ nombre_completo: '', identificacion: '', telefono: '', email: '', direccion: '', pais_id: '' }); setShowModal(true); }}>
          <i className="bi bi-plus-circle"></i> Agregar Cliente
        </button>
      </div>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Identificación</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Dirección</th>
            <th>País</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.nombre_completo}</td>
              <td>{c.identificacion}</td>
              <td>{c.telefono}</td>
              <td>{c.email}</td>
              <td>{c.direccion}</td>
              <td>{paises.find(p => p.id === c.pais_id)?.nombre || c.pais_id}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(c)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Eliminar</button>
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
                  <h5 className="modal-title">{editCliente ? 'Editar Cliente' : 'Agregar Cliente'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Nombre Completo</label>
                    <input className="form-control" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Identificación</label>
                    <input className="form-control" name="identificacion" value={form.identificacion} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label>Teléfono</label>
                    <input className="form-control" name="telefono" value={form.telefono} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label>Email</label>
                    <input className="form-control" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label>Dirección</label>
                    <input className="form-control" name="direccion" value={form.direccion} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label>País</label>
                    <select className="form-control" name="pais_id" value={form.pais_id} onChange={handleChange} required>
                      <option value="">Seleccione</option>
                      {paises.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
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

export default Clientes;
