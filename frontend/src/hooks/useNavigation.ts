import { useEffect, useState, useCallback } from 'react';

export type View = 'list' | 'detail' | 'create' | 'generate' | 'food' | 'mealPlans' | 'mealPlanDetail';

interface NavigationState {
  view: View;
  recipeId: number | null;
  foodId: number | null;
  mealPlanId: number | null;
}

export function useNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Initialize from current URL
    const path = window.location.pathname;
    if (path.startsWith('/recipes/')) {
      const parts = path.split('/');
      const idOrAction = parts[2];
      if (idOrAction === 'new') {
        return { view: 'create', recipeId: null, foodId: null, mealPlanId: null };
      }
      if (idOrAction === 'generate') {
        return { view: 'generate', recipeId: null, foodId: null, mealPlanId: null };
      }
      const recipeId = parseInt(idOrAction, 10);
      if (!isNaN(recipeId)) {
        return { view: 'detail', recipeId, foodId: null, mealPlanId: null };
      }
    }
    if (path.startsWith('/foods/')) {
      const parts = path.split('/');
      const foodId = parseInt(parts[2], 10);
      if (!isNaN(foodId)) {
        return { view: 'food', recipeId: null, foodId, mealPlanId: null };
      }
    }
    if (path.startsWith('/meal-plans/')) {
      const parts = path.split('/');
      const mealPlanId = parseInt(parts[2], 10);
      if (!isNaN(mealPlanId)) {
        return { view: 'mealPlanDetail', recipeId: null, foodId: null, mealPlanId };
      }
    }
    if (path === '/meal-plans') {
      return { view: 'mealPlans', recipeId: null, foodId: null, mealPlanId: null };
    }
    return { view: 'list', recipeId: null, foodId: null, mealPlanId: null };
  });

  // Update URL when navigation state changes
  const navigate = useCallback((view: View, id: number | null = null) => {
    // Determine if this is a recipe, food, or meal plan ID based on view
    const recipeId = view === 'detail' ? id : null;
    const foodId = view === 'food' ? id : null;
    const mealPlanId = view === 'mealPlanDetail' ? id : null;
    
    // Don't navigate if we're already in the target state
    if (navigationState.view === view && 
        ((view === 'detail' && navigationState.recipeId === recipeId) ||
         (view === 'food' && navigationState.foodId === foodId) ||
         (view === 'mealPlanDetail' && navigationState.mealPlanId === mealPlanId) ||
         (view === 'list' || view === 'create' || view === 'generate' || view === 'mealPlans'))) {
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
      case 'food':
        if (foodId !== null) {
          path = `/foods/${foodId}`;
        }
        break;
      case 'mealPlans':
        path = '/meal-plans';
        break;
      case 'mealPlanDetail':
        if (mealPlanId !== null) {
          path = `/meal-plans/${mealPlanId}`;
        }
        break;
    }

    window.history.pushState({ view, recipeId, foodId, mealPlanId }, '', path);
    setNavigationState({ view, recipeId, foodId, mealPlanId });
  }, [navigationState.view, navigationState.recipeId, navigationState.foodId, navigationState.mealPlanId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { view: View; recipeId: number | null; foodId: number | null; mealPlanId: number | null } | null;
      if (state) {
        setNavigationState({ view: state.view, recipeId: state.recipeId ?? null, foodId: state.foodId ?? null, mealPlanId: state.mealPlanId ?? null });
      } else {
        // If no state, parse from URL
        const path = window.location.pathname;
        if (path.startsWith('/recipes/')) {
          const parts = path.split('/');
          const idOrAction = parts[2];
          if (idOrAction === 'new') {
            setNavigationState({ view: 'create', recipeId: null, foodId: null, mealPlanId: null });
          } else if (idOrAction === 'generate') {
            setNavigationState({ view: 'generate', recipeId: null, foodId: null, mealPlanId: null });
          } else {
            const recipeId = parseInt(idOrAction, 10);
            if (!isNaN(recipeId)) {
              setNavigationState({ view: 'detail', recipeId, foodId: null, mealPlanId: null });
            } else {
              setNavigationState({ view: 'list', recipeId: null, foodId: null, mealPlanId: null });
            }
          }
        } else if (path.startsWith('/foods/')) {
          const parts = path.split('/');
          const foodId = parseInt(parts[2], 10);
          if (!isNaN(foodId)) {
            setNavigationState({ view: 'food', recipeId: null, foodId, mealPlanId: null });
          } else {
            setNavigationState({ view: 'list', recipeId: null, foodId: null, mealPlanId: null });
          }
        } else if (path.startsWith('/meal-plans/')) {
          const parts = path.split('/');
          const mealPlanId = parseInt(parts[2], 10);
          if (!isNaN(mealPlanId)) {
            setNavigationState({ view: 'mealPlanDetail', recipeId: null, foodId: null, mealPlanId });
          } else {
            setNavigationState({ view: 'mealPlans', recipeId: null, foodId: null, mealPlanId: null });
          }
        } else if (path === '/meal-plans') {
          setNavigationState({ view: 'mealPlans', recipeId: null, foodId: null, mealPlanId: null });
        } else {
          setNavigationState({ view: 'list', recipeId: null, foodId: null, mealPlanId: null });
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
    foodId: navigationState.foodId,
    mealPlanId: navigationState.mealPlanId,
    navigate,
  };
}

