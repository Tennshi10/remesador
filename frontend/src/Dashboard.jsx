import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation, Link } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSoporteModal, setShowSoporteModal] = useState(false);

  // Obtener rol desde localStorage
  const rol = localStorage.getItem('rol');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = '/';
  };

  // Mostrar dashboard principal solo en "/"
  const isMainPanel = location.pathname === '/';

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Sidebar */}
      <div
        style={{
          width: collapsed ? 60 : 220,
          background: '#263043',
          color: '#fff',
          minHeight: '100vh',
          padding: 0,
          transition: 'width 0.2s'
        }}
        className="d-flex flex-column justify-content-between"
      >
        <div>
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            {!collapsed && (
              <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                Administrador
              </span>
            )}
            <button
              className="btn btn-link text-white p-0 ms-auto"
              style={{ fontSize: 22 }}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <i className={`bi ${collapsed ? 'bi-list' : 'bi-chevron-left'}`}></i>
            </button>
          </div>
          <ul className="nav flex-column mt-3">
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname === '/' ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/"
                title="Panel Principal"
              >
                <i className="bi bi-house-door me-2"></i>
                {!collapsed && 'Panel Principal'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/transacciones') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/transacciones"
                title="Transacciones"
              >
                <i className="bi bi-arrow-left-right me-2"></i>
                {!collapsed && 'Transacciones'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/tasas') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/tasas"
                title="Tasas y Comisiones"
              >
                <i className="bi bi-currency-exchange me-2"></i>
                {!collapsed && 'Tasas y Comisiones'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/tasas-base') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/tasas-base"
                title="Tasas Base"
              >
                <i className="bi bi-percent me-2"></i>
                {!collapsed && 'Tasas Base'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/clientes') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/clientes"
                title="Clientes"
              >
                <i className="bi bi-person-lines-fill me-2"></i>
                {!collapsed && 'Clientes'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/proveedores') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/proveedores"
                title="Proveedores"
              >
                <i className="bi bi-people me-2"></i>
                {!collapsed && 'Proveedores'}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link text-start${location.pathname.startsWith('/reportes') ? ' active' : ''}`}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                to="/reportes"
                title="Reportes"
              >
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                {!collapsed && 'Reportes'}
              </Link>
            </li>
            {rol === 'owner' && (
              <li className="nav-item">
                <Link
                  className={`nav-link text-start${location.pathname.startsWith('/usuarios') ? ' active' : ''}`}
                  style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                  to="/usuarios"
                  title="Usuarios"
                >
                  <i className="bi bi-people-fill me-2"></i>
                  {!collapsed && 'Usuarios'}
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className="mb-3 text-center">
          <button
            className="btn btn-danger"
            style={{ width: collapsed ? 40 : 180 }}
            onClick={() => setShowLogoutModal(true)}
            title="Cerrar Sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            {!collapsed && <span className="ms-2">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-grow-1 p-4">
        {isMainPanel && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Panel Principal</h2>
              <div style={{ fontWeight: 'bold', fontSize: 24 }}>LATAM CAMBIOS</div>
            </div>
            {/* Tiles para clientes */}
            {rol === 'cliente' && (
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div
                    className="card p-4 text-center shadow-sm h-100"
                    style={{ cursor: 'pointer', background: '#e3f2fd' }}
                    onClick={() => navigate('/remesas')}
                  >
                    <i className="bi bi-send-fill" style={{ fontSize: 36, color: '#1976d2' }}></i>
                    <div className="mt-2" style={{ fontWeight: 'bold' }}>Enviar Remesa</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div
                    className="card p-4 text-center shadow-sm h-100"
                    style={{ cursor: 'pointer', background: '#e8f5e9' }}
                    onClick={() => navigate('/mis-envios')}
                  >
                    <i className="bi bi-clock-history" style={{ fontSize: 36, color: '#388e3c' }}></i>
                    <div className="mt-2" style={{ fontWeight: 'bold' }}>Estatus envíos</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div
                    className="card p-4 text-center shadow-sm h-100"
                    style={{ cursor: 'pointer', background: '#fff3e0' }}
                    onClick={() => setShowSoporteModal(true)}
                  >
                    <i className="bi bi-headset" style={{ fontSize: 36, color: '#ff9800' }}></i>
                    <div className="mt-2" style={{ fontWeight: 'bold' }}>Soporte</div>
                  </div>
                </div>
              </div>
            )}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div>Transacciones Totales</div>
                  <div style={{ fontSize: 32, fontWeight: 'bold' }}>0</div>
                  <div className="text-danger">↓ 100% desde la semana pasada</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div>Volumen Total (USD)</div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#007bff' }}>$0.00</div>
                  <div className="text-danger">↓ 100% desde la semana pasada</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div>Comisiones Generadas</div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#28a745' }}>$0.00</div>
                  <div className="text-danger">↓ 100% desde la semana pasada</div>
                </div>
              </div>
            </div>
            <div className="card p-3 mt-4">
              <h5>Transacciones Recientes</h5>
              <div className="text-muted">Ver todas las transacciones</div>
            </div>
          </>
        )}
        {!isMainPanel && <Outlet />}
      </div>
      {/* Modal de confirmación para cerrar sesión */}
      {showLogoutModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLogoutModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Soporte */}
      {showSoporteModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Soporte</h5>
                <button type="button" className="btn-close" onClick={() => setShowSoporteModal(false)}></button>
              </div>
              <div className="modal-body text-center">
                <p>¿Necesitas ayuda? Contáctanos por WhatsApp o llamada:</p>
                <a href="https://wa.me/584121771977" target="_blank" rel="noopener noreferrer" className="btn btn-success mb-2">
                  <i className="bi bi-whatsapp"></i> +58 412-1771977
                </a>
                <div>
                  <span className="d-block">Teléfono: <b>+58 412-1771977</b></span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSoporteModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
