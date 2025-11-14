import { useState, useEffect } from 'react';
import { User, LoginData, UserRegistrationData } from '../types';
import { checkAuthStatus as apiCheckAuthStatus } from '../services/api';

export function useAuth() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

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
      const userData = await apiCheckAuthStatus();
      setUser(userData);
    } catch (err) {
      console.error('Error checking auth status:', err);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  return {
    user,
    setUser,
    isCheckingAuth,
    loginState: {
      loginData,
      setLoginData,
      isLoggingIn,
      loginError,
      setLoginError,
    },
    registrationState: {
      showRegistrationForm,
      setShowRegistrationForm,
      registrationData,
      setRegistrationData,
      isRegistering,
      registrationError,
      registrationSuccess,
      setRegistrationError,
      setRegistrationSuccess,
    },
    login: handleLogin,
    logout: handleLogout,
    register: handleRegistration,
    checkAuth: checkAuthStatus,
  };
}

