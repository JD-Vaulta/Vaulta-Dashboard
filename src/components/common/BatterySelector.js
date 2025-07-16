import React from 'react';
import { useBatteryContext } from '../../contexts/BatteryContext.js';
import { useNavigate } from 'react-router-dom';

const BatterySelector = ({ 
  style = {}, 
  className = '', 
  showAddButton = true,
  compact = false 
}) => {
  const navigate = useNavigate();
  const { 
    userBatteries, 
    selectedBattery, 
    selectBattery, 
    loading,
    getBatteryOptions 
  } = useBatteryContext();

  const handleBatteryChange = (event) => {
    const batteryId = event.target.value;
    selectBattery(batteryId);
  };

  const handleAddBattery = () => {
    navigate('/battery-management');
  };

  // Default styles matching your app's design
  const defaultSelectStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'border-color 0.2s ease',
    ...style
  };

  const defaultButtonStyle = {
    marginLeft: '8px',
    padding: compact ? '6px 12px' : '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: compact ? '12px' : '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <select 
          disabled 
          style={{ ...defaultSelectStyle, opacity: 0.6 }}
          className={className}
        >
          <option>Loading batteries...</option>
        </select>
      </div>
    );
  }

  if (userBatteries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <select 
          disabled 
          style={{ ...defaultSelectStyle, borderColor: '#f44336' }}
          className={className}
        >
          <option>No batteries registered</option>
        </select>
        {showAddButton && (
          <button
            onClick={handleAddBattery}
            style={defaultButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            + Add Battery
          </button>
        )}
      </div>
    );
  }

  const batteryOptions = getBatteryOptions();

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <select
        value={selectedBattery?.batteryId || ''}
        onChange={handleBatteryChange}
        style={defaultSelectStyle}
        className={className}
        onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
        onBlur={(e) => e.target.style.borderColor = '#ddd'}
      >
        {batteryOptions.map((battery) => (
          <option key={battery.value} value={battery.value}>
            {battery.label}
          </option>
        ))}
      </select>
      
      {showAddButton && (
        <button
          onClick={handleAddBattery}
          style={defaultButtonStyle}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          title="Manage batteries"
        >
          {compact ? '+' : '+ Manage'}
        </button>
      )}
      
      {!compact && selectedBattery && (
        <span style={{ 
          marginLeft: '12px', 
          fontSize: '12px', 
          color: '#666',
          fontWeight: '500'
        }}>
          {userBatteries.length} registered
        </span>
      )}
    </div>
  );
};

export default BatterySelector;