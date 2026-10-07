import { getAuthToken, getRefreshToken, setAuthTokens, clearAuth, isTokenExpiringSoon, redirectToLogin } from './auth';
import { parseApiErrorBody, toUserFriendlyError } from './errorMessages';

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL?.startsWith('/')
    ? import.meta.env.VITE_API_BASE_URL
    : undefined) ||
  (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://csi-project-be.vercel.app/api';

const DEFAULT_BASE_URL = API_BASE_URL;

interface HttpOptions extends RequestInit {
  token?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  asBlob?: boolean;
  skipAuthRefresh?: boolean; // Skip auto-refresh (used for refresh endpoint itself)
  timeout?: number; // Request timeout in milliseconds (default: 30000)
}

const buildQueryString = (query?: HttpOptions['query']) => {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
};

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('[HTTP] Refreshing access token...');
  
  // Create AbortController for refresh token request with shorter timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 second timeout for token refresh
  
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HTTP] Token refresh failed:', errorText);
      clearAuth();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    console.log('[HTTP] Token refresh successful');
    
    // Store new tokens
    setAuthTokens(data.access_token, data.refresh_token || refreshToken);
    
    return data.access_token;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[HTTP] Token refresh timeout');
      clearAuth();
      throw new Error('Token refresh timeout');
    }
    throw error;
  }
};

// Cache token validation result to avoid repeated checks
let tokenCache: { token: string | null; timestamp: number } | null = null;
const TOKEN_CACHE_TTL = 5000; // Cache for 5 seconds

/**
 * Get a valid access token, refreshing if necessary
 */
const getValidToken = async (providedToken?: string): Promise<string | null> => {
  // If a token was explicitly provided, use it
  if (providedToken) return providedToken;
  
  const currentToken = getAuthToken();
  if (!currentToken) return null;
  
  // Check cache first (avoid repeated token parsing)
  const now = Date.now();
  if (tokenCache && tokenCache.token === currentToken && (now - tokenCache.timestamp) < TOKEN_CACHE_TTL) {
    return currentToken; // Token is still valid, no need to check expiration
  }
  
  // Check if token is expiring soon (within 60 seconds)
  if (isTokenExpiringSoon(currentToken, 60)) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn('[HTTP] Token expiring soon but no refresh token available');
      return currentToken; // Return current token, let the request fail
    }
    
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }
    
    isRefreshing = true;
    refreshPromise = refreshAccessToken()
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    
    try {
      const newToken = await refreshPromise;
      // Update cache with new token
      tokenCache = { token: newToken, timestamp: now };
      return newToken;
    } catch {
      // If refresh fails, return current token and let request fail
      return currentToken;
    }
  }
  
  // Update cache
  tokenCache = { token: currentToken, timestamp: now };
  return currentToken;
};

const sessionExpiredError = () => {
  const error = new Error(toUserFriendlyError('Session expired. Please login again.', 401)) as Error & {
    status?: number;
  };
  error.status = 401;
  return error;
};

const handleResponse = async (res: Response, asBlob?: boolean) => {
  if (!res.ok) {
    const text = await res.text();
    let errorMsg = `Request failed with status ${res.status}`;

    try {
      const errorData = JSON.parse(text);
      errorMsg = parseApiErrorBody(errorData, res.status);
    } catch {
      if (text && text.length < 200) {
        errorMsg = text;
      }
    }

    errorMsg = toUserFriendlyError(errorMsg, res.status);

    console.error(`[HTTP Error] ${res.status} ${res.statusText}:`, errorMsg);

    const error = new Error(errorMsg) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  if (asBlob) return res.blob();
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('[HTTP] Failed to parse JSON response:', text);
    return text;
  }
};

export const http = async <T = any>(
  url: string,
  { token, query, asBlob, headers, skipAuthRefresh, timeout = 30000, ...init }: HttpOptions = {}
): Promise<T> => {
  const qs = buildQueryString(query);
  const finalUrl = `${DEFAULT_BASE_URL}${url}${qs}`;

  const isFormData = init.body instanceof FormData;
  
  // Get a valid token (will auto-refresh if needed)
  const authToken = skipAuthRefresh ? token : await getValidToken(token);
  
  const mergedHeaders: HeadersInit = {
    // Only set Content-Type for non-FormData requests
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers || {}),
  };

  if (authToken) {
    (mergedHeaders as any).Authorization = `Bearer ${authToken}`;
  }

  // Remove Content-Type if it was explicitly set to undefined (for FormData)
  if ((mergedHeaders as any)['Content-Type'] === undefined) {
    delete (mergedHeaders as any)['Content-Type'];
  }

  console.log(`[HTTP] ${init.method || 'GET'} ${finalUrl}`);
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(finalUrl, {
      ...init,
      cache: 'no-store',
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && !skipAuthRefresh) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        console.log('[HTTP] Got 401, attempting token refresh...');
        try {
          const newToken = await refreshAccessToken();
          
          // Retry the original request with new token
          console.log('[HTTP] Retrying request with new token...');
          const retryHeaders = { ...mergedHeaders };
          (retryHeaders as any).Authorization = `Bearer ${newToken}`;
          
          // Create new AbortController for retry
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => {
            retryController.abort();
          }, timeout);
          
          const retryResponse = await fetch(finalUrl, {
            ...init,
            cache: 'no-store',
            headers: retryHeaders,
            signal: retryController.signal,
          });
          
          clearTimeout(retryTimeoutId);
          
          // If retry also fails with 401, redirect to login
          if (retryResponse.status === 401) {
            console.error('[HTTP] Retry also got 401, redirecting to login');
            clearAuth();
            redirectToLogin();
            throw sessionExpiredError();
          }
          
          return handleResponse(retryResponse, asBlob) as Promise<T>;
        } catch (refreshError) {
          console.error('[HTTP] Token refresh failed, clearing auth:', refreshError);
          clearAuth();
          redirectToLogin();
          throw sessionExpiredError();
        }
      } else {
        // No refresh token, clear auth and redirect
        clearAuth();
        redirectToLogin();
        throw sessionExpiredError();
      }
    }

    return handleResponse(response, asBlob) as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      const timeoutError = new Error(toUserFriendlyError(`Request timeout after ${timeout}ms`, 408)) as Error & { status?: number };
      timeoutError.status = 408;
      console.error(`[HTTP] Request timeout for ${init.method || 'GET'} ${url}`);
      throw timeoutError;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error(toUserFriendlyError('Network error: Unable to connect to server', 0)) as Error & { status?: number };
      networkError.status = 0;
      console.error(`[HTTP] Network error for ${init.method || 'GET'} ${url}:`, error.message);
      throw networkError;
    }
    
    console.error(`[HTTP] Request failed for ${init.method || 'GET'} ${url}:`, error);
    throw error;
  }
};

export const httpGet = <T = any>(url: string, options?: HttpOptions) =>
  http<T>(url, { ...options, method: 'GET' });

export const httpPost = <T = any>(url: string, body?: any, options?: HttpOptions) =>
  http<T>(url, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const httpPut = <T = any>(url: string, body?: any, options?: HttpOptions) =>
  http<T>(url, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const httpDelete = <T = any>(url: string, options?: HttpOptions) =>
  http<T>(url, { ...options, method: 'DELETE' });

export const httpPatch = <T = any>(url: string, body?: any, options?: HttpOptions) =>
  http<T>(url, {
    ...options,
    method: 'PATCH',
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

export const httpPutFormData = <T = any>(url: string, formData: FormData, token?: string) =>
  http<T>(url, {
    method: 'PUT',
    body: formData,
    token,
    headers: {},
  });

export const httpPostFormData = <T = any>(url: string, formData: FormData, token?: string) =>
  http<T>(url, {
    method: 'POST',
    body: formData,
    token,
    headers: {},
  });

// Export the server base URL for media/file URLs (without /api suffix)
export const API_SERVER_URL = API_BASE_URL.startsWith('/')
  ? ''
  : API_BASE_URL.replace('/api', '');

/**
 * Converts a relative API path to a full URL for media files.
 * Use this for images, files, etc. returned from the API.
 * 
 * @example
 * getMediaUrl('/api/files/site/logos/abc.jpeg') 
 * // Returns: 'http://localhost:7000/api/files/site/logos/abc.jpeg'
 */
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // In dev, serve media through the Vite proxy (same-origin) so PDF/canvas can read pixels.
  if (import.meta.env.DEV) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const url = new URL(path);
        if (url.pathname.startsWith('/api/files/')) {
          return url.pathname;
        }
      } catch {
        // Fall through to default handling.
      }
    }
    if (path.startsWith('/api/files/')) {
      return path;
    }
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_SERVER_URL}${path}`;
};
