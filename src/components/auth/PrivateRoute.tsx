import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAInTandem } from '@aintandem/sdk-react';

interface PrivateRouteProps {
  children: React.JSX.Element;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAInTandem();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the current location as the redirect parameter
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}