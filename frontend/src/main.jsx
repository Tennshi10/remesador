import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPrincipal from './MenuPrincipal.jsx';
import MenuCliente from './MenuCliente.jsx';
import Remesas from './Remesas.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Transacciones from './Transacciones.jsx';
import Tasas from './Tasas.jsx';
import Clientes from './Clientes.jsx';
import Usuarios from './Usuarios.jsx';
import axios from 'axios'; // <--- Añade axios
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [rol, setRol] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setChecking(false);
        return;
      }
      try {
        await axios.get('http://localhost:4000/api/remesas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
        // Obtener el rol real del usuario autenticado
        // Si ya tienes el rol en localStorage, úsalo
        const storedRol = localStorage.getItem('rol');
        if (storedRol) {
          setRol(storedRol);
        } else {
          // Si no, pide el rol al backend (requiere endpoint /api/mi-rol)
          const rolRes = await axios.get('http://localhost:4000/api/mi-rol', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRol(rolRes.data.rol);
          localStorage.setItem('rol', rolRes.data.rol);
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        setIsAuthenticated(false);
        setRol(null);
      }
      setChecking(false);
    };
    checkToken();
  }, []);

  const handleLogin = async (loginResult) => {
    setIsAuthenticated(true);
    setRol(loginResult.rol);
    localStorage.setItem('rol', loginResult.rol);
  };

  if (checking) {
    return <div className="text-center mt-5">Verificando sesión...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (rol === 'cliente') {
    return <MenuCliente />;
  }

  // Owner y operador ven el dashboard y transacciones
  if (rol === 'owner' || rol === 'operador') {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route index element={
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="mb-0">Panel Principal</h2>
                  <div style={{ fontWeight: 'bold', fontSize: 24 }}>LATAM CAMBIOS</div>
                </div>
                {/* Aquí puedes poner widgets/resúmenes */}
              </div>
            } />
            <Route path="transacciones" element={<Transacciones />} />
            <Route path="remesas" element={<Remesas />} />
            <Route path="tasas" element={<Tasas />} />
            <Route path="clientes" element={<Clientes />} />
            {rol === 'owner' && <Route path="usuarios" element={<Usuarios />} />}
          </Route>
        </Routes>
      </Router>
    );
  }

  // Otros roles (revendedor, etc.)
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPrincipal rol={rol} />} />
        <Route path="/remesas" element={<Remesas />} />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
