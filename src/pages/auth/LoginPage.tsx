import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAInTandem } from '@aintandem/sdk-react';
import { getApiBaseUrl } from '@/lib/config';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDesktopApp, setIsDesktopApp] = useState<boolean | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Use SDK's auth hook
  const { login: sdkLogin, isAuthenticated, isLoading: isAuthLoading } = useAInTandem();

  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path or default to home
  const from = location.state?.from?.pathname || '/';

  // Check if running in AInTandem Desktop app and if API is localhost
  useEffect(() => {
    const inDesktopApp = !!window.__IN_AINTANDEM_DESKTOP__;
    setIsDesktopApp(inDesktopApp);

    const apiBaseUrl = getApiBaseUrl();
    // Check if API URL is localhost (empty means proxy mode, which is also localhost in dev)
    const isLocal = !apiBaseUrl ||
                    apiBaseUrl.includes('localhost') ||
                    apiBaseUrl.includes('127.0.0.1') ||
                    apiBaseUrl.includes('[::1]');
    setIsLocalhost(isLocal);
  }, []);

  // If already authenticated, redirect to target page
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Use SDK's login method
      await sdkLogin({ username, password });

      // SDK handles token storage internally and updates auth state via AInTandemProvider
      // Redirect to the originally requested page or home
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show different UI based on environment
  // Show "Desktop App Required" if: NOT in desktop app AND API is localhost
  if (isDesktopApp === false && isLocalhost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">AInTandem Desktop Required</CardTitle>
            <CardDescription>This application requires the AInTandem Desktop app</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              This application is designed to run in the AInTandem Desktop environment.
              Please download and use the desktop app for full functionality.
            </p>
            <a
              href="https://www.aintandem.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Visit AInTandem Website</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while checking environment
  if (isDesktopApp === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Checking environment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original login form for desktop app
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to AInTandem</CardTitle>
          <CardDescription>Enter your credentials to access the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm py-2">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
