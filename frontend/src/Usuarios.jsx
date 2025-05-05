import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUsuario, setEditUsuario] = useState(null);
  const [form, setForm] = useState({
    usuario: '',
    clave: '',
    clave2: '',
    rol: 'operador',
    activo: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const res = await axios.get('/api/usuarios');
    setUsuarios(res.data);
  };

  const handleEdit = (usuario) => {
    setEditUsuario(usuario);
    setForm({
      usuario: usuario.usuario,
      clave: '',
      clave2: '',
      rol: usuario.rol,
      activo: usuario.activo
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este usuario?')) {
      await axios.delete(`/api/usuarios/${id}`);
      fetchUsuarios();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.clave !== form.clave2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (editUsuario) {
      await axios.put(`/api/usuarios/${editUsuario.id}`, {
        usuario: form.usuario,
        clave: form.clave,
        rol: form.rol,
        activo: form.activo
      });
    } else {
      await axios.post('/api/usuarios', {
        usuario: form.usuario,
        clave: form.clave,
        rol: form.rol,
        activo: form.activo
      });
    }
    setShowModal(false);
    setEditUsuario(null);
    setForm({ usuario: '', clave: '', clave2: '', rol: 'operador', activo: true });
    setError('');
    fetchUsuarios();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Usuarios</h2>
        <button className="btn btn-success" onClick={() => { setEditUsuario(null); setForm({ usuario: '', clave: '', clave2: '', rol: 'operador', activo: true }); setShowModal(true); setError(''); }}>
          <i className="bi bi-plus-circle"></i> Agregar Usuario
        </button>
      </div>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.usuario}</td>
              <td>{u.rol}</td>
              <td>{u.activo ? 'Sí' : 'No'}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(u)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Eliminar</button>
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
                  <h5 className="modal-title">{editUsuario ? 'Editar Usuario' : 'Agregar Usuario'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-2">
                    <label>Usuario</label>
                    <input className="form-control" name="usuario" value={form.usuario} onChange={handleChange} required />
                  </div>
                  <div className="mb-2">
                    <label>Contraseña</label>
                    <input className="form-control" name="clave" type="password" value={form.clave} onChange={handleChange} required={!editUsuario} />
                  </div>
                  <div className="mb-2">
                    <label>Confirmar Contraseña</label>
                    <input className="form-control" name="clave2" type="password" value={form.clave2} onChange={handleChange} required={!editUsuario} />
                  </div>
                  <div className="mb-2">
                    <label>Rol</label>
                    <select className="form-control" name="rol" value={form.rol} onChange={handleChange} required>
                      <option value="owner">Owner</option>
                      <option value="operador">Operador</option>
                      <option value="revendedor">Revendedor</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </div>
                  <div className="mb-2 form-check">
                    <input className="form-check-input" type="checkbox" name="activo" checked={form.activo} onChange={handleChange} id="activoCheck" />
                    <label className="form-check-label" htmlFor="activoCheck">Activo</label>
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

export default Usuarios;
