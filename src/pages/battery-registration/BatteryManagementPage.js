import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBatteryContext } from '../../contexts/BatteryContext.js';
import { deactivateBattery } from '../../services/batteryRegistrationService.js';

const BatteryManagementPage = () => {
  const navigate = useNavigate();
  const { userBatteries, selectedBattery, selectBattery, refreshBatteries } = useBatteryContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle battery deactivation
  const handleDeactivate = async (battery) => {
    if (!window.confirm(`Are you sure you want to remove "${battery.nickname || battery.serialNumber}"?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await deactivateBattery(battery.registrationId);
      
      if (result.success) {
        setSuccessMessage('Battery removed successfully');
        await refreshBatteries();
        
        // If the deactivated battery was selected, select another one
        if (selectedBattery?.registrationId === battery.registrationId) {
          const remainingBatteries = userBatteries.filter(b => b.registrationId !== battery.registrationId);
          if (remainingBatteries.length > 0) {
            selectBattery(remainingBatteries[0]);
          }
        }
      } else {
        setError(result.message || 'Failed to remove battery');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Deactivation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle battery selection
  const handleSelect = (battery) => {
    selectBattery(battery);
    setSuccessMessage(`Selected battery: ${battery.nickname || battery.serialNumber}`);
  };

  // Common styles
  const containerStyle = {
    padding: '20px',
    backgroundColor: '#f2f2f2',
    minHeight: 'calc(100vh - 200px)'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    margin: '0 4px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2196F3',
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: 'white'
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div 
      style={containerStyle}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ color: '#333', margin: 0 }}>Battery Management</h1>
          <div>
            <button
              onClick={() => navigate('/battery-registration')}
              style={primaryButtonStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              + Add New Battery
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{...buttonStyle, backgroundColor: '#666', color: 'white'}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#555'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#666'}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <p style={{ color: '#666', margin: 0 }}>
          Manage your registered batteries. You have {userBatteries.length} battery{userBatteries.length !== 1 ? 's' : ''} registered.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          padding: '12px 24px',
          borderRadius: '10px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          padding: '12px 24px',
          borderRadius: '10px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {successMessage}
        </div>
      )}

      {/* Battery List */}
      {userBatteries.length === 0 ? (
        <div style={{...cardStyle, textAlign: 'center', padding: '40px'}}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>No Batteries Registered</h3>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            Get started by registering your first battery.
          </p>
          <button
            onClick={() => navigate('/battery-registration')}
            style={primaryButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Register Battery
          </button>
        </div>
      ) : (
        <div>
          {userBatteries.map((battery) => (
            <div key={battery.registrationId} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ color: '#333', margin: '0 16px 0 0' }}>
                      {battery.nickname || `Battery ${battery.batteryId}`}
                    </h3>
                    {selectedBattery?.registrationId === battery.registrationId && (
                      <span style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        SELECTED
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <strong style={{ color: '#666' }}>Serial Number:</strong>
                      <div style={{ color: '#333', fontFamily: 'monospace' }}>{battery.serialNumber}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#666' }}>Battery ID:</strong>
                      <div style={{ color: '#333', fontFamily: 'monospace' }}>{battery.batteryId}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#666' }}>Registered:</strong>
                      <div style={{ color: '#333' }}>
                        {new Date(battery.registrationDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#666' }}>Status:</strong>
                      <div style={{ color: battery.isActive ? '#4CAF50' : '#f44336' }}>
                        {battery.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedBattery?.registrationId !== battery.registrationId && (
                    <button
                      onClick={() => handleSelect(battery)}
                      style={secondaryButtonStyle}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleDeactivate(battery)}
                    disabled={loading}
                    style={{
                      ...dangerButtonStyle,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#d32f2f')}
                    onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#f44336')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div style={{...cardStyle, backgroundColor: '#e3f2fd'}}>
        <h3 style={{ color: '#1976d2', marginBottom: '12px' }}>Battery Management Tips</h3>
        <ul style={{ color: '#1565c0', margin: 0, paddingLeft: '20px' }}>
          <li>The selected battery determines which data you see across all pages</li>
          <li>You can add multiple batteries and switch between them easily</li>
          <li>Removing a battery only deactivates it - your historical data is preserved</li>
          <li>Battery IDs must be unique across the entire system</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default BatteryManagementPage;