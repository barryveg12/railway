const BASE_URL = 'http://localhost:3000/api/reportes';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Si no hay token, continúa sin header
  }
  return headers;
};

/**
 * Solicita a Claude Sonnet 5.5 generar el reporte diario y crear el PDF en Anthropic
 * @param {string} fecha - Formato YYYY-MM-DD (opcional)
 */
export const generarReporteDiario = async (fecha) => {
  const res = await fetch(`${BASE_URL}/diario`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fecha })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || data.error || 'Error al generar reporte diario');
  return data;
};

/**
 * Obtiene el estado del Cron Job y el historial de reportes generados automáticamente
 */
export const obtenerEstadoCronReportes = async () => {
  const res = await fetch(`${BASE_URL}/cron/estado`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al consultar cron');
  return data.data;
};

/**
 * Fuerza una ejecución inmediata del cron job en segundo plano
 */
export const forzarEjecucionCron = async () => {
  const res = await fetch(`${BASE_URL}/cron/disparar`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al disparar cron');
  return data;
};

/**
 * Descarga el archivo PDF directamente usando el fileId retornado por Claude
 * @param {string} fileId - ID del archivo en Anthropic Files API
 * @param {string} nombreArchivo - Nombre opcional para guardar el archivo
 */
export const descargarReportePDF = (fileId, nombreArchivo) => {
  const token = localStorage.getItem('auth_token');
  const url = `${BASE_URL}/descargar/${fileId}${nombreArchivo ? `?nombre=${encodeURIComponent(nombreArchivo)}` : ''}`;
  
  // Realizar fetch con el Bearer token y descargar el blob
  fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
    .then(res => {
      if (!res.ok) throw new Error('Error al descargar el archivo PDF');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = nombreArchivo || 'reporte_diario.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Error al descargar PDF:', err);
      alert('Error al descargar el PDF: ' + err.message);
    });
};
