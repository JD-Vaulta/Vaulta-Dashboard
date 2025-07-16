import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserBatteries, validateBatteryAccess, formatBatteryForDisplay } from '../services/batteryRegistrationService.js';

// Create the context
const BatteryContext = createContext();

// Custom hook to use the battery context
export const useBatteryContext = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error('useBatteryContext must be used within a BatteryProvider');
  }
  return context;
};

// Battery Provider Component
export const BatteryProvider = ({ children, user }) => {
  const [userBatteries, setUserBatteries] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRegisteredBatteries, setHasRegisteredBatteries] = useState(false);

  // Load user's registered batteries
  const loadUserBatteries = async () => {
    if (!user) {
      setUserBatteries([]);
      setSelectedBattery(null);
      setHasRegisteredBatteries(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getUserBatteries();
      
      if (result.success) {
        const activeBatteries = result.data.filter(battery => battery.isActive);
        setUserBatteries(activeBatteries);
        setHasRegisteredBatteries(activeBatteries.length > 0);

        console.log('[BatteryContext] Loaded batteries:', activeBatteries.length, 'active batteries');

        // Auto-select first battery if none selected
        if (activeBatteries.length > 0 && !selectedBattery) {
          setSelectedBattery(activeBatteries[0]);
          console.log('[BatteryContext] Auto-selected first battery:', activeBatteries[0].batteryId);
        }

        // Clear selected battery if it's no longer available
        if (selectedBattery && !activeBatteries.find(b => b.batteryId === selectedBattery.batteryId)) {
          const newSelected = activeBatteries.length > 0 ? activeBatteries[0] : null;
          setSelectedBattery(newSelected);
          console.log('[BatteryContext] Selected battery no longer available, switched to:', newSelected?.batteryId || 'none');
        }
      } else {
        setError(result.message);
        setUserBatteries([]);
        setHasRegisteredBatteries(false);
      }
    } catch (err) {
      setError('Failed to load batteries');
      setUserBatteries([]);
      setHasRegisteredBatteries(false);
      console.error('Error loading user batteries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to load batteries when user changes
  useEffect(() => {
    loadUserBatteries();
  }, [user]);

  // Select a battery
  const selectBattery = (battery) => {
    const batteryObject = typeof battery === 'string' 
      ? userBatteries.find(b => b.batteryId === battery)
      : battery;
    
    if (batteryObject) {
      setSelectedBattery(batteryObject);
      // Store in localStorage for persistence
      localStorage.setItem('selectedBatteryId', batteryObject.batteryId);
    }
  };

  // Effect to restore selected battery from localStorage
  useEffect(() => {
    if (userBatteries.length > 0 && !selectedBattery) {
      const savedBatteryId = localStorage.getItem('selectedBatteryId');
      if (savedBatteryId) {
        const savedBattery = userBatteries.find(b => b.batteryId === savedBatteryId);
        if (savedBattery) {
          setSelectedBattery(savedBattery);
          return;
        }
      }
      // If no saved battery or saved battery not found, select first one
      setSelectedBattery(userBatteries[0]);
    }
  }, [userBatteries]);

  // Get batteries formatted for dropdown
  const getBatteryOptions = () => {
    return userBatteries.map(formatBatteryForDisplay);
  };

  // Check if user has access to a specific battery
  const checkBatteryAccess = async (batteryId) => {
    return await validateBatteryAccess(batteryId);
  };

  // Refresh batteries (useful after registration)
  const refreshBatteries = () => {
    loadUserBatteries();
  };

  // Get current battery ID for API calls
  const getCurrentBatteryId = () => {
    return selectedBattery?.batteryId || null;
  };

  // Get current battery's tag ID format (for your existing API calls)
  const getCurrentBatteryTagId = () => {
    const batteryId = getCurrentBatteryId();
    if (!batteryId) return null;
    
    // Convert from "0x440" format to "BAT-0x440" format if needed
    return batteryId.startsWith('BAT-') ? batteryId : `BAT-${batteryId}`;
  };

  const contextValue = {
    // State
    userBatteries,
    selectedBattery,
    loading,
    error,
    hasRegisteredBatteries,

    // Actions
    loadUserBatteries,
    selectBattery,
    refreshBatteries,
    checkBatteryAccess,

    // Helpers
    getBatteryOptions,
    getCurrentBatteryId,
    getCurrentBatteryTagId,

    // Computed values
    selectedBatteryId: selectedBattery?.batteryId || null,
    selectedBatteryNickname: selectedBattery?.nickname || null,
    batteryCount: userBatteries.length,
  };

  return (
    <BatteryContext.Provider value={contextValue}>
      {children}
    </BatteryContext.Provider>
  );
};