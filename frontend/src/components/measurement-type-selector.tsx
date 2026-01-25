import { FoodPortion, MeasurementType, IngredientFormState } from '../types';
import { convertMeasurementType } from '../utils/measurement-conversion';

interface MeasurementTypeSelectorProps {
  measurementType: MeasurementType;
  setMeasurementType: (type: MeasurementType) => void;
  portionId: number | null;
  setPortionId: (id: number | null) => void;
  portions: FoodPortion[];
  isLoadingPortions: boolean;
  ingredientData: IngredientFormState;
  setIngredientData: (data: IngredientFormState) => void;
  isEdit?: boolean;
  id?: string;
}

export function MeasurementTypeSelector({
  measurementType,
  setMeasurementType,
  portionId,
  setPortionId,
  portions,
  isLoadingPortions,
  ingredientData,
  setIngredientData,
  isEdit = false,
  id,
}: MeasurementTypeSelectorProps) {
  const currentValue =
    measurementType === 'grams'
      ? 'grams'
      : portionId
      ? `portion-${portionId}`
      : '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    convertMeasurementType(
      value,
      { measurementType, portionId, ingredientData, portions },
      setIngredientData,
      setMeasurementType,
      setPortionId
    );
  };

  return (
    <select
      id={id}
      value={currentValue}
      onChange={handleChange}
      className={isEdit ? 'form-input inline-select' : 'form-input'}
      required
      disabled={isLoadingPortions}
    >
      <option value="">{isEdit ? 'Select...' : 'Select measurement type...'}</option>
      <option value="grams">{isEdit ? 'g' : 'Grams'}</option>
      {portions.map((portion) => {
        const modifier = portion.modifier ? ` ${portion.modifier}` : '';
        const portionLabel = `${portion.amount}${modifier ? ' ' + modifier : ''} (${Math.round(portion.gram_weight)}g)`;
        return (
          <option key={portion.id} value={`portion-${portion.id}`}>
            {portionLabel}
          </option>
        );
      })}
    </select>
  );
}
