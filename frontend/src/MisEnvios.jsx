import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- Agrega este import

const API_URL = import.meta.env.VITE_API_URL;

function MisEnvios() {
  const [remesas, setRemesas] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRemesa, setSelectedRemesa] = useState(null);
  const [showComprobante, setShowComprobante] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate(); // <-- Usa useNavigate correctamente

  useEffect(() => {
    fetchMisRemesas();
  }, []);

  const fetchMisRemesas = async () => {
    const clienteId = localStorage.getItem('user_id');
    const res = await axios.get(`${API_URL}/api/remesas`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    // Solo remesas de este cliente
    setRemesas(res.data.filter(r => r.cliente_id === parseInt(clienteId)));
  };

  const handleVer = async (remesa) => {
    setSelectedRemesa(remesa);
    const res = await axios.get(`${API_URL}/api/comprobantes/${remesa.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setComprobantes(res.data);
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = '/';
  };

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-secondary me-2" onClick={() => navigate('/')}>
          <i className="bi bi-arrow-left"></i> Atrás
        </button>
        <h2 className="mb-0 flex-grow-1 text-center">Mis Envíos</h2>
        <button className="btn btn-danger" onClick={() => setShowLogoutModal(true)}>
          Cerrar Sesión
        </button>
      </div>
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
      <div className="card p-4 mb-4 shadow-sm">
        <table className="table table-bordered table-striped mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Monto Enviado</th>
              <th>Monto Recibido</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {remesas.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{new Date(r.fecha_hora).toLocaleDateString()}</td>
                <td>{r.monto_origen}</td>
                <td>{r.monto_destino}</td>
                <td>
                  <span className={`badge bg-${
                    r.estado === 'Comprobar Pago' ? 'info' :
                    r.estado === 'Pendiente' ? 'warning' :
                    r.estado === 'Completada' ? 'success' : 'secondary'
                  }`}>
                    {r.estado}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-info" onClick={() => handleVer(r)}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal para ver detalles y comprobantes */}
      {showModal && selectedRemesa && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalle de Remesa #{selectedRemesa.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><b>Monto Origen:</b> {selectedRemesa.monto_origen}</p>
                <p><b>Monto Destino:</b> {selectedRemesa.monto_destino}</p>
                <p><b>Estado:</b> {selectedRemesa.estado}</p>
                <p><b>Nombre Destinatario:</b> {selectedRemesa.nombre_destinatario}</p>
                <p><b>Cédula Destinatario:</b> {selectedRemesa.cedula_destinatario}</p>
                <p><b>Cuenta Banco Destinatario:</b> {selectedRemesa.cuenta_banco_destinatario}</p>
                <hr />
                <h6>Comprobantes de Pago Operador</h6>
                <ul>
                  {comprobantes.filter(c => c.tipo_pago === 'operador').length === 0 && <li>No hay comprobantes</li>}
                  {comprobantes.filter(c => c.tipo_pago === 'operador').map(c => (
                    <li key={c.id}>
                      <button
                        className="btn btn-link p-0"
                        onClick={() => setShowComprobante(c)}
                        style={{ textDecoration: 'underline', color: '#007bff' }}
                      >
                        {c.nombre_archivo}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para mostrar comprobante (imagen/pdf) */}
      {showComprobante && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{showComprobante.nombre_archivo}</h5>
                <button type="button" className="btn-close" onClick={() => setShowComprobante(null)}></button>
              </div>
              <div className="modal-body text-center">
                {showComprobante.ruta.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={API_URL + showComprobante.ruta} alt="comprobante" style={{ maxWidth: '100%' }} />
                ) : showComprobante.ruta.match(/\.pdf$/i) ? (
                  <iframe src={API_URL + showComprobante.ruta} title="comprobante" style={{ width: '100%', height: '70vh' }}></iframe>
                ) : (
                  <a href={API_URL + showComprobante.ruta} target="_blank" rel="noopener noreferrer">Descargar</a>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowComprobante(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisEnvios;
