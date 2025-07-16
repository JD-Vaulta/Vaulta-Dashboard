// src/components/auth/BatteryProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBatteryContext } from '../../contexts/BatteryContext.js';
import LoadingSpinner from '../../pages/components/common/LoadingSpinner.js';

// Logging configuration - set to false to disable logs
const ENABLE_LOGGING = true;
const LOG_PREFIX = '[BatteryProtectedRoute]';

const log = (...args) => {
  if (ENABLE_LOGGING) {
    console.log(LOG_PREFIX, ...args);
  }
};

const logError = (...args) => {
  if (ENABLE_LOGGING) {
    console.error(LOG_PREFIX, ...args);
  }
};

const logWarn = (...args) => {
  if (ENABLE_LOGGING) {
    console.warn(LOG_PREFIX, ...args);
  }
};

const BatteryProtectedRoute = ({ 
  children, 
  redirectTo = '/battery-registration',
  allowWithoutBatteries = false,
  showLoadingScreen = true,
  minLoadingTime = 1000 // Minimum loading time in ms to prevent flash
}) => {
  const location = useLocation();
  const {
    isInitialized,
    hasRegisteredBatteries,
    loading,
    error,
    batteries,
    initializeBatteries
  } = useBatteryContext();

  const [isReady, setIsReady] = useState(false);
  const [initStartTime, setInitStartTime] = useState(null);

  log('BatteryProtectedRoute render:', {
    pathname: location.pathname,
    isInitialized,
    hasRegisteredBatteries,
    loading,
    error,
    batteriesCount: batteries.length,
    allowWithoutBatteries,
    isReady
  });

  // Initialize and handle minimum loading time
  useEffect(() => {
    const initialize = async () => {
      const startTime = Date.now();
      setInitStartTime(startTime);
      
      log('Starting initialization...');

      if (!isInitialized) {
        try {
          await initializeBatteries();
        } catch (err) {
          logError('Initialization failed:', err);
        }
      }

      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        log(`Waiting additional ${remainingTime}ms for minimum loading time...`);
        setTimeout(() => {
          setIsReady(true);
        }, remainingTime);
      } else {
        setIsReady(true);
      }
    };

    if (!isReady) {
      initialize();
    }
  }, [isInitialized, initializeBatteries, isReady, minLoadingTime]);

  // Show loading screen
  if (!isReady || loading) {
    log('Showing loading screen');
    
    if (!showLoadingScreen) {
      return null;
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f2f2f2",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <LoadingSpinner />
        <h2 
          style={{ 
            marginTop: "20px", 
            color: "#2E7D32",
            fontSize: "1.2rem",
            fontWeight: "600"
          }}
        >
          Loading battery information...
        </h2>
        <p 
          style={{ 
            color: "#757575", 
            marginTop: "10px",
            fontSize: "0.9rem"
          }}
        >
          Please wait while we verify your battery registrations
        </p>
      </div>
    );
  }

  // Handle errors
  if (error) {
    logError('Error state detected:', error);
    
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f2f2f2",
          padding: "20px",
          textAlign: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxWidth: "500px",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              color: "#F44336",
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              color: "#F44336",
              marginBottom: "15px",
              fontWeight: "600",
            }}
          >
            Battery System Error
          </h2>
          <p
            style={{
              color: "#666",
              marginBottom: "20px",
              lineHeight: "1.5",
            }}
          >
            Unable to load your battery information. Please try refreshing the page or contact support if the problem persists.
          </p>
          <p
            style={{
              color: "#999",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
            }}
          >
            Error: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#2E7D32",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              marginTop: "20px",
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Check battery requirements
  if (!allowWithoutBatteries && !hasRegisteredBatteries) {
    log('No registered batteries found, redirecting to registration');
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location.pathname,
          reason: 'no_batteries',
          message: 'You need to register at least one battery to access this page.'
        }} 
        replace 
      />
    );
  }

  // All checks passed, render protected content
  log('All checks passed, rendering protected content');
  
  return (
    <div>
      {/* Optional: Show battery info bar for debugging */}
      {ENABLE_LOGGING && (
        <div
          style={{
            backgroundColor: "#E8F5E9",
            color: "#2E7D32",
            padding: "8px 16px",
            fontSize: "0.8rem",
            borderBottom: "1px solid #C8E6C9",
            fontFamily: "monospace",
          }}
        >
          🔋 Batteries: {batteries.length} | Selected: {batteries.find(b => b.batteryId === hasRegisteredBatteries)?.batteryId || 'None'} | Last Updated: {new Date().toLocaleTimeString()}
        </div>
      )}
      {children}
    </div>
  );
};

// Higher-order component for easy wrapping
export const withBatteryProtection = (Component, options = {}) => {
  return (props) => (
    <BatteryProtectedRoute {...options}>
      <Component {...props} />
    </BatteryProtectedRoute>
  );
};

// Hook for checking battery protection status
export const useBatteryProtection = () => {
  const {
    isInitialized,
    hasRegisteredBatteries,
    loading,
    error,
    batteries
  } = useBatteryContext();

  const canAccessProtectedRoutes = isInitialized && hasRegisteredBatteries && !error;
  const needsRegistration = isInitialized && !hasRegisteredBatteries && !error;
  const hasError = !!error;
  const isLoading = loading || !isInitialized;

  log('Battery protection status:', {
    canAccessProtectedRoutes,
    needsRegistration,
    hasError,
    isLoading,
    batteriesCount: batteries.length
  });

  return {
    canAccessProtectedRoutes,
    needsRegistration,
    hasError,
    isLoading,
    batteries,
    error
  };
};

export default BatteryProtectedRoute;