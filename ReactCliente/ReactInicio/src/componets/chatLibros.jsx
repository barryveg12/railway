import { useState, useRef, useEffect } from 'react';
import { enviarMensajeChat } from '../services/chatService';

export default function ChatLibros() {
  const [mensajes, setMensajes] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy tu agente inteligente de biblioteca conectado con Claude. Puedo consultar la base de datos de libros, buscar títulos o darte estadísticas. ¿En qué te puedo ayudar hoy?'
    }
  ]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, cargando]);

  const handleEnviar = async (textoAEnviar) => {
    const texto = (typeof textoAEnviar === 'string' ? textoAEnviar : inputMensaje).trim();
    if (!texto || cargando) return;

    setError(null);

    const nuevoMensajeUsuario = { role: 'user', content: texto };
    const historialParaEnviar = [...mensajes, nuevoMensajeUsuario];

    // Actualizamos UI inmediatamente con el mensaje del usuario
    setMensajes(historialParaEnviar);
    setInputMensaje('');
    setCargando(true);

    try {
      const data = await enviarMensajeChat(texto, mensajes);

      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.respuesta || 'No se recibió respuesta del agente.',
          requiereApiKey: data.requiereApiKey
        }
      ]);
    } catch (err) {
      setError(err.message || 'Error al comunicarse con el agente');
      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ No se pudo conectar con el servidor del chat. Verifica que el backend esté encendido en http://localhost:3000.'
        }
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const preguntasSugeridas = [
    '¿Qué libros hay registrados?',
    '¿Existe "Los tres mosqueteros"?',
    '¿Cuál es el total de páginas de la biblioteca?'
  ];

  return (
    <div style={styles.chatCard}>
      {/* Encabezado */}
      <div style={styles.header}>
        <div style={styles.headerTitleContainer}>
          <span style={styles.aiBadge}>IA</span>
          <div>
            <h3 style={styles.headerTitle}>Agente de Libros (Claude)</h3>
            <span style={styles.headerSubtitle}>Conectado a la base de datos MySQL</span>
          </div>
        </div>
      </div>

      {/* Sugerencias Rápidas */}
      <div style={styles.suggestionsContainer}>
        {preguntasSugeridas.map((sugerencia, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleEnviar(sugerencia)}
            disabled={cargando}
            style={styles.suggestionButton}
          >
            {sugerencia}
          </button>
        ))}
      </div>

      {/* Área de Mensajes */}
      <div style={styles.messagesContainer}>
        {mensajes.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                ...styles.messageRow,
                justifyContent: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(isUser ? styles.userBubble : styles.assistantBubble)
                }}
              >
                {!isUser && <div style={styles.agentTag}>Claude Agente</div>}
                <div style={styles.messageText}>{msg.content}</div>
              </div>
            </div>
          );
        })}

        {cargando && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, ...styles.assistantBubble, fontStyle: 'italic', color: '#6b7280' }}>
              🔍 Claude está consultando la base de datos...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {/* Formulario de Input */}
      <div style={styles.inputArea}>
        <textarea
          value={inputMensaje}
          onChange={(e) => setInputMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Haz una pregunta sobre los libros registrados..."
          rows="2"
          disabled={cargando}
          style={styles.textarea}
        />
        <button
          type="button"
          onClick={() => handleEnviar()}
          disabled={cargando || !inputMensaje.trim()}
          style={{
            ...styles.sendButton,
            opacity: cargando || !inputMensaje.trim() ? 0.6 : 1
          }}
        >
          {cargando ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatCard: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    height: '620px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#312e81',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  aiBadge: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase'
  },
  headerTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600'
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#c7d2fe'
  },
  suggestionsContainer: {
    display: 'flex',
    gap: '8px',
    padding: '10px 15px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    overflowX: 'auto',
    whiteSpace: 'nowrap'
  },
  suggestionButton: {
    fontSize: '12px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    borderRadius: '16px',
    padding: '5px 12px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s'
  },
  messagesContainer: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f9fafb'
  },
  messageRow: {
    display: 'flex',
    width: '100%'
  },
  bubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.45',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderBottomRightRadius: '2px'
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    borderBottomLeftRadius: '2px'
  },
  agentTag: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: '4px'
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  inputArea: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  textarea: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  sendButton: {
    padding: '10px 18px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    height: '42px',
    transition: 'background-color 0.2s'
  },
  errorAlert: {
    margin: '0 16px 8px 16px',
    padding: '8px 12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '12px',
    textAlign: 'center'
  }
};

