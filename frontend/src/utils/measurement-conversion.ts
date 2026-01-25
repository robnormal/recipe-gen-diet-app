import { FoodPortion, MeasurementType, IngredientFormState } from '../types';

interface ConversionContext {
  measurementType: MeasurementType;
  portionId: number | null;
  ingredientData: IngredientFormState;
  portions: FoodPortion[];
}

export function convertMeasurementType(
  newValue: string,
  context: ConversionContext,
  setIngredientData: (data: IngredientFormState) => void,
  setMeasurementType: (type: MeasurementType) => void,
  setPortionId: (id: number | null) => void
): void {
  const { measurementType, portionId, ingredientData, portions } = context;

  if (newValue === 'grams') {
    // Converting from portion to grams
    if (measurementType === 'portion' && portionId) {
      const previousPortion = portions.find((p) => p.id === portionId);
      if (previousPortion && ingredientData.quantity) {
        const quantity = parseFloat(ingredientData.quantity);
        if (!isNaN(quantity) && quantity > 0) {
          // Calculate gram weight: (quantity / portion.amount) * portion.gram_weight
          const gramWeight = (quantity / previousPortion.amount) * previousPortion.gram_weight;
          setIngredientData({
            ...ingredientData,
            gram_weight: gramWeight.toString(),
            quantity: '',
          });
        } else {
          setIngredientData({ ...ingredientData, quantity: '' });
        }
      } else {
        setIngredientData({ ...ingredientData, quantity: '' });
      }
    } else {
      // No previous value to convert, just clear quantity
      setIngredientData({ ...ingredientData, quantity: '' });
    }
    setMeasurementType('grams');
    setPortionId(null);
  } else if (newValue.startsWith('portion-')) {
    const newPortionId = parseInt(newValue.replace('portion-', ''), 10);
    const newPortion = portions.find((p) => p.id === newPortionId);
    
    if (newPortion) {
      let newQuantity: string;
      
      if (measurementType === 'grams' && ingredientData.gram_weight) {
        // Converting from grams to portion
        const gramWeight = parseFloat(ingredientData.gram_weight);
        if (!isNaN(gramWeight) && gramWeight > 0) {
          // Calculate quantity: (gram_weight / portion.gram_weight) * portion.amount
          const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
          newQuantity = quantity.toString();
        } else {
          newQuantity = newPortion.amount.toString();
        }
      } else if (measurementType === 'portion' && portionId && ingredientData.quantity) {
        // Converting from one portion to another
        const previousPortion = portions.find((p) => p.id === portionId);
        if (previousPortion) {
          const oldQuantity = parseFloat(ingredientData.quantity);
          if (!isNaN(oldQuantity) && oldQuantity > 0) {
            // Convert to grams first, then to new portion
            const gramWeight = (oldQuantity / previousPortion.amount) * previousPortion.gram_weight;
            const quantity = (gramWeight / newPortion.gram_weight) * newPortion.amount;
            newQuantity = quantity.toString();
          } else {
            newQuantity = newPortion.amount.toString();
          }
        } else {
          newQuantity = newPortion.amount.toString();
        }
      } else {
        // No previous value, use base portion amount
        newQuantity = ingredientData.quantity || newPortion.amount.toString();
      }
      
      setIngredientData({
        ...ingredientData,
        quantity: newQuantity,
        gram_weight: '',
      });
      setMeasurementType('portion');
      setPortionId(newPortionId);
    }
  } else {
    setMeasurementType(null);
    setPortionId(null);
  }
}
