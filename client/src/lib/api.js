const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('leadflow_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || 'Something went wrong');
    error.code = body.error?.code;
    error.details = body.error?.details;
    error.status = response.status;
    throw error;
  }
  return body;
}
