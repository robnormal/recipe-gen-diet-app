import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.message))
      .catch((err) => console.error('Failed to fetch health status:', err));
  }, []);

  return (
    <div className="App">
      <h1>Recipe Diet App</h1>
      <p>{healthStatus || 'Connecting to backend...'}</p>
    </div>
  );
}

export default App;
