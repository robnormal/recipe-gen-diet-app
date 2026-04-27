import { useEffect, useState, useCallback } from 'react';

export type View = 'list' | 'detail' | 'create' | 'generate' | 'food' | 'mealPlans' | 'mealPlanDetail' | 'foods';

interface NavigationState {
  view: View;
  recipeId: number | null;
  foodId: number | null;
  mealPlanId: number | null;
  modalFoodId: number | null;
}

function parsePath(path: string): Omit<NavigationState, 'modalFoodId'> {
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
  if (path === '/foods') {
    return { view: 'foods', recipeId: null, foodId: null, mealPlanId: null };
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
}

function getPathFromState(state: Omit<NavigationState, 'modalFoodId'>): string {
  const { view, recipeId, foodId, mealPlanId } = state;
  switch (view) {
    case 'list':
      return '/';
    case 'detail':
      return recipeId !== null ? `/recipes/${recipeId}` : '/';
    case 'create':
      return '/recipes/new';
    case 'generate':
      return '/recipes/generate';
    case 'food':
      return foodId !== null ? `/foods/${foodId}` : '/';
    case 'mealPlans':
      return '/meal-plans';
    case 'mealPlanDetail':
      return mealPlanId !== null ? `/meal-plans/${mealPlanId}` : '/meal-plans';
    case 'foods':
      return '/foods';
    default:
      return '/';
  }
}

export function useNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    const url = new URL(window.location.href);
    const base = parsePath(url.pathname);
    const foodParam = url.searchParams.get('food');
    const modalFoodId = foodParam ? parseInt(foodParam, 10) : null;
    return {
      ...base,
      modalFoodId: modalFoodId && !isNaN(modalFoodId) ? modalFoodId : null,
    };
  });

  const navigate = useCallback((view: View, id: number | null = null) => {
    const recipeId = view === 'detail' ? id : null;
    const foodId = view === 'food' ? id : null;
    const mealPlanId = view === 'mealPlanDetail' ? id : null;

    setNavigationState((prev) => {
      // Don't navigate if we're already in the target state (and no modal is open)
      if (prev.view === view &&
          prev.modalFoodId === null &&
          ((view === 'detail' && prev.recipeId === recipeId) ||
           (view === 'food' && prev.foodId === foodId) ||
           (view === 'mealPlanDetail' && prev.mealPlanId === mealPlanId) ||
           (view === 'list' || view === 'create' || view === 'generate' || view === 'mealPlans' || view === 'foods'))) {
        return prev;
      }

      const nextState: NavigationState = { view, recipeId, foodId, mealPlanId, modalFoodId: null };
      const path = getPathFromState(nextState);
      window.history.pushState(nextState, '', path);
      return nextState;
    });
  }, []);

  const openFoodModal = useCallback((foodId: number) => {
    setNavigationState((prev) => {
      if (prev.modalFoodId === foodId) {
        return prev;
      }
      const nextState: NavigationState = { ...prev, modalFoodId: foodId };
      const path = getPathFromState(prev) + `?food=${foodId}`;
      window.history.pushState(nextState, '', path);
      return nextState;
    });
  }, []);

  const closeFoodModal = useCallback(() => {
    setNavigationState((prev) => {
      if (prev.modalFoodId === null) {
        return prev;
      }
      const currentState = window.history.state as NavigationState | null;
      if (currentState && currentState.modalFoodId != null) {
        window.history.back();
        return prev;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('food');
      const nextState: NavigationState = { ...prev, modalFoodId: null };
      window.history.replaceState(nextState, '', url.pathname + url.search);
      return nextState;
    });
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavigationState | null;
      if (state) {
        setNavigationState({
          view: state.view,
          recipeId: state.recipeId ?? null,
          foodId: state.foodId ?? null,
          mealPlanId: state.mealPlanId ?? null,
          modalFoodId: state.modalFoodId ?? null,
        });
      } else {
        const url = new URL(window.location.href);
        const base = parsePath(url.pathname);
        const foodParam = url.searchParams.get('food');
        const modalFoodId = foodParam ? parseInt(foodParam, 10) : null;
        setNavigationState({
          ...base,
          modalFoodId: modalFoodId && !isNaN(modalFoodId) ? modalFoodId : null,
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    view: navigationState.view,
    recipeId: navigationState.recipeId,
    foodId: navigationState.foodId,
    mealPlanId: navigationState.mealPlanId,
    modalFoodId: navigationState.modalFoodId,
    navigate,
    openFoodModal,
    closeFoodModal,
  };
}
