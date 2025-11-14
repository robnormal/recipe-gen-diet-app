import { User } from '../types';

interface AppHeaderProps {
  user: User;
  onLogout: () => void;
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <div className="app-header">
      <h1>Recipe Diet App</h1>
      <div className="user-info">
        <span>Welcome, {user.username}!</span>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

