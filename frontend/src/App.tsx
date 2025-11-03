import { useEffect, useState } from 'react';
import './App.css';

interface FoodResult {
  description: string;
  calorie_density: number;
  rank: number;
}

interface SearchResponse {
  results: FoodResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.message))
      .catch((err) => console.error('Failed to fetch health status:', err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20&offset=0`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setTotalResults(data.pagination.total);
    } catch (err) {
      setError('Failed to search foods. Please try again.');
      console.error('Search error:', err);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Recipe Diet App</h1>
      <p className="health-status">{healthStatus || 'Connecting to backend...'}</p>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for foods..."
            className="search-input"
          />
          <button type="submit" disabled={isLoading} className="search-button">
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <p className="error-message">{error}</p>}

      {totalResults > 0 && (
        <p className="results-count">
          Found {totalResults} result{totalResults !== 1 ? 's' : ''}
        </p>
      )}

      <div className="results-container">
        {searchResults.length > 0 ? (
          <ul className="food-results">
            {searchResults.map((food, index) => (
              <li key={index} className="food-item">
                <div className="food-description">{food.description}</div>
                <div className="food-details">
                  <span className="calorie-density">
                    {food.calorie_density?.toFixed(1) || 'N/A'} kcal/g
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : searchQuery && !isLoading && !error ? (
          <p className="no-results">No results found. Try a different search term.</p>
        ) : null}
      </div>
    </div>
  );
}

export default App;
