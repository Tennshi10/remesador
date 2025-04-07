import React from 'react';
import './index.css';

function MenuCliente() {
  const mosaicos = [
    { nombre: 'Enviar Remesa', onClick: () => {} },
    { nombre: 'Soporte', onClick: () => {} },
  ];

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4">Menú Cliente</h1>
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
