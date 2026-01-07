import { FoodDetail } from '../types';

interface FoodDetailViewProps {
  food: FoodDetail | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export function FoodDetailView({ food, isLoading, error, onBack }: FoodDetailViewProps) {
  if (isLoading) {
    return (
      <div className="recipe-detail-container">
        <p className="loading-message">Loading food details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-detail-container">
        <div className="recipe-detail-header">
          <h2>Food Details</h2>
          <button onClick={onBack} className="back-button">
            Back
          </button>
        </div>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="recipe-detail-container">
        <div className="recipe-detail-header">
          <h2>Food Details</h2>
          <button onClick={onBack} className="back-button">
            Back
          </button>
        </div>
        <p className="no-results">Food not found.</p>
      </div>
    );
  }

  return (
    <div className="recipe-detail-container">
      <div className="recipe-detail-header">
        <h2>{food.description}</h2>
        <button onClick={onBack} className="back-button">
          Back
        </button>
      </div>

      {food.calorie_density !== null && food.calorie_density !== undefined && (
        <div className="recipe-calorie-density">
          <strong>Calorie Density:</strong> {food.calorie_density.toFixed(1)} kcal/g
        </div>
      )}

      <div className="ingredients-section">
        <h3>Nutrition Information (per 100g)</h3>
        {food.nutrients.length === 0 ? (
          <p className="no-results">No nutrition information available.</p>
        ) : (
          <table className="ingredients-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Amount</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {food.nutrients.map((nutrient) => (
                <tr key={nutrient.id}>
                  <td>{nutrient.name}</td>
                  <td>{nutrient.amount.toFixed(2)}</td>
                  <td>{nutrient.unit || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
