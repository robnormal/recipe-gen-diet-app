import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from './useNavigation';

describe('useNavigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('initializes from URL with ?food= param', () => {
    window.history.replaceState({}, '', '/recipes/123?food=456');
    const { result } = renderHook(() => useNavigation());
    expect(result.current.view).toBe('detail');
    expect(result.current.recipeId).toBe(123);
    expect(result.current.modalFoodId).toBe(456);
  });

  it('parses foods list view from /foods', () => {
    window.history.replaceState({}, '', '/foods');
    const { result } = renderHook(() => useNavigation());
    expect(result.current.view).toBe('foods');
  });

  it('opens food modal and updates URL', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.openFoodModal(789);
    });

    expect(result.current.modalFoodId).toBe(789);
    expect(window.location.search).toBe('?food=789');
    expect(window.history.state).toMatchObject({ modalFoodId: 789 });
  });

  it('closes food modal via replaceState fallback when no pushed history entry', () => {
    // Simulate direct load: URL has ?food= but history.state is null
    window.history.replaceState(null, '', '/recipes/1?food=999');
    const { result } = renderHook(() => useNavigation());
    expect(result.current.modalFoodId).toBe(999);

    act(() => {
      result.current.closeFoodModal();
    });

    expect(result.current.modalFoodId).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('navigate clears modalFoodId', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.openFoodModal(789);
    });

    act(() => {
      result.current.navigate('list');
    });

    expect(result.current.modalFoodId).toBeNull();
    expect(result.current.view).toBe('list');
  });

  it('handles popstate with modalFoodId', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('detail', 123);
    });

    act(() => {
      result.current.openFoodModal(456);
    });

    // Simulate browser back by dispatching popstate with previous state
    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { view: 'detail', recipeId: 123, foodId: null, mealPlanId: null, modalFoodId: null },
        })
      );
    });

    expect(result.current.modalFoodId).toBeNull();
    expect(result.current.view).toBe('detail');
    expect(result.current.recipeId).toBe(123);
  });
});
