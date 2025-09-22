import React, { useState, useEffect } from 'react';
import './App.css'; // Importar estilos

// Asumimos backend en http://localhost:3000
const API_BASE_URL = 'http://localhost:3000';

// --- Vistas fuera de App ---
function HomeView({ onAdd, onDelete }) {
  return (
    <div className="home">
      <h1>Gestión de Zonas</h1>
      <div className="buttons">
        <button onClick={onAdd} className="btn btn-primary">Agregar Zona</button>
        <button onClick={onDelete} className="btn btn-secondary">Eliminar Zona</button>
      </div>
    </div>
  );
}

function AddView({ formData, onChange, onSubmit, loading, onCancel, error }) {
  return (
    <div className="add">
      <h2>Agregar Nueva Zona</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Nombre:</label>
          <input type="text" name="name" value={formData.name} onChange={onChange} required />
        </div>

        <div className="form-group">
          <label>Radio (en metros):</label>
          <input type="number" name="radius" value={formData.radius} onChange={onChange} required step="0.01" />
        </div>

        <div className="form-group">
          <label>Latitud:</label>
          <input type="number" name="lat" value={formData.lat} onChange={onChange} required step="0.000001" placeholder="Ej: 40.7128" />
        </div>

        <div className="form-group">
          <label>Longitud:</label>
          <input type="number" name="lng" value={formData.lng} onChange={onChange} required step="0.000001" placeholder="Ej: -74.0060" />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Agregando...' : 'Agregar Zona'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function DeleteView({ zones, loading, error, onDeleteZone, onBack }) {
  return (
    <div className="delete">
      <h2>Eliminar Zona</h2>
      {loading && <p>Cargando zonas...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && zones.length === 0 && <p>No hay zonas disponibles.</p>}
      <ul className="zone-list">
        {zones.map((zone) => (
          <li key={zone.idZone} className="zone-item">
            <div>
              <strong>{zone.name}</strong> - Radio: {zone.radius}m
              <br />
              Ubicación: Lat {zone.location?.lat}, Lng {zone.location?.lng}
            </div>
            <button onClick={() => onDeleteZone(zone.idZone)} disabled={loading} className="btn btn-danger">Eliminar</button>
          </li>
        ))}
      </ul>
      <button onClick={onBack} className="btn btn-secondary">Volver</button>
    </div>
  );
}

// --- Componente principal ---
function App() {
  const [view, setView] = useState('home'); // 'home', 'add', 'delete'
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    radius: '',
    lat: '',
    lng: ''
  });

  // Nuevo estado para mensajes
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success | error

  useEffect(() => {
    if (view === 'delete') {
      fetchZones();
    }
  }, [view]);

  const fetchZones = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/zone`);
      if (!response.ok) throw new Error('Error al cargar zonas');
      const data = await response.json();
      setZones(data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = {
        name: formData.name,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng)
        },
        radius: parseFloat(formData.radius)
      };

      const response = await fetch(`${API_BASE_URL}/zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Error al agregar zona');

      await response.json();
      setMessage('✅ Zona agregada exitosamente!');
      setMessageType('success');
      setFormData({ name: '', radius: '', lat: '', lng: '' });
      setView('home');
    } catch (err) {
      setMessage(err.message || String(err));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta zona?')) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/zone/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar zona');
      await response.json();
      setMessage('🗑️ Zona eliminada exitosamente!');
      setMessageType('success');
      fetchZones();
    } catch (err) {
      setMessage(err.message || String(err));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Notificación bonita */}
      {message && (
        <div className={`notification ${messageType}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      {view === 'home' && <HomeView onAdd={() => setView('add')} onDelete={() => setView('delete')} />}
      {view === 'add' && (
        <AddView
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleAddZone}
          loading={loading}
          onCancel={() => setView('home')}
          error={error}
        />
      )}
      {view === 'delete' && (
        <DeleteView
          zones={zones}
          loading={loading}
          error={error}
          onDeleteZone={handleDeleteZone}
          onBack={() => setView('home')}
        />
      )}
    </div>
  );
}

export default App;
