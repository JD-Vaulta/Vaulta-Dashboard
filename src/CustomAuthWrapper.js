import React, { useState, useEffect } from "react";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "./app/components/LoadingSpinner.js";

const CustomAuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount and when location changes
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      if (currentUser && session) {
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          ...currentUser
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("User not authenticated:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading spinner while checking auth status
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

  // Pass user, signOut function, and navigate to children
  return (
    <div
      className="auth-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      {children({ 
        user, 
        signOut: handleSignOut, 
        navigate,
        checkAuthStatus // Pass this in case children need to re-check auth
      })}
    </div>
  );
};

export default CustomAuthWrapper;