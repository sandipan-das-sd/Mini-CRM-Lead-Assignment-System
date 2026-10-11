import { useContext } from 'react';
import { ApiCacheContext } from '../context/api-cache-context';

export function useApiCache() {
  const context = useContext(ApiCacheContext);
  if (!context) throw new Error('useApiCache must be used inside ApiCacheProvider');
  return context;
}
