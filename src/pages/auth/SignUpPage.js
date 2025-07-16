import React, { useState } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import './SignUpPage.css'; // We'll create this next

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [confirmationData, setConfirmationData] = useState({
    show: false,
    email: '',
    code: ''
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

  const handleConfirmationChange = (e) => {
    const { name, value } = e.target;
    setConfirmationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email
          }
        }
      });
      
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setConfirmationData({
          show: true,
          email: formData.email,
          code: ''
        });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setErrors({ general: error.message || 'Failed to sign up. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: confirmationData.email,
        confirmationCode: confirmationData.code
      });
      
      if (isSignUpComplete) {
        // Show success message and redirect to sign in
        alert('Sign up successful! Please sign in with your credentials.');
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error confirming sign up:', error);
      setErrors({ general: error.message || 'Invalid confirmation code. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async () => {
    setLoading(true);
    try {
      // You can implement resend confirmation code logic here
      // await resendSignUpCode({ username: confirmationData.email });
      alert('Confirmation code resent to your email');
    } catch (error) {
      console.error('Error resending code:', error);
      setErrors({ general: error.message || 'Failed to resend code. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (confirmationData.show) {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <h2>Confirm Your Account</h2>
          <p className="confirmation-message">
            We've sent a confirmation code to {confirmationData.email}
          </p>
          
          <form onSubmit={handleConfirmSignUp}>
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}
            
            <div className="form-group">
              <label htmlFor="code">Confirmation Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={confirmationData.code}
                onChange={handleConfirmationChange}
                placeholder="Enter your code"
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Account'}
            </button>
          </form>
          
          <div className="form-footer">
            <button 
              onClick={resendConfirmationCode} 
              className="link-button"
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-section">
          <img src="/vaulta_logo.svg" alt="Logo" className="signup-logo" />
          <h1>Create Your Account</h1>
        </div>
        
        <form onSubmit={handleSignUp}>
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
              placeholder="Create a password"
              required
              disabled={loading}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
            <span className="password-hint">Must be at least 8 characters</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="form-footer">
          <p>
            Already have an account? 
            <Link to="/signin" className="signin-link"> Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;