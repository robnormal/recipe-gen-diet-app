import { Dispatch, SetStateAction } from 'react';
import { LoginData, UserRegistrationData } from '../types';

interface AuthViewProps {
  showRegistrationForm: boolean;
  setShowRegistrationForm: Dispatch<SetStateAction<boolean>>;
  loginData: LoginData;
  setLoginData: Dispatch<SetStateAction<LoginData>>;
  isLoggingIn: boolean;
  loginError: string | null;
  onLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  registrationData: UserRegistrationData;
  setRegistrationData: Dispatch<SetStateAction<UserRegistrationData>>;
  isRegistering: boolean;
  registrationError: string | null;
  registrationSuccess: string | null;
  setRegistrationError: Dispatch<SetStateAction<string | null>>;
  setRegistrationSuccess: Dispatch<SetStateAction<string | null>>;
  onRegister: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function AuthView({
  showRegistrationForm,
  setShowRegistrationForm,
  loginData,
  setLoginData,
  isLoggingIn,
  loginError,
  onLogin,
  registrationData,
  setRegistrationData,
  isRegistering,
  registrationError,
  registrationSuccess,
  setRegistrationError,
  setRegistrationSuccess,
  onRegister,
}: AuthViewProps) {
  return (
    <div className="App">
      <h1>Recipe Diet App</h1>

      {!showRegistrationForm ? (
        <div className="login-container">
          <h2>Login</h2>
          <form onSubmit={onLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email:</label>
              <input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                className="form-input"
                placeholder="Enter your password"
              />
            </div>
            {loginError && <p className="error-message">{loginError}</p>}
            <div className="form-actions">
              <button type="submit" disabled={isLoggingIn} className="submit-button">
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
          <div className="auth-switch">
            <p>Don't have an account?</p>
            <button onClick={() => setShowRegistrationForm(true)} className="link-button">
              Create Account
            </button>
          </div>
        </div>
      ) : (
        <div className="registration-container">
          <h2>Create New Account</h2>
          <form onSubmit={onRegister} className="registration-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
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
                onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
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
                onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                required
                minLength={6}
                className="form-input"
                placeholder="Enter your password (min 6 characters)"
              />
            </div>
            {registrationError && <p className="error-message">{registrationError}</p>}
            {registrationSuccess && <p className="success-message">{registrationSuccess}</p>}
            <div className="form-actions">
              <button type="submit" disabled={isRegistering} className="submit-button">
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
            <button onClick={() => setShowRegistrationForm(false)} className="link-button">
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

