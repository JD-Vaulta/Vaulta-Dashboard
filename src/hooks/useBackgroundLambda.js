// src/hooks/useBackgroundLambda.js
import { useState, useEffect, useCallback, useRef } from "react";
import backgroundLambdaService from "../services/backgroundLambdaService.js";
import { useBatteryContext } from "../contexts/BatteryContext.js";

export const useBackgroundLambda = (options = {}) => {
  const { timeRange = "7days", autoFetch = true, keepOldData = true } = options;

  const { getCurrentBatteryId, selectedBattery } = useBatteryContext();

  // State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    progress: 0,
    message: "",
    status: "idle",
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentBatteryId, setCurrentBatteryId] = useState(null);

  // Refs for cleanup
  const unsubscribeRef = useRef(null);
  const progressUnsubscribeRef = useRef(null);

  // Get current battery ID
  const batteryId = getCurrentBatteryId();

  // Subscribe to data and progress updates
  const subscribe = useCallback(
    (targetBatteryId) => {
      if (!targetBatteryId) return;

      // Clean up previous subscriptions
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }

      console.log(
        `[useBackgroundLambda] Subscribing to battery: ${targetBatteryId}`
      );

      // Subscribe to data updates
      unsubscribeRef.current = backgroundLambdaService.subscribe(
        targetBatteryId,
        (newData) => {
          console.log(
            `[useBackgroundLambda] Received data for battery: ${targetBatteryId}`
          );
          setData(newData);
          setLastUpdated(new Date());
          setError(null);
        }
      );

      // Subscribe to progress updates
      progressUnsubscribeRef.current = backgroundLambdaService.subscribe(
        targetBatteryId,
        () => {}, // No data callback needed here
        (progress) => {
          setLoadingProgress(progress);

          const isLoadingState =
            progress.status === "processing" || progress.status === "starting";
          setIsLoading(isLoadingState);

          if (progress.status === "error") {
            setError(progress.message);
            setIsLoading(false);
          }
        }
      );

      // Check for cached data immediately
      const cachedData = backgroundLambdaService.getCachedData(
        targetBatteryId,
        timeRange
      );
      if (cachedData) {
        console.log(
          `[useBackgroundLambda] Using cached data for battery: ${targetBatteryId}`
        );
        setData(cachedData);
        setLastUpdated(new Date());
      }
    },
    [timeRange]
  );

  // Handle battery changes
  useEffect(() => {
    if (batteryId && batteryId !== currentBatteryId) {
      console.log(
        `[useBackgroundLambda] Battery changed: ${currentBatteryId} -> ${batteryId}`
      );

      setCurrentBatteryId(batteryId);
      setError(null);

      // If keepOldData is false, clear current data
      if (!keepOldData) {
        setData(null);
      }

      // Subscribe to new battery
      subscribe(batteryId);

      // Auto-fetch if enabled
      if (autoFetch) {
        fetchData(batteryId, false);
      }
    }
  }, [batteryId, currentBatteryId, subscribe, autoFetch, keepOldData]);

  // Initial subscription
  useEffect(() => {
    if (batteryId && !currentBatteryId) {
      setCurrentBatteryId(batteryId);
      subscribe(batteryId);

      if (autoFetch) {
        fetchData(batteryId, false);
      }
    }
  }, [batteryId, currentBatteryId, subscribe, autoFetch]);

  // Fetch data function
  const fetchData = useCallback(
    async (targetBatteryId = null, force = false) => {
      const fetchBatteryId = targetBatteryId || batteryId;

      if (!fetchBatteryId) {
        console.warn("[useBackgroundLambda] No battery ID available for fetch");
        return null;
      }

      try {
        console.log(
          `[useBackgroundLambda] Fetching data for battery: ${fetchBatteryId} (force: ${force})`
        );

        setError(null);

        const result = await backgroundLambdaService.fetchBatteryData(
          fetchBatteryId,
          timeRange,
          force
        );

        return result;
      } catch (error) {
        console.error(
          `[useBackgroundLambda] Fetch failed for battery ${fetchBatteryId}:`,
          error
        );
        setError(`Failed to fetch data: ${error.message}`);
        throw error;
      }
    },
    [batteryId, timeRange]
  );

  // Refresh current battery data
  const refresh = useCallback(() => {
    if (batteryId) {
      return fetchData(batteryId, true);
    }
    return Promise.reject(new Error("No battery selected"));
  }, [batteryId, fetchData]);

  // Get loading state for specific battery
  const isLoadingBattery = useCallback(
    (targetBatteryId) => {
      return backgroundLambdaService.isLoading(targetBatteryId, timeRange);
    },
    [timeRange]
  );

  // Clear cache
  const clearCache = useCallback(
    (targetBatteryId = null) => {
      backgroundLambdaService.clearCache(targetBatteryId, timeRange);
    },
    [timeRange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    // Data
    data,
    isLoading,
    loadingProgress,
    error,
    lastUpdated,
    currentBatteryId,

    // Actions
    fetchData,
    refresh,
    clearCache,
    isLoadingBattery,

    // Computed
    hasData: !!data,
    isEmpty:
      !data || (typeof data === "object" && Object.keys(data).length === 0),
    isError: !!error,
    isIdle: !isLoading && !error && !data,
  };
};

// Specialized hook for ML Dashboard
export const useMLData = (options = {}) => {
  return useBackgroundLambda({
    timeRange: "7days",
    autoFetch: true,
    keepOldData: true,
    ...options,
  });
};

// Specialized hook for Energy Monitor
export const useEnergyData = (options = {}) => {
  return useBackgroundLambda({
    timeRange: "7days",
    autoFetch: true,
    keepOldData: true,
    ...options,
  });
};
