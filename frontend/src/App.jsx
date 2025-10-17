function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🍔 Sistema de Comida Online</h1>
      <p>Frontend funcionando correctamente</p>
      <button 
        onClick={() => alert('¡Funciona!')}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Probar Botón
      </button>
    </div>
  );
}

export default App;