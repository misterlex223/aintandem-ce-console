/**
 * Centralized authenticated fetch utility
 * Provides a single source of truth for authenticated API calls
 */

// Helper function to handle unauthorized responses
export function handleUnauthorized() {
  // Clear auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');

  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Create a fetch-like wrapper for the Electron API proxy
 */
export const electronApiProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Parse the URL to extract path and query
  const parsedUrl = new URL(url, window.location.origin);
  const path = parsedUrl.pathname + parsedUrl.search;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  const proxyResponse = await (window as any).kai.apiProxy.request({
    method: options.method || 'GET',
    path: path,
    headers: headers,
    body: options.body
  });

  // console.log('proxyResponse', proxyResponse);
  // Create a response-like object to make it more compatible with fetch API
  const response = new Response(
    proxyResponse.data || undefined,
    {
      status: proxyResponse.statusCode || 200,
      headers: proxyResponse.headers || {}
    }
  );

  return response;
};

/**
 * Helper function to make authenticated API calls
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const fetchMethod = window.__IN_AINTANDEM_DESKTOP__ ? electronApiProxy : fetch;
  // Add authentication token if available
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetchMethod(url, {
    ...options,
    headers
  });

  // Check if the response is unauthorized (401) or forbidden (403)
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
  }

  return response;
}