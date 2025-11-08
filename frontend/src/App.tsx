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

interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
}

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({
    email: '',
    username: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const user = await response.json();
      setRegistrationSuccess(`Account created successfully! Welcome, ${user.username}!`);
      setRegistrationData({ email: '', username: '', password: '' });
      setShowRegistrationForm(false);
    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="App">
      <h1>Recipe Diet App</h1>
      <p className="health-status">{healthStatus || 'Connecting to backend...'}</p>

      <div className="user-section">
        {!showRegistrationForm ? (
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="register-button"
          >
            Create Account
          </button>
        ) : (
          <div className="registration-container">
            <h2>Create New Account</h2>
            <form onSubmit={handleRegistration} className="registration-form">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, email: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  id="username"
                  type="text"
                  value={registrationData.username}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, username: e.target.value })
                  }
                  required
                  minLength={3}
                  className="form-input"
                  placeholder="Enter your username (min 3 characters)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  value={registrationData.password}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Enter your password (min 6 characters)"
                />
              </div>
              {registrationError && (
                <p className="error-message">{registrationError}</p>
              )}
              {registrationSuccess && (
                <p className="success-message">{registrationSuccess}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="submit-button"
                >
                  {isRegistering ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setRegistrationData({ email: '', username: '', password: '' });
                    setRegistrationError(null);
                    setRegistrationSuccess(null);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

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
