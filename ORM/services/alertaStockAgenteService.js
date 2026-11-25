const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
const { Libro, Ejemplar, Asociado } = require('../models');

// Inicializar cliente Anthropic si la key está disponible
function obtenerClienteAnthropic() {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    try {
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });
    } catch (e) {
      console.warn('[AGENTE STOCK] No se pudo inicializar Anthropic SDK:', e.message);
    }
  }
  return null;
}

// Configurar transportador de correo real (Gmail / SMTP)
function crearTransportador() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = (process.env.MAIL_USERNAME || process.env.SMTP_USER || '').replace(/^"|"$/g, '');
  const pass = (process.env.MAIL_PASSWORD || process.env.SMTP_PASS || '').replace(/^"|"$/g, '');

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para 465, false para 587/STARTTLS
      auth: {
        user,
        pass
      }
    });
  }

  // Simulador de envío en consola cuando no hay credenciales SMTP en producción
  return {
    sendMail: async (mailOptions) => {
      console.log('\n============================================================');
      console.log('📧 [SIMULADOR: CORREO ELECTRÓNICO]');
      console.log(`Para: ${mailOptions.to}`);
      console.log(`Asunto: ${mailOptions.subject}`);
      console.log('============================================================\n');
      return { messageId: 'simulated_' + Date.now(), accepted: [mailOptions.to] };
    }
  };
}

/**
 * Plantilla de respaldo elegante y formal si la API de Anthropic no está disponible temporalmente
 */
function generarPlantillaRespaldo(totalLibros, totalEjemplaresDisponibles) {
  return {
    asunto: '🚨 URGENTE: Biblioteca Central sin ejemplares disponibles - Convocatoria de Reabastecimiento',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #991b1b; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">Alerta Crítica: Biblioteca sin Libros Disponibles</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Notificación Oficial para Empresas y Aliados Asociados</p>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p>Estimado(a) Aliado(a) / Empresa Asociada,</p>
          <p>
            Nos dirigimos a usted con carácter de urgencia para informarle que el sistema inteligente de inventario de la <strong>Biblioteca Central</strong> ha detectado que actualmente el catálogo se encuentra en <strong>desabastecimiento total</strong>:
          </p>
          <ul style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 20px; list-style-type: square; margin: 16px 0;">
            <li><strong>Títulos activos en catálogo:</strong> ${totalLibros}</li>
            <li><strong>Ejemplares físicos disponibles para préstamo:</strong> ${totalEjemplaresDisponibles}</li>
          </ul>
          <p>
            Ante esta contingencia que impacta directamente a nuestros lectores y a la comunidad académica, convocamos formalmente su valioso respaldo a través de programas de donación, adquisición de lotes bibliográficos o convenios editoriales.
          </p>
          <p>Agradecemos de antemano su constante compromiso con la cultura y la educación.</p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
            <strong>Administración Central de la Biblioteca</strong><br/>
            Sistema de Monitoreo Automatizado de Stock con IA
          </div>
        </div>
      </div>
    `
  };
}

/**
 * Verifica si la biblioteca se quedó sin libros (0 títulos o 0 ejemplares disponibles)
 * e invoca a Claude para redactar y enviar un correo urgente a los asociados.
 */
async function verificarStockYNotificarAsociados() {
  try {
    // 1. Contar libros totales en el catálogo
    const totalLibros = await Libro.count();

    // 2. Contar ejemplares físicos disponibles para préstamo
    const totalEjemplaresDisponibles = await Ejemplar.count({
      where: { estado: 'disponible' }
    });

    console.log(`[AGENTE STOCK] Verificando inventario: ${totalLibros} obras registradas, ${totalEjemplaresDisponibles} ejemplares disponibles.`);

    // Condición de alerta: 0 libros en el sistema o 0 ejemplares disponibles
    const sinStock = totalLibros === 0 || totalEjemplaresDisponibles === 0;

    if (!sinStock) {
      return {
        alertaActiva: false,
        mensaje: `Hay inventario disponible (${totalLibros} títulos, ${totalEjemplaresDisponibles} ejemplares disponibles). No se requiere alerta.`,
        totalLibros,
        totalEjemplaresDisponibles
      };
    }

    // 3. Obtener lista de asociados activos
    const asociados = await Asociado.findAll({
      where: { activo: true }
    });

    if (asociados.length === 0) {
      console.warn('[AGENTE STOCK] Alerta de stock agotado activa, pero no hay asociados registrados en la base de datos.');
      return {
        alertaActiva: true,
        sinAsociados: true,
        mensaje: 'La biblioteca se quedó sin libros, pero no hay asociados registrados para notificar. Registre asociados en el panel.',
        totalLibros,
        totalEjemplaresDisponibles
      };
    }

    const correosDestinatarios = asociados.map(a => a.correo);
    const nombresAsociados = asociados.map(a => `${a.nombre} (${a.correo})`).join(', ');

    console.log(`[AGENTE STOCK] ⚠️ ALERTA: La biblioteca se quedó sin libros. Convocando al agente para redactar correo a ${correosDestinatarios.length} asociado(s)...`);

    let emailContenido = null;
    const anthropic = obtenerClienteAnthropic();

    if (anthropic) {
      try {
        const prompt = `
Eres el "Agente de Gestión de Inventario Crítico de la Biblioteca".
Acabamos de detectar que la biblioteca se encuentra en situación de **DESABASTECIMIENTO CRÍTICO**:
- Total de libros en catálogo: ${totalLibros}
- Ejemplares físicos disponibles: ${totalEjemplaresDisponibles}

La alerta debe enviarse a nuestros aliados y empresas asociadas:
Lista de asociados: ${nombresAsociados}

Por favor genera:
1. Un ASUNTO impactante, formal y urgente.
2. Un cuerpo de correo en formato HTML limpio, elegante y profesional.
Debe explicar la situación, solicitar apoyo o donación/adquisición de nuevo lote de libros y agradecer el compromiso de los aliados con la cultura y la lectura.

Responde únicamente con un JSON con esta estructura exacta:
{
  "asunto": "...",
  "html": "..."
}
`;
        const respuestaClaude = await anthropic.messages.create({
          model: 'claude-sonnet-5-5',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        });

        const texto = respuestaClaude.content[0].text;
        const match = texto.match(/\{[\s\S]*\}/);
        if (match) {
          emailContenido = JSON.parse(match[0]);
        }
      } catch (errClaude) {
        console.warn('[AGENTE STOCK] Falló llamada a Claude Sonnet (' + errClaude.message + '). Usando redacción formal institucional de respaldo...');
      }
    }

    if (!emailContenido) {
      emailContenido = generarPlantillaRespaldo(totalLibros, totalEjemplaresDisponibles);
    }

    // 4. Enviar correo a todos los asociados
    const fromName = (process.env.MAIL_FROM_NAME || 'Biblioteca Central').replace(/^"|"$/g, '');
    const fromAddress = (process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'notificaciones@biblioteca.com').replace(/^"|"$/g, '');
    const fromHeader = `"${fromName}" <${fromAddress}>`;

    const transporter = crearTransportador();
    const infoEnvio = await transporter.sendMail({
      from: fromHeader,
      to: correosDestinatarios.join(', '),
      subject: emailContenido.asunto,
      html: emailContenido.html
    });

    console.log(`[AGENTE STOCK] Correo de alerta enviado exitosamente a: ${correosDestinatarios.join(', ')}`);

    return {
      alertaActiva: true,
      notificacionEnviada: true,
      destinatarios: correosDestinatarios,
      asunto: emailContenido.asunto,
      cuerpoHtml: emailContenido.html,
      messageId: infoEnvio.messageId,
      totalLibros,
      totalEjemplaresDisponibles
    };
  } catch (error) {
    console.error('[AGENTE STOCK] Error al verificar stock y notificar:', error);
    throw error;
  }
}

module.exports = {
  verificarStockYNotificarAsociados
};
