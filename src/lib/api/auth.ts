/**
 * Authentication API Client
 * Functions for handling user authentication (login, logout, etc.)
 */

import { buildApiUrl } from '../config';
import { electronApiProxy } from '../utils/authenticated-fetch';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

/**
 * Login function that doesn't require authentication
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log(import.meta.env.VITE_API_BASE_URL)
  console.log(`In ${window.kai ? 'Electron' : 'Browser'}`)

  const fetchMethod = window.__IN_AINTANDEM_DESKTOP__ ? electronApiProxy : fetch;
  const response = await fetchMethod(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return await response.json();
}

/**
 * Logout function (if needed)
 */
export async function logout(): Promise<void> {
  // In a real implementation, you might want to call a logout endpoint
  // For now, we just clear the local storage in the auth context
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  try {
    // Optionally call an endpoint to verify the token
    // This would require a non-authenticated fetch, so we'll use fetch directly
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    const response = await fetch(buildApiUrl('/api/auth/me'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch {
    return false;
  }
}