import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBatteryContext } from '../../contexts/BatteryContext.js';
import LoadingSpinner from '../../app/components/LoadingSpinner.js';

const BatteryProtectedRoute = ({ children, user }) => {
  const location = useLocation();
  const { hasRegisteredBatteries, loading, error } = useBatteryContext();

  // If user is not authenticated, this should be handled by the main ProtectedRoute
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Show loading spinner while checking battery registration
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f2f2f2'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  // If there's an error loading batteries, show error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f2f2f2',
        padding: '20px'
      }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>
          Unable to Load Battery Information
        </h2>
        <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Allow access to battery registration pages even without registered batteries
  const batteryRegistrationPaths = ['/battery-registration', '/battery-management'];
  const isRegistrationPath = batteryRegistrationPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // If user has no registered batteries and not on registration page, redirect to registration
  if (!hasRegisteredBatteries && !isRegistrationPath) {
    console.log('[BatteryProtectedRoute] No batteries registered, redirecting to registration page');
    return <Navigate to="/battery-registration" state={{ from: location }} replace />;
  }

  // If user has batteries but is on registration page, allow access (they might want to add more)
  return children;
};

export default BatteryProtectedRoute;