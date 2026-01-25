import { FoodNutrient } from '../types';

interface RecipeNutrientsTableProps {
  nutrients: FoodNutrient[];
}

export function RecipeNutrientsTable({ nutrients }: RecipeNutrientsTableProps) {
  if (!nutrients || nutrients.length === 0) {
    return null;
  }

  return (
    <div className="recipe-nutrients-section">
      <h3>Nutrient Totals</h3>
      <table className="nutrients-table">
        <thead>
          <tr>
            <th>Nutrient</th>
            <th>Total Amount</th>
            <th>% RDA</th>
          </tr>
        </thead>
        <tbody>
          {nutrients.map((nutrient) => {
            const unit = nutrient.unit || '';
            return (
              <tr key={nutrient.id}>
                <td>{nutrient.name}</td>
                <td>
                  {nutrient.amount.toFixed(2)}
                  {unit ? ` ${unit}` : ''}
                </td>
                <td>
                  {nutrient.rda_percent !== null
                    ? `${nutrient.rda_percent.toFixed(1)}%`
                    : 'N/A'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
