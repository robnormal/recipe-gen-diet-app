import { useState, useEffect } from 'react';
import { FoodDetail, FoodPortion, MeasurementType } from '../types';
import { fetchFoodPortions as apiFetchFoodPortions, ApiError } from '../services/api';

interface FoodDetailViewProps {
  food: FoodDetail | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export function FoodDetailView({ food, isLoading, error, onBack }: FoodDetailViewProps) {
  const [amount, setAmount] = useState<number>(100);
  const [gramInputValue, setGramInputValue] = useState<string>('100');
  const [availablePortions, setAvailablePortions] = useState<FoodPortion[]>([]);
  const [isLoadingPortions, setIsLoadingPortions] = useState<boolean>(false);
  const [portionsError, setPortionsError] = useState<string | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType>('grams');
  const [selectedPortionId, setSelectedPortionId] = useState<number | null>(null);
  const [portionQuantity, setPortionQuantity] = useState<string>('1');
  const [portionQuantityInputValue, setPortionQuantityInputValue] = useState<string>('1');

  // Fetch portions when food is loaded
  useEffect(() => {
    if (food?.id) {
      setIsLoadingPortions(true);
      setPortionsError(null);
      apiFetchFoodPortions(food.id)
        .then((portions) => {
          setAvailablePortions(portions);
        })
        .catch((err) => {
          console.error('Error fetching food portions:', err);
          if (err instanceof ApiError && err.status === 401) {
            setPortionsError('Session expired. Please login again.');
          } else {
            setPortionsError('Failed to load portions');
          }
          setAvailablePortions([]);
        })
        .finally(() => {
          setIsLoadingPortions(false);
        });
    } else {
      setAvailablePortions([]);
      setSelectedMeasurementType('grams');
      setSelectedPortionId(null);
      setAmount(100);
      setGramInputValue('100');
      setPortionQuantity('1');
      setPortionQuantityInputValue('1');
    }
  }, [food?.id]);
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
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="food-measurement-type">Measurement Type:</label>
          <select
            id="food-measurement-type"
            value={
              selectedMeasurementType === 'grams'
                ? 'grams'
                : selectedPortionId
                ? `portion-${selectedPortionId}`
                : ''
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'grams') {
                setSelectedMeasurementType('grams');
                setSelectedPortionId(null);
                setAmount(100);
                setGramInputValue('100');
              } else if (value.startsWith('portion-')) {
                const portionId = parseInt(value.replace('portion-', ''), 10);
                setSelectedMeasurementType('portion');
                setSelectedPortionId(portionId);
                const selectedPortion = availablePortions.find((p) => p.id === portionId);
                if (selectedPortion) {
                  const baseQuantity = selectedPortion.amount.toString();
                  setPortionQuantity(baseQuantity);
                  setPortionQuantityInputValue(baseQuantity);
                  // Calculate gram weight for base portion amount
                  const gramWeight = selectedPortion.gram_weight;
                  setAmount(gramWeight);
                }
              } else {
                setSelectedMeasurementType(null);
                setSelectedPortionId(null);
              }
            }}
            className="form-input"
            disabled={isLoadingPortions}
            style={{ maxWidth: '300px', display: 'inline-block', marginLeft: '0.5rem' }}
          >
            <option value="">Select measurement type...</option>
            <option value="grams">Grams</option>
            {availablePortions.map((portion) => {
              const modifier = portion.modifier ? ` ${portion.modifier}` : '';
              const portionLabel = `${portion.amount}${modifier}`;
              return (
                <option key={portion.id} value={`portion-${portion.id}`}>
                  {portionLabel}
                </option>
              );
            })}
          </select>
        </div>

        {selectedMeasurementType === 'grams' && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="food-amount">Amount (grams):</label>
            <input
              id="food-amount"
              type="number"
              step="0.1"
              min="0.1"
              value={gramInputValue}
              onChange={(e) => {
                setGramInputValue(e.target.value);
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setAmount(value);
                } else {
                  setGramInputValue(amount.toString());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="form-input"
              placeholder="100"
              style={{ maxWidth: '200px', display: 'inline-block', marginLeft: '0.5rem' }}
            />
          </div>
        )}

        {selectedMeasurementType === 'portion' && selectedPortionId && (() => {
          const selectedPortion = availablePortions.find((p) => p.id === selectedPortionId);
          return selectedPortion ? (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="food-portion-quantity">Quantity:</label>
              <input
                id="food-portion-quantity"
                type="number"
                step="0.1"
                min="0.1"
                value={portionQuantityInputValue}
                onChange={(e) => {
                  setPortionQuantityInputValue(e.target.value);
                }}
                onBlur={(e) => {
                  const quantity = parseFloat(e.target.value);
                  if (!isNaN(quantity) && quantity > 0 && selectedPortion) {
                    setPortionQuantity(quantity.toString());
                    // Calculate gram weight: (quantity / portion.amount) * portion.gram_weight
                    const gramWeight = (quantity / selectedPortion.amount) * selectedPortion.gram_weight;
                    setAmount(gramWeight);
                  } else {
                    setPortionQuantityInputValue(portionQuantity);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="form-input"
                placeholder={selectedPortion.amount.toString()}
                style={{ maxWidth: '200px', display: 'inline-block', marginLeft: '0.5rem' }}
              />
              <span style={{ marginLeft: '0.5rem' }}>
                {selectedPortion.modifier ? selectedPortion.modifier : ''}
              </span>
            </div>
          ) : null;
        })()}

        {portionsError && <p className="error-message" style={{ marginBottom: '1rem' }}>{portionsError}</p>}

        <h3>
          Nutrition Information (per{' '}
          {selectedMeasurementType === 'grams'
            ? `${amount}g`
            : selectedMeasurementType === 'portion' && selectedPortionId
            ? (() => {
                const selectedPortion = availablePortions.find((p) => p.id === selectedPortionId);
                if (selectedPortion) {
                  const modifier = selectedPortion.modifier ? ` ${selectedPortion.modifier}` : '';
                  return `${portionQuantity}${modifier}`;
                }
                return `${amount}g`;
              })()
            : `${amount}g`}
          )
        </h3>

        {food.nutrients.length === 0 ? (
          <p className="no-results">No nutrition information available.</p>
        ) : (
          <table className="ingredients-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Amount</th>
                <th>% RDA</th>
                <th>Per Calorie</th>
              </tr>
            </thead>
            <tbody>
              {food.nutrients.map((nutrient) => {
                const scaledAmount = (nutrient.amount * amount) / 100;
                const scaledRdaPercent = nutrient.rda_percent !== null
                  ? (nutrient.rda_percent * amount) / 100
                  : null;
                const totalCalories = food.calorie_density !== null && food.calorie_density !== undefined
                  ? food.calorie_density * amount
                  : null;
                const perCalorie = totalCalories !== null && totalCalories > 0
                  ? scaledAmount / totalCalories
                  : null;
                const unit = nutrient.unit || '';
                return (
                  <tr key={nutrient.id}>
                    <td>{nutrient.name}</td>
                    <td>{scaledAmount.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
                    <td>
                      {scaledRdaPercent !== null
                        ? `${scaledRdaPercent.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      {perCalorie !== null
                        ? `${perCalorie.toFixed(4)}${unit ? ` ${unit}` : ''}`
                        : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
