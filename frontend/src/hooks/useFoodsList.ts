import { useFoodSearch } from './useFoodSearch';

export function useFoodsList(user: { id: number } | null) {
  return useFoodSearch(user);
}
