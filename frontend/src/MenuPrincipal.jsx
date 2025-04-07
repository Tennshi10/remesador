import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function MenuPrincipal({ rol }) {
  const navigate = useNavigate();

  const mosaicos = [
    { nombre: 'Remesas', habilitado: ['owner', 'operador', 'revendedor'].includes(rol), onClick: () => navigate('/remesas') },
    { nombre: 'Catálogos', habilitado: ['owner', 'operador', 'revendedor'].includes(rol), onClick: () => {} },
    { nombre: 'Reportes', habilitado: ['owner', 'operador', 'revendedor'].includes(rol), onClick: () => {} },
  ];

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4">Menú Principal</h1>
      <div className="d-flex flex-wrap justify-content-center">
        {mosaicos.map((mosaico, index) => (
          <div
            key={index}
            className={`mosaico ${mosaico.habilitado ? 'habilitado' : 'deshabilitado'}`}
            onClick={mosaico.habilitado ? mosaico.onClick : null}
          >
            {mosaico.nombre}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuPrincipal;
