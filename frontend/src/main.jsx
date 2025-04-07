import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPrincipal from './MenuPrincipal.jsx';
import MenuCliente from './MenuCliente.jsx';
import Remesas from './Remesas.jsx';
import Login from './Login.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [rol, setRol] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Simular obtener el rol del usuario desde el backend
      const fakeRol = 'owner'; // Cambiar según el rol deseado para pruebas
      setRol(fakeRol);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (rol === 'cliente') {
    return <MenuCliente />;
  }

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
