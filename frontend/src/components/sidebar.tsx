import { useState } from 'react';
import { View } from '../hooks/useNavigation';
import { User } from '../types';
import { AppHeader } from './app-header';

interface SidebarProps {
  view: View;
  user: User;
  onLogout: () => void;
  onNavigate: (view: View) => void;
}

const navItems: Array<{ view: View; label: string; match: View[] }> = [
  { view: 'list', label: 'Recipes', match: ['list', 'detail', 'create', 'generate'] },
  { view: 'mealPlans', label: 'Meal Plans', match: ['mealPlans', 'mealPlanDetail'] },
  { view: 'foods', label: 'Foods', match: ['foods', 'food'] },
];

export function Sidebar({ view, user, onLogout, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav className={`sidebar${mobileOpen ? ' open' : ''}`} aria-label="Primary">
        <div className="sidebar-brand">
          <h1>Recipe Diet App</h1>
        </div>
        <ul className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = item.match.includes(view);
            return (
              <li key={item.view} className="sidebar-item">
                <button
                  type="button"
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    onNavigate(item.view);
                    setMobileOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="sidebar-footer">
          <AppHeader user={user} onLogout={onLogout} />
        </div>
      </nav>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
