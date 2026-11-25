import FormLibros from '../componets/formLibros';

export default function Libros() {
  const handleLibroGuardado = (libro) => {
    console.log('Libro registrado en la página:', libro);
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>Gestión y Registro de Libros</h1>
        <p style={styles.subheading}>
          Agrega nuevos títulos al catálogo de la biblioteca
        </p>
      </header>

      <section style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <FormLibros onLibroGuardado={handleLibroGuardado} />
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    padding: '40px 20px',
    boxSizing: 'border-box',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  heading: {
    margin: 0,
    fontSize: '28px',
    color: '#0f172a',
    fontWeight: '700'
  },
  subheading: {
    marginTop: '6px',
    fontSize: '15px',
    color: '#64748b'
  }
};
