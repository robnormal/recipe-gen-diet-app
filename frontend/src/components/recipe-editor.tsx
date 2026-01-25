import { RecipeFormData } from '../types';

interface RecipeEditorProps {
  formData: RecipeFormData;
  setFormData: (data: RecipeFormData) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isUpdating: boolean;
  error: string | null;
  success: string | null;
}

export function RecipeEditor({
  formData,
  setFormData,
  onSubmit,
  isUpdating,
  error,
  success,
}: RecipeEditorProps) {
  return (
    <div className="recipe-detail-form">
      <form onSubmit={onSubmit} className="recipe-form">
        <div className="form-group">
          <label htmlFor="detail-recipe-name">Recipe Name:</label>
          <input
            id="detail-recipe-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Enter recipe name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="detail-recipe-description">Description:</label>
          <textarea
            id="detail-recipe-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            placeholder="Enter recipe description (optional)"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="detail-recipe-instructions">Instructions:</label>
          <textarea
            id="detail-recipe-instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="form-input"
            placeholder="Enter recipe instructions (optional)"
            rows={6}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="detail-recipe-servings">Servings:</label>
            <input
              id="detail-recipe-servings"
              type="number"
              min="1"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
              className="form-input"
              placeholder="Number of servings"
            />
          </div>

          <div className="form-group">
            <label htmlFor="detail-recipe-time">Total Time (minutes):</label>
            <input
              id="detail-recipe-time"
              type="number"
              min="1"
              value={formData.total_time_minutes}
              onChange={(e) => setFormData({ ...formData, total_time_minutes: e.target.value })}
              className="form-input"
              placeholder="Total time in minutes"
            />
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-actions">
          <button type="submit" disabled={isUpdating} className="submit-button">
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
