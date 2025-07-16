import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import './SignInPage.css';

const SignInPage = ({ onSignIn }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: formData.email,
        password: formData.password,
      });
      
      if (isSignedIn) {
        // Call the onSignIn callback if provided
        if (onSignIn) {
          onSignIn();
        }
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      if (error.name === 'UserNotConfirmedException') {
        setErrors({ general: 'Account not confirmed. Please check your email for confirmation code.' });
        // You could redirect to confirmation page here
      } else if (error.name === 'NotAuthorizedException') {
        setErrors({ general: 'Incorrect email or password.' });
      } else {
        setErrors({ general: error.message || 'Failed to sign in. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="logo-section">
          <img src="./vaulta_logo.svg" alt="Logo" className="signin-logo" />
          <h1>Welcome Back</h1>
          <p className="signin-subtitle">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSignIn}>
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          
          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>
          
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="form-footer">
          <p>
            Don't have an account? 
            <Link to="/signup" className="signup-link"> Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;