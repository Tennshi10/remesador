import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('token');

function Reportes() {
  const [proveedores, setProveedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    proveedor_id: '',
    revendedor_id: '',
    operador_id: '',
    operador_tipo: '',
    cliente_id: '',
    metodo_origen_id: '',
    estado: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [loading, setLoading] = useState(false);
  const tableRef = useRef();

  useEffect(() => {
    fetchProveedores();
    fetchUsuarios();
    fetchMetodos();
    fetchClientes();
  }, []);

  const fetchProveedores = async () => {
    const res = await axios.get(`${API_URL}/api/proveedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProveedores(res.data);
  };

  const fetchUsuarios = async () => {
    const res = await axios.get(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsuarios(res.data);
  };

  const fetchMetodos = async () => {
    const res = await axios.get(`${API_URL}/api/metodos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMetodos(res.data);
  };

  const fetchClientes = async () => {
    const res = await axios.get(`${API_URL}/api/clientes`);
    setClientes(res.data);
  };

  const handleChange = e => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleBuscar = async () => {
    setLoading(true);
    const params = {};
    if (filters.proveedor_id) params.proveedor_id = filters.proveedor_id;
    if (filters.revendedor_id) params.revendedor_id = filters.revendedor_id;
    if (filters.operador_id) {
      if (filters.operador_id === 'cliente') {
        params.operador_tipo = 'cliente';
      } else {
        params.usuario_id = filters.operador_id;
      }
    }
    if (filters.cliente_id) params.cliente_id = filters.cliente_id;
    if (filters.metodo_origen_id) params.metodo_origen_id = filters.metodo_origen_id;
    if (filters.estado) params.estado = filters.estado;
    if (filters.fecha_inicio) params.fechaInicio = filters.fecha_inicio;
    if (filters.fecha_fin) params.fechaFin = filters.fecha_fin;
    const res = await axios.get(`${API_URL}/api/reportes/transacciones`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    setReportData(res.data);
    setLoading(false);
  };

  const handleLimpiar = () => {
    setFilters({
      proveedor_id: '',
      revendedor_id: '',
      operador_id: '',
      operador_tipo: '',
      cliente_id: '',
      metodo_origen_id: '',
      estado: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    setReportData([]);
  };

  // Exportar PDF con formato mejorado, sin nombre de archivo en imágenes y títulos alineados
  const handleExportPDF = async () => {
    const pdf = new jsPDF('l', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Encabezado principal
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text('Reporte de Transacciones', 40, 25);

    let y = 50;

    // Filtros usados
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    let filtros = [];
    if (filters.proveedor_id) filtros.push(`Proveedor: ${proveedores.find(p => String(p.id) === String(filters.proveedor_id))?.nombre || filters.proveedor_id}`);
    if (filters.revendedor_id) filtros.push(`Revendedor: ${usuarios.find(u => String(u.id) === String(filters.revendedor_id))?.usuario || filters.revendedor_id}`);
    if (filters.operador_id) filtros.push(`Operador: ${usuarios.find(u => String(u.id) === String(filters.operador_id))?.usuario || filters.operador_id}`);
    if (filters.cliente_id) filtros.push(`Cliente: ${clientes.find(c => String(c.id) === String(filters.cliente_id))?.nombre_completo || filters.cliente_id}`);
    if (filters.metodo_origen_id) filtros.push(`Método Origen: ${metodos.find(m => String(m.id) === String(filters.metodo_origen_id))?.nombre || filters.metodo_origen_id}`);
    if (filters.estado) filtros.push(`Estado: ${filters.estado}`);
    if (filters.fecha_inicio) filtros.push(`Desde: ${filters.fecha_inicio}`);
    if (filters.fecha_fin) filtros.push(`Hasta: ${filters.fecha_fin}`);
    if (filtros.length > 0) {
      pdf.setFont(undefined, 'italic');
      const filtroTexto = 'Filtros: ' + filtros.join(' | ');
      const filtroLines = pdf.splitTextToSize(filtroTexto, pageWidth - 80);
      pdf.text(filtroLines, 40, y);
      pdf.setFont(undefined, 'normal');
      y += filtroLines.length * 14 + 6;
    }

    // Encabezados de tabla (barra azul más alta y texto centrado verticalmente)
    pdf.setFontSize(12);
    pdf.setTextColor(255,255,255);
    pdf.setFillColor(52, 73, 94);
    const colWidths = [40, 60, 110, 80, 80, 80, 80, 60, 60, 70];
    let x = 30;
    let headerY = y;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    // Barra azul más alta (36px)
    pdf.rect(x, headerY, totalWidth, 38, 'F');
    let headerX = x;
    const headers = [
      'ID', 'Fecha', 'Cliente', 'Proveedor', 'Operador', 'Método Origen', 'Método Destino',
      'Monto Origen', 'Monto Destino', 'Estado'
    ];
    headers.forEach((h, i) => {
      // Centra el texto verticalmente en la barra azul
      pdf.text(h, headerX + colWidths[i]/2, headerY + 15, { align: 'center', maxWidth: colWidths[i] - 8 });
      headerX += colWidths[i];
    });
    y += 38;

    // Filas
    for (const r of reportData) {
      // Fondo alterno
      if ((Math.floor((y-34)/22) % 2) === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(x, y-2, totalWidth, 30, 'F');
      }
      let cellX = x;
      pdf.setFontSize(10);
      pdf.setTextColor(40,40,40);
      const rowVals = [
        String(r.id),
        new Date(r.fecha_hora).toLocaleDateString(),
        String(r.cliente_nombre || ''),
        String(r.proveedor_nombre || r.proveedor_id || ''),
        String(r.operador || ''),
        String(r.metodo_origen_nombre || ''),
        String(r.metodo_destino_nombre || ''),
        String(r.monto_origen),
        String(r.monto_destino),
        String(r.estado)
      ];
      rowVals.forEach((val, i) => {
        pdf.text(val, cellX + colWidths[i]/2, y+12, { align: 'center', maxWidth: colWidths[i] - 8 });
        cellX += colWidths[i];
      });

      y += 22;

      // Línea de comprobantes (más grandes, máximo 1 por fila, 180x180px, sin nombre de archivo)
      if (r.comprobantes && r.comprobantes.length > 0) {
        let imgX = 40;
        let imgCount = 0;
        for (const c of r.comprobantes) {
          if (c.ruta.match(/\.(jpg|jpeg|png|gif)$/i)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const imgData = await toDataURL(API_URL + c.ruta);
              pdf.setDrawColor(200,200,200);
              pdf.rect(imgX-4, y-4, 188, 188); // Borde gris
              pdf.addImage(imgData, 'JPEG', imgX, y, 180, 180);
              imgX += 200;
              imgCount++;
              if (imgX + 180 > pageWidth - 40) {
                imgX = 40;
                y += 210;
              }
            } catch (e) {
              // Si falla, ignora esa imagen
            }
          }
        }
        y += 210;
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(150,150,150);
        pdf.text('Sin comprobantes', 40, y+10);
        y += 20;
      }

      // Línea divisoria entre reportes
      pdf.setDrawColor(180,180,180);
      pdf.line(x, y-5, x + totalWidth, y-5);

      // Salto de página si es necesario
      if (y > pageHeight - 220) {
        pdf.addPage();
        y = 50;
      }
    }
    pdf.save('reporte-transacciones.pdf');
  };

  // Utilidad para convertir imagen a base64
  function toDataURL(url) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  return (
    <div className="container py-4">
      <h2>Reporte de Transacciones</h2>
      <div className="row mb-3">
        <div className="col-md-2">
          <label>Proveedor</label>
          <select className="form-control" name="proveedor_id" value={filters.proveedor_id} onChange={handleChange}>
            <option value="">Todos</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Revendedor</label>
          <select className="form-control" name="revendedor_id" value={filters.revendedor_id} onChange={handleChange}>
            <option value="">Todos</option>
            {usuarios.filter(u => u.rol === 'revendedor').map(u => (
              <option key={u.id} value={u.id}>{u.usuario}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Operador</label>
          <select className="form-control" name="operador_id" value={filters.operador_id} onChange={handleChange}>
            <option value="">Todos</option>
            <option value="cliente">Clientes</option>
            {usuarios.filter(u => u.rol === 'operador' || u.rol === 'owner').map(u => (
              <option key={u.id} value={u.id}>{u.usuario}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Cliente</label>
          <select className="form-control" name="cliente_id" value={filters.cliente_id} onChange={handleChange}>
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_completo}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Método Origen</label>
          <select className="form-control" name="metodo_origen_id" value={filters.metodo_origen_id} onChange={handleChange}>
            <option value="">Todos</option>
            {metodos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label>Estado</label>
          <select className="form-control" name="estado" value={filters.estado} onChange={handleChange}>
            <option value="">Todos</option>
            <option value="Comprobar Pago">Comprobar Pago</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completada">Completada</option>
          </select>
        </div>
        <div className="col-md-2 mt-2">
          <label>Fecha Inicio</label>
          <input type="date" className="form-control" name="fecha_inicio" value={filters.fecha_inicio} onChange={handleChange} />
        </div>
        <div className="col-md-2 mt-2">
          <label>Fecha Fin</label>
          <input type="date" className="form-control" name="fecha_fin" value={filters.fecha_fin} onChange={handleChange} />
        </div>
        <div className="col-md-2 mt-4">
          <button className="btn btn-primary w-100" onClick={handleBuscar} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <div className="col-md-2 mt-4">
          <button className="btn btn-secondary w-100" onClick={handleLimpiar}>
            Limpiar
          </button>
        </div>
        <div className="col-md-2 mt-4">
          <button className="btn btn-success w-100" onClick={handleExportPDF} disabled={reportData.length === 0}>
            Descargar PDF
          </button>
        </div>
      </div>
      <div ref={tableRef}>
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Proveedor</th>
              <th>Operador</th>
              <th>Método Origen</th>
              <th>Método Destino</th>
              <th>Monto Origen</th>
              <th>Monto Destino</th>
              <th>Estado</th>
              <th>Comprobantes</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{new Date(r.fecha_hora).toLocaleDateString()}</td>
                <td>{r.cliente_nombre}</td>
                <td>{r.proveedor_nombre || r.proveedor_id}</td>
                <td>{r.operador}</td>
                <td>{r.metodo_origen_nombre}</td>
                <td>{r.metodo_destino_nombre}</td>
                <td>{r.monto_origen}</td>
                <td>{r.monto_destino}</td>
                <td>{r.estado}</td>
                <td>
                  {r.comprobantes && r.comprobantes.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {r.comprobantes.map(c => {
                        // Corrige la URL para asegurar que siempre tenga el slash inicial
                        const ruta = c.ruta.startsWith('/') ? c.ruta : '/' + c.ruta;
                        const url = `${API_URL}${ruta}`;
                        return (
                          <a
                            key={c.id}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginRight: 4 }}
                            title={c.nombre_archivo}
                          >
                            {c.ruta.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img src={url} alt="comprobante" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                            ) : c.ruta.match(/\.pdf$/i) ? (
                              <span className="badge bg-danger">PDF</span>
                            ) : (
                              <span className="badge bg-secondary">Archivo</span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-muted">Sin comprobantes</span>
                  )}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center text-muted">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reportes;
