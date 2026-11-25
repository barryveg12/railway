import { API_BASE_URL } from '../config/api';

const API_CHAT_URL = `${API_BASE_URL}/chat`;

/**
 * Envía un mensaje al agente de Claude a través de la API
 * @param {string} mensaje - Mensaje escrito por el usuario
 * @param {Array} historial - Historial de conversación [{ role: 'user'|'assistant', content: string }]
 */
export const enviarMensajeChat = async (mensaje, historial = []) => {
  try {
    const response = await fetch(API_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mensaje, historial })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error en la comunicación con el chat');
    }

    return data;
  } catch (error) {
    console.error('Error al enviar mensaje a chatService:', error);
    throw error;
  }
};

export default {
  enviarMensajeChat
};

