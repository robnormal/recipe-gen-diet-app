import { FoodNutrient } from '../types';

const ENERGY_KCAL_NUTRIENT_NUMBER = '208';

export function getTotalKcal(nutrients: FoodNutrient[]): number | null {
  const energy = nutrients.find((nutrient) => nutrient.number === ENERGY_KCAL_NUTRIENT_NUMBER);
  return energy ? energy.amount : null;
}
