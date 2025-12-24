import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { login as authLogin } from '@/lib/api/auth';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDesktopApp, setIsDesktopApp] = useState<boolean | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if running in AInTandem Desktop app
  useEffect(() => {
    setIsDesktopApp(!!window.__IN_AINTANDEM_DESKTOP__);
  }, []);

  // Get the redirect path from state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Call the authentication API
      const result = await authLogin({ username, password });

      if (result.success && result.token) {
        // Store the token in the auth context
        login(result.token, result.user); // Pass the token and user info to the auth context

        // Redirect to the intended page or home
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed due to server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show different UI based on environment
  if (isDesktopApp === false) {
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
          <CardTitle className="text-2xl">Welcome to Kai</CardTitle>
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