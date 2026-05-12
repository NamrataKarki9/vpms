export const API_BASE_URL = 'http://localhost:5169/api';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorBody || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g. 204 No Content or simple 200 without JSON)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
};
