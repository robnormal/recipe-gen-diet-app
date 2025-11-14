import { useEffect, useState, useCallback } from 'react';

export type View = 'list' | 'detail' | 'create' | 'generate';

interface NavigationState {
  view: View;
  recipeId: number | null;
}

export function useNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Initialize from current URL
    const path = window.location.pathname;
    if (path.startsWith('/recipes/')) {
      const parts = path.split('/');
      const idOrAction = parts[2];
      if (idOrAction === 'new') {
        return { view: 'create', recipeId: null };
      }
      if (idOrAction === 'generate') {
        return { view: 'generate', recipeId: null };
      }
      const recipeId = parseInt(idOrAction, 10);
      if (!isNaN(recipeId)) {
        return { view: 'detail', recipeId };
      }
    }
    return { view: 'list', recipeId: null };
  });

  // Update URL when navigation state changes
  const navigate = useCallback((view: View, recipeId: number | null = null) => {
    // Don't navigate if we're already in the target state
    if (navigationState.view === view && navigationState.recipeId === recipeId) {
      return;
    }

    let path = '/';
    
    switch (view) {
      case 'list':
        path = '/';
        break;
      case 'detail':
        if (recipeId !== null) {
          path = `/recipes/${recipeId}`;
        }
        break;
      case 'create':
        path = '/recipes/new';
        break;
      case 'generate':
        path = '/recipes/generate';
        break;
    }

    window.history.pushState({ view, recipeId }, '', path);
    setNavigationState({ view, recipeId });
  }, [navigationState.view, navigationState.recipeId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { view: View; recipeId: number | null } | null;
      if (state) {
        setNavigationState({ view: state.view, recipeId: state.recipeId });
      } else {
        // If no state, parse from URL
        const path = window.location.pathname;
        if (path.startsWith('/recipes/')) {
          const parts = path.split('/');
          const idOrAction = parts[2];
          if (idOrAction === 'new') {
            setNavigationState({ view: 'create', recipeId: null });
          } else if (idOrAction === 'generate') {
            setNavigationState({ view: 'generate', recipeId: null });
          } else {
            const recipeId = parseInt(idOrAction, 10);
            if (!isNaN(recipeId)) {
              setNavigationState({ view: 'detail', recipeId });
            } else {
              setNavigationState({ view: 'list', recipeId: null });
            }
          }
        } else {
          setNavigationState({ view: 'list', recipeId: null });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return {
    view: navigationState.view,
    recipeId: navigationState.recipeId,
    navigate,
  };
}

