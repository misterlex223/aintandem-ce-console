/**
 * Helper function to detect if running in Electron environment
 */
export function isElectron(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process?.type === 'renderer'
  ) || (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron')
  ) || (
    typeof window !== 'undefined' &&
    (window as any).__IN_AINTANDEM_DESKTOP__ !== undefined
  );
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
