import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeList } from './recipe-list';

describe('RecipeList', () => {
  it('empty state CTA navigates to create and generate', async () => {
    const onCreateRecipe = vi.fn();
    const onGenerateRecipe = vi.fn();

    render(
      <RecipeList
        recipes={[]}
        isLoadingRecipes={false}
        recipesError={null}
        onRecipeClick={vi.fn()}
        onCreateRecipe={onCreateRecipe}
        onGenerateRecipe={onGenerateRecipe}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create Recipe' }));
    expect(onCreateRecipe).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Generate Recipe' }));
    expect(onGenerateRecipe).toHaveBeenCalled();
  });
});
