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

interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface LoginData {
  email: string;
  password: string;
}

function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Main app state
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Registration state
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({
    email: '',
    username: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Login state
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check authentication status on mount
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        console.error('Failed to check auth status');
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    // Only fetch health status if authenticated
    if (user) {
      fetch('/api/health', {
        credentials: 'include'
      })
        .then((res) => res.json())
        .then((data) => setHealthStatus(data.message))
        .catch((err) => console.error('Failed to fetch health status:', err));
    }
  }, [user]);

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
        `/api/foods/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20&offset=0`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to login');
      }

      const userData: User = await response.json();
      setUser(userData);
      setLoginData({ email: '', password: '' });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        setSearchResults([]);
        setTotalResults(0);
        setSearchQuery('');
      } else {
        console.error('Failed to logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
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
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const userData = await response.json();
      setRegistrationSuccess(`Account created successfully! Welcome, ${userData.username}!`);
      setRegistrationData({ email: '', username: '', password: '' });
      setShowRegistrationForm(false);
    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="App">
        <h1>Recipe Diet App</h1>
        <p className="health-status">Checking authentication...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="App">
        <h1>Recipe Diet App</h1>

        {!showRegistrationForm ? (
          <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Email:</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password:</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>
              {loginError && (
                <p className="error-message">{loginError}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="submit-button"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
            <div className="auth-switch">
              <p>Don't have an account?</p>
              <button
                onClick={() => setShowRegistrationForm(true)}
                className="link-button"
              >
                Create Account
              </button>
            </div>
          </div>
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
            <div className="auth-switch">
              <p>Already have an account?</p>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="link-button"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show main app content if authenticated
  return (
    <div className="App">
      <div className="app-header">
        <h1>Recipe Diet App</h1>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
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
