import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [form, setForm] = useState({ usuario: '', clave: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/login', form);
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <h1 className="mb-4 text-primary">Remesador</h1>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Clave</label>
            <input
              type="password"
              name="clave"
              value={form.clave}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="text-end">
            <button type="submit" className="btn btn-primary w-100">Ingresar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
