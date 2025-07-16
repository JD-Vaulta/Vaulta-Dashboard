// src/contexts/BatteryContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import batteryRegistrationService from '../services/batteryRegistrationService.js';

// Logging configuration - set to false to disable logs
const ENABLE_LOGGING = true;
const LOG_PREFIX = '[BatteryContext]';

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

// Action types
const BATTERY_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_BATTERIES: 'SET_BATTERIES',
  ADD_BATTERY: 'ADD_BATTERY',
  UPDATE_BATTERY: 'UPDATE_BATTERY',
  REMOVE_BATTERY: 'REMOVE_BATTERY',
  SET_SELECTED_BATTERY: 'SET_SELECTED_BATTERY',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_REGISTRATION_STATUS: 'SET_REGISTRATION_STATUS',
  SET_INITIALIZATION_STATUS: 'SET_INITIALIZATION_STATUS',
};

// Initial state
const initialState = {
  batteries: [],
  selectedBattery: null,
  loading: false,
  error: null,
  isInitialized: false,
  hasRegisteredBatteries: false,
  registrationInProgress: false,
  lastUpdated: null,
};

// Reducer function
const batteryReducer = (state, action) => {
  log('Reducer action:', action.type, action.payload);

  switch (action.type) {
    case BATTERY_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case BATTERY_ACTIONS.SET_BATTERIES:
      const batteries = action.payload || [];
      const hasRegisteredBatteries = batteries.length > 0;
      
      // Set selected battery if none selected and batteries available
      let selectedBattery = state.selectedBattery;
      if (!selectedBattery && hasRegisteredBatteries) {
        selectedBattery = batteries[0].batteryId;
        log('Auto-selecting first battery:', selectedBattery);
      }

      return {
        ...state,
        batteries,
        hasRegisteredBatteries,
        selectedBattery,
        lastUpdated: new Date().toISOString(),
        error: null,
      };

    case BATTERY_ACTIONS.ADD_BATTERY:
      const newBattery = action.payload;
      const updatedBatteries = [...state.batteries, newBattery];
      
      return {
        ...state,
        batteries: updatedBatteries,
        hasRegisteredBatteries: true,
        selectedBattery: state.selectedBattery || newBattery.batteryId,
        lastUpdated: new Date().toISOString(),
      };

    case BATTERY_ACTIONS.UPDATE_BATTERY:
      return {
        ...state,
        batteries: state.batteries.map(battery =>
          battery.registrationId === action.payload.registrationId
            ? { ...battery, ...action.payload.updates }
            : battery
        ),
        lastUpdated: new Date().toISOString(),
      };

    case BATTERY_ACTIONS.REMOVE_BATTERY:
      const filteredBatteries = state.batteries.filter(
        battery => battery.registrationId !== action.payload
      );
      
      // Update selected battery if the removed one was selected
      let newSelectedBattery = state.selectedBattery;
      if (state.batteries.find(b => b.registrationId === action.payload)?.batteryId === state.selectedBattery) {
        newSelectedBattery = filteredBatteries.length > 0 ? filteredBatteries[0].batteryId : null;
      }

      return {
        ...state,
        batteries: filteredBatteries,
        selectedBattery: newSelectedBattery,
        hasRegisteredBatteries: filteredBatteries.length > 0,
        lastUpdated: new Date().toISOString(),
      };

    case BATTERY_ACTIONS.SET_SELECTED_BATTERY:
      log('Setting selected battery:', action.payload);
      return {
        ...state,
        selectedBattery: action.payload,
      };

    case BATTERY_ACTIONS.SET_ERROR:
      logError('Setting error:', action.payload);
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case BATTERY_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case BATTERY_ACTIONS.SET_REGISTRATION_STATUS:
      return {
        ...state,
        registrationInProgress: action.payload,
      };

    case BATTERY_ACTIONS.SET_INITIALIZATION_STATUS:
      log('Setting initialization status:', action.payload);
      return {
        ...state,
        isInitialized: action.payload,
      };

    default:
      logWarn('Unknown action type:', action.type);
      return state;
  }
};

// Create context
const BatteryContext = createContext();

// Custom hook to use battery context
export const useBatteryContext = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error('useBatteryContext must be used within a BatteryProvider');
  }
  return context;
};

// Battery Provider Component
export const BatteryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(batteryReducer, initialState);

  log('BatteryProvider render - state:', state);

  // Initialize batteries
  const initializeBatteries = useCallback(async () => {
    log('Initializing batteries...');
    
    if (state.isInitialized) {
      log('Already initialized, skipping...');
      return;
    }

    dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: true });

    try {
      const batteries = await batteryRegistrationService.getUserBatteries();
      log('Batteries loaded:', batteries);
      
      dispatch({ type: BATTERY_ACTIONS.SET_BATTERIES, payload: batteries });
      dispatch({ type: BATTERY_ACTIONS.SET_INITIALIZATION_STATUS, payload: true });
    } catch (error) {
      logError('Failed to initialize batteries:', error);
      dispatch({ type: BATTERY_ACTIONS.SET_ERROR, payload: error.message });
      dispatch({ type: BATTERY_ACTIONS.SET_INITIALIZATION_STATUS, payload: true });
    } finally {
      dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.isInitialized]);

  // Register new battery
  const registerBattery = useCallback(async (serialNumber, batteryId, nickname = '') => {
    log('Registering new battery:', { serialNumber, batteryId, nickname });
    
    dispatch({ type: BATTERY_ACTIONS.SET_REGISTRATION_STATUS, payload: true });
    dispatch({ type: BATTERY_ACTIONS.CLEAR_ERROR });

    try {
      const response = await batteryRegistrationService.registerBattery(
        serialNumber,
        batteryId,
        nickname
      );
      
      log('Battery registration response:', response);

      // Add the new battery to state
      const newBattery = response.data || {
        registrationId: response.registrationId,
        serialNumber,
        batteryId,
        nickname,
        isActive: true,
        registrationDate: new Date().toISOString(),
      };

      dispatch({ type: BATTERY_ACTIONS.ADD_BATTERY, payload: newBattery });
      
      return response;
    } catch (error) {
      logError('Battery registration failed:', error);
      dispatch({ type: BATTERY_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: BATTERY_ACTIONS.SET_REGISTRATION_STATUS, payload: false });
    }
  }, []);

  // Refresh batteries from server
  const refreshBatteries = useCallback(async () => {
    log('Refreshing batteries...');
    
    dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BATTERY_ACTIONS.CLEAR_ERROR });

    try {
      const batteries = await batteryRegistrationService.getUserBatteries();
      log('Batteries refreshed:', batteries);
      
      dispatch({ type: BATTERY_ACTIONS.SET_BATTERIES, payload: batteries });
    } catch (error) {
      logError('Failed to refresh batteries:', error);
      dispatch({ type: BATTERY_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Deactivate battery
  const deactivateBattery = useCallback(async (registrationId) => {
    log('Deactivating battery:', registrationId);
    
    dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BATTERY_ACTIONS.CLEAR_ERROR });

    try {
      await batteryRegistrationService.deactivateBattery(registrationId);
      log('Battery deactivated successfully');
      
      // Update battery status in state
      dispatch({
        type: BATTERY_ACTIONS.UPDATE_BATTERY,
        payload: {
          registrationId,
          updates: { isActive: false },
        },
      });
    } catch (error) {
      logError('Failed to deactivate battery:', error);
      dispatch({ type: BATTERY_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: BATTERY_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Select battery
  const selectBattery = useCallback((batteryId) => {
    log('Selecting battery:', batteryId);
    dispatch({ type: BATTERY_ACTIONS.SET_SELECTED_BATTERY, payload: batteryId });
  }, []);

  // Validate battery access
  const validateBatteryAccess = useCallback(async (batteryId) => {
    log('Validating battery access:', batteryId);
    
    try {
      return await batteryRegistrationService.validateBatteryAccess(batteryId);
    } catch (error) {
      logError('Battery access validation failed:', error);
      return false;
    }
  }, []);

  // Get battery options for dropdowns
  const getBatteryOptions = useCallback(() => {
    const activeBatteries = state.batteries.filter(battery => battery.isActive);
    const options = activeBatteries.map(battery => ({
      value: battery.batteryId,
      label: battery.nickname || battery.batteryId,
      serialNumber: battery.serialNumber,
      registrationId: battery.registrationId,
    }));
    
    log('Battery options generated:', options);
    return options;
  }, [state.batteries]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: BATTERY_ACTIONS.CLEAR_ERROR });
  }, []);

  // Initialize on mount
  useEffect(() => {
    log('BatteryProvider mounted, initializing...');
    initializeBatteries();
  }, [initializeBatteries]);

  // Context value
  const contextValue = {
    // State
    batteries: state.batteries,
    selectedBattery: state.selectedBattery,
    loading: state.loading,
    error: state.error,
    isInitialized: state.isInitialized,
    hasRegisteredBatteries: state.hasRegisteredBatteries,
    registrationInProgress: state.registrationInProgress,
    lastUpdated: state.lastUpdated,

    // Actions
    registerBattery,
    refreshBatteries,
    deactivateBattery,
    selectBattery,
    validateBatteryAccess,
    getBatteryOptions,
    clearError,
    initializeBatteries,

    // Computed values
    activeBatteries: state.batteries.filter(battery => battery.isActive),
    inactiveBatteries: state.batteries.filter(battery => !battery.isActive),
    selectedBatteryInfo: state.batteries.find(battery => battery.batteryId === state.selectedBattery),
  };

  log('Context value:', contextValue);

  return (
    <BatteryContext.Provider value={contextValue}>
      {children}
    </BatteryContext.Provider>
  );
};

export default BatteryContext;