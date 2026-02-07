/**
 * API Client
 * Centralized API calls with authentication
 */

const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key-change-me';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiRequest(url: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if API key is configured
  if (API_KEY && API_KEY !== 'dev-api-key-change-me') {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * API client with authentication
 */
export const api = {
  get: (url: string) => apiRequest(url),
  post: (url: string, data: unknown) => apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (url: string, data: unknown) => apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (url: string) => apiRequest(url, {
    method: 'DELETE',
  }),
};

/**
 * Helper function to handle API responses
 */
export async function fetchJson<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await apiRequest(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
