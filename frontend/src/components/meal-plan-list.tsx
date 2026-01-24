import { useState } from 'react';
import { MealPlan } from '../types';

interface MealPlanListProps {
  mealPlans: MealPlan[];
  isLoadingMealPlans: boolean;
  mealPlansError: string | null;
  onMealPlanClick: (mealPlan: MealPlan) => void;
  onCreateMealPlan?: (name: string, description: string) => Promise<void>;
  isCreatingMealPlan?: boolean;
  createError?: string | null;
}

export function MealPlanList({ 
  mealPlans, 
  isLoadingMealPlans, 
  mealPlansError, 
  onMealPlanClick,
  onCreateMealPlan,
  isCreatingMealPlan = false,
  createError = null,
}: MealPlanListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateMealPlan && name.trim()) {
      await onCreateMealPlan(name.trim(), description.trim());
      setName('');
      setDescription('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="meal-plans-section">
      <h2>My Meal Plans</h2>
      
      {onCreateMealPlan && (
        <div className="create-meal-plan-section">
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} className="create-button">
              Create New Meal Plan
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="create-meal-plan-form">
              <div className="form-group">
                <label htmlFor="new-meal-plan-name">Name:</label>
                <input
                  id="new-meal-plan-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                  disabled={isCreatingMealPlan}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-meal-plan-description">Description:</label>
                <textarea
                  id="new-meal-plan-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={2}
                  disabled={isCreatingMealPlan}
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={isCreatingMealPlan || !name.trim()} className="submit-button">
                  {isCreatingMealPlan ? 'Creating...' : 'Create Meal Plan'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setName('');
                    setDescription('');
                  }}
                  disabled={isCreatingMealPlan}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
              {createError && <p className="error-message">{createError}</p>}
            </form>
          )}
        </div>
      )}
      {isLoadingMealPlans ? (
        <p className="loading-message">Loading meal plans...</p>
      ) : mealPlansError ? (
        <p className="error-message">{mealPlansError}</p>
      ) : mealPlans.length === 0 ? (
        <p className="no-results">No meal plans yet. Create your first meal plan!</p>
      ) : (
        <ul className="meal-plans-list">
          {mealPlans.map((mealPlan) => (
            <li key={mealPlan.id} className="meal-plan-item">
              <button onClick={() => onMealPlanClick(mealPlan)} className="meal-plan-name-link" type="button">
                {mealPlan.name}
              </button>
              {mealPlan.description && <div className="meal-plan-description">{mealPlan.description}</div>}
              <div className="meal-plan-meta">
                <span className="meal-plan-date">Created: {new Date(mealPlan.created_at).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
