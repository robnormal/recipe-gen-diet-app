import { Dispatch, SetStateAction } from 'react';

type View = 'list' | 'detail' | 'create' | 'generate';

interface RecipeCreationFormsProps {
  navigate?: (view: View, recipeId?: number | null) => void;
  showRecipeForm: boolean;
  setShowRecipeForm: Dispatch<SetStateAction<boolean>>;
  showGenerateForm: boolean;
  setShowGenerateForm: Dispatch<SetStateAction<boolean>>;
  recipeName: string;
  setRecipeName: Dispatch<SetStateAction<string>>;
  isCreatingRecipe: boolean;
  recipeError: string | null;
  recipeSuccess: string | null;
  setRecipeError: Dispatch<SetStateAction<string | null>>;
  setRecipeSuccess: Dispatch<SetStateAction<string | null>>;
  onCreateRecipe: (e: React.FormEvent<HTMLFormElement>) => void;
  generateRecipeName: string;
  setGenerateRecipeName: Dispatch<SetStateAction<string>>;
  generatePrompt: string;
  setGeneratePrompt: Dispatch<SetStateAction<string>>;
  isGeneratingRecipe: boolean;
  generateError: string | null;
  setGenerateError: Dispatch<SetStateAction<string | null>>;
  onGenerateRecipe: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function RecipeCreationForms({
  navigate,
  showRecipeForm,
  setShowRecipeForm,
  showGenerateForm,
  setShowGenerateForm,
  recipeName,
  setRecipeName,
  isCreatingRecipe,
  recipeError,
  recipeSuccess,
  setRecipeError,
  setRecipeSuccess,
  onCreateRecipe,
  generateRecipeName,
  setGenerateRecipeName,
  generatePrompt,
  setGeneratePrompt,
  isGeneratingRecipe,
  generateError,
  setGenerateError,
  onGenerateRecipe,
}: RecipeCreationFormsProps) {
  return (
    <div className="recipe-section">
      {!showRecipeForm && !showGenerateForm ? (
        <div className="recipe-actions">
          <button onClick={() => setShowRecipeForm(true)} className="create-recipe-button">
            Create New Recipe
          </button>
          <button onClick={() => setShowGenerateForm(true)} className="create-recipe-button">
            Generate Recipe with AI
          </button>
        </div>
      ) : showRecipeForm ? (
        <div className="recipe-form-container">
          <h2>Create New Recipe</h2>
          <form onSubmit={onCreateRecipe} className="recipe-form">
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
            {recipeError && <p className="error-message">{recipeError}</p>}
            {recipeSuccess && <p className="success-message">{recipeSuccess}</p>}
            <div className="form-actions">
              <button type="submit" disabled={isCreatingRecipe} className="submit-button">
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
      ) : (
        <div className="recipe-form-container">
          <h2>Generate Recipe with AI</h2>
          <form onSubmit={onGenerateRecipe} className="recipe-form">
            <div className="form-group">
              <label htmlFor="generate-recipe-name">Recipe Name:</label>
              <input
                id="generate-recipe-name"
                type="text"
                value={generateRecipeName}
                onChange={(e) => setGenerateRecipeName(e.target.value)}
                required
                className="form-input"
                placeholder="Enter recipe name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="generate-prompt">Recipe Prompt:</label>
              <textarea
                id="generate-prompt"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                required
                className="form-input"
                placeholder="Describe the recipe you want to generate (e.g., 'A healthy vegetarian pasta dish with tomatoes and basil')"
                rows={4}
              />
            </div>
            {generateError && <p className="error-message">{generateError}</p>}
            <div className="form-actions">
              <button type="submit" disabled={isGeneratingRecipe} className="submit-button">
                {isGeneratingRecipe ? 'Generating...' : 'Generate Recipe'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGenerateForm(false);
                  setGenerateRecipeName('');
                  setGeneratePrompt('');
                  setGenerateError(null);
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
  );
}

