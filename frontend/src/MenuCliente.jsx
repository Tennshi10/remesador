import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function MenuCliente() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSoporteModal, setShowSoporteModal] = useState(false);

  const mosaicos = [
    { nombre: 'Enviar Remesa', onClick: () => navigate('/remesas') },
    { nombre: 'Estatus envíos', onClick: () => navigate('/mis-envios') },
    { nombre: 'Soporte', onClick: () => setShowSoporteModal(true) },
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

export default MenuCliente;
