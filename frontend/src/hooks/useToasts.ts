import { useToastContext } from '../contexts/toast-context';

export function useToasts() {
  return useToastContext();
}
