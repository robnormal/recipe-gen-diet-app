import { useEffect, useState, useCallback } from 'react';
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

interface Recipe {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  total_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface RecipesResponse {
  results: Recipe[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
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

  // Recipe creation state
  const [showRecipeForm, setShowRecipeForm] = useState<boolean>(false);
  const [recipeName, setRecipeName] = useState<string>('');
  const [isCreatingRecipe, setIsCreatingRecipe] = useState<boolean>(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeSuccess, setRecipeSuccess] = useState<string | null>(null);

  // Recipes list state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

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

  const fetchRecipes = useCallback(async () => {
    setIsLoadingRecipes(true);
    setRecipesError(null);

    try {
      const response = await fetch('/api/recipes?limit=100&offset=0', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch recipes');
      }

      const data: RecipesResponse = await response.json();
      setRecipes(data.results);
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : 'Failed to load recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setIsLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Only fetch health status and recipes if authenticated
    if (user) {
      fetch('/api/health', {
        credentials: 'include'
      })
        .then((res) => res.json())
        .then((data) => setHealthStatus(data.message))
        .catch((err) => console.error('Failed to fetch health status:', err));

      let cancelled = false;
      setIsLoadingRecipes(true);
      setRecipesError(null);

      fetch('/api/recipes?limit=100&offset=0', {
        credentials: 'include'
      })
        .then(async (response) => {
          if (cancelled) return;
          
          if (!response.ok) {
            if (response.status === 401) {
              setUser(null);
              throw new Error('Session expired. Please login again.');
            }
            throw new Error('Failed to fetch recipes');
          }

          const data: RecipesResponse = await response.json();
          if (!cancelled) {
            setRecipes(data.results);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setRecipesError(err instanceof Error ? err.message : 'Failed to load recipes');
            console.error('Error fetching recipes:', err);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingRecipes(false);
          }
        });

      return () => {
        cancelled = true;
      };
    } else {
      setRecipes([]);
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

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRecipe(true);
    setRecipeError(null);
    setRecipeSuccess(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: recipeName.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }

      const recipeData = await response.json();
      setRecipeSuccess(`Recipe "${recipeData.name}" created successfully!`);
      setRecipeName('');
      setShowRecipeForm(false);
      // Refresh the recipes list
      await fetchRecipes();
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : 'Failed to create recipe. Please try again.');
      console.error('Recipe creation error:', err);
    } finally {
      setIsCreatingRecipe(false);
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

      <div className="recipe-section">
        {!showRecipeForm ? (
          <button
            onClick={() => setShowRecipeForm(true)}
            className="create-recipe-button"
          >
            Create New Recipe
          </button>
        ) : (
          <div className="recipe-form-container">
            <h2>Create New Recipe</h2>
            <form onSubmit={handleCreateRecipe} className="recipe-form">
              <div className="form-group">
                <label htmlFor="recipe-name">Recipe Name:</label>
                <input
                  id="recipe-name"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter recipe name"
                />
              </div>
              {recipeError && (
                <p className="error-message">{recipeError}</p>
              )}
              {recipeSuccess && (
                <p className="success-message">{recipeSuccess}</p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isCreatingRecipe}
                  className="submit-button"
                >
                  {isCreatingRecipe ? 'Creating...' : 'Create Recipe'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipeForm(false);
                    setRecipeName('');
                    setRecipeError(null);
                    setRecipeSuccess(null);
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

      <div className="recipes-section">
        <h2>My Recipes</h2>
        {isLoadingRecipes ? (
          <p className="loading-message">Loading recipes...</p>
        ) : recipesError ? (
          <p className="error-message">{recipesError}</p>
        ) : recipes.length === 0 ? (
          <p className="no-results">No recipes yet. Create your first recipe above!</p>
        ) : (
          <ul className="recipes-list">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="recipe-item">
                <div className="recipe-name">{recipe.name}</div>
                {recipe.description && (
                  <div className="recipe-description">{recipe.description}</div>
                )}
                <div className="recipe-meta">
                  {recipe.servings && (
                    <span className="recipe-servings">{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                  )}
                  {recipe.total_time_minutes && (
                    <span className="recipe-time">{recipe.total_time_minutes} min</span>
                  )}
                  <span className="recipe-date">
                    Created: {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
