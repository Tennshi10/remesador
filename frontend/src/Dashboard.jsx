import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
              <button
                className="nav-link text-start"
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                onClick={() => navigate('/')}
                title="Panel Principal"
              >
                <i className="bi bi-house-door me-2"></i>
                {!collapsed && 'Panel Principal'}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link text-start"
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                onClick={() => navigate('/transacciones')}
                title="Transacciones"
              >
                <i className="bi bi-arrow-left-right me-2"></i>
                {!collapsed && 'Transacciones'}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link text-start"
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                onClick={() => navigate('/tasas')}
                title="Tasas y Comisiones"
              >
                <i className="bi bi-currency-exchange me-2"></i>
                {!collapsed && 'Tasas y Comisiones'}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link text-start"
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                onClick={() => navigate('/clientes')}
                title="Clientes"
              >
                <i className="bi bi-person-lines-fill me-2"></i>
                {!collapsed && 'Clientes'}
              </button>
            </li>
            {rol === 'owner' && (
              <li className="nav-item">
                <button
                  className="nav-link text-start"
                  style={{ color: '#fff', background: 'none', border: 'none', fontSize: 16 }}
                  onClick={() => navigate('/usuarios')}
                  title="Usuarios"
                >
                  <i className="bi bi-people-fill me-2"></i>
                  {!collapsed && 'Usuarios'}
                </button>
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
    </div>
  );
}

export default Dashboard;
