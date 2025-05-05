import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function MenuCliente() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const mosaicos = [
    { nombre: 'Enviar Remesa', onClick: () => {} },
    { nombre: 'Soporte', onClick: () => {} },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = '/';
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-secondary me-2" onClick={() => navigate('/')}>
          <i className="bi bi-arrow-left"></i> Atrás
        </button>
        <h1 className="text-center mb-0 flex-grow-1">Menú Cliente</h1>
        <button className="btn btn-danger" onClick={() => setShowLogoutModal(true)}>
          Cerrar Sesión
        </button>
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
      <div className="d-flex flex-wrap justify-content-center">
        {mosaicos.map((mosaico, index) => (
          <div key={index} className="mosaico habilitado" onClick={mosaico.onClick}>
            {mosaico.nombre}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuCliente;
