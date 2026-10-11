import { useCallback, useMemo, useRef } from 'react';
import { apiRequest } from '../lib/api';
import { ApiCacheContext } from './api-cache-context';

export function ApiCacheProvider({ children }) {
  const cache = useRef(new Map());
  const pending = useRef(new Map());

  const get = useCallback(async (path, { force = false } = {}) => {
    const token = localStorage.getItem('leadflow_token') || 'guest';
    const key = `${token}:${path}`;
    const cached = cache.current.get(key);
    if (!force && cached && Date.now() - cached.savedAt < 30_000) return cached.response;
    if (!force && pending.current.has(key)) return pending.current.get(key);
    const request = apiRequest(path)
      .then((response) => {
        cache.current.set(key, { response, savedAt: Date.now() });
        pending.current.delete(key);
        return response;
      })
      .catch((error) => {
        pending.current.delete(key);
        throw error;
      });
    pending.current.set(key, request);
    return request;
  }, []);

  const invalidate = useCallback((prefix) => {
    for (const key of cache.current.keys()) {
      const path = key.slice(key.indexOf(':') + 1);
      if (path.startsWith(prefix)) cache.current.delete(key);
    }
  }, []);

  const value = useMemo(() => ({ get, invalidate }), [get, invalidate]);
  return <ApiCacheContext.Provider value={value}>{children}</ApiCacheContext.Provider>;
}
