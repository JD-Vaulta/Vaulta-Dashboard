// src/services/backgroundLambdaService.js
import { invokeLambdaFunction } from "../calc/lastmonthdata.js";

class BackgroundLambdaService {
  constructor() {
    this.activeRequests = new Map(); // batteryId -> request info
    this.cache = new Map(); // batteryId -> cached data
    this.subscribers = new Map(); // batteryId -> Set of callbacks
    this.progressCallbacks = new Map(); // batteryId -> Set of progress callbacks
  }

  // Subscribe to battery data updates
  subscribe(batteryId, callback, progressCallback = null) {
    if (!this.subscribers.has(batteryId)) {
      this.subscribers.set(batteryId, new Set());
    }
    this.subscribers.get(batteryId).add(callback);

    if (progressCallback) {
      if (!this.progressCallbacks.has(batteryId)) {
        this.progressCallbacks.set(batteryId, new Set());
      }
      this.progressCallbacks.get(batteryId).add(progressCallback);
    }

    // Return cached data immediately if available
    if (this.cache.has(batteryId)) {
      callback(this.cache.get(batteryId));
    }

    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(batteryId)) {
        this.subscribers.get(batteryId).delete(callback);
      }
      if (progressCallback && this.progressCallbacks.has(batteryId)) {
        this.progressCallbacks.get(batteryId).delete(progressCallback);
      }
    };
  }

  // Notify all subscribers for a battery
  notifySubscribers(batteryId, data) {
    if (this.subscribers.has(batteryId)) {
      this.subscribers.get(batteryId).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }

  // Notify progress subscribers
  notifyProgressSubscribers(batteryId, progress) {
    if (this.progressCallbacks.has(batteryId)) {
      this.progressCallbacks.get(batteryId).forEach((callback) => {
        try {
          callback(progress);
        } catch (error) {
          console.error("Error in progress callback:", error);
        }
      });
    }
  }

  // Fetch data for a battery (with background processing)
  async fetchBatteryData(batteryId, timeRange = "7days", force = false) {
    const requestKey = `${batteryId}-${timeRange}`;

    // Return existing request if already in progress
    if (this.activeRequests.has(requestKey) && !force) {
      console.log(`Request already in progress for ${requestKey}`);
      return this.activeRequests.get(requestKey);
    }

    // Return cached data if available and not forcing refresh
    if (this.cache.has(requestKey) && !force) {
      console.log(`Returning cached data for ${requestKey}`);
      this.notifySubscribers(batteryId, this.cache.get(requestKey));
      return this.cache.get(requestKey);
    }

    console.log(`Starting background fetch for battery ${batteryId}`);

    // Notify progress start
    this.notifyProgressSubscribers(batteryId, {
      status: "starting",
      message: `Fetching data for Battery ${batteryId}...`,
      progress: 0,
    });

    const requestPromise = this.performLambdaRequest(
      batteryId,
      timeRange,
      requestKey
    );
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      this.cache.set(requestKey, result);

      // Notify all subscribers
      this.notifySubscribers(batteryId, result);

      // Notify progress completion
      this.notifyProgressSubscribers(batteryId, {
        status: "completed",
        message: `Data loaded for Battery ${batteryId}`,
        progress: 100,
      });

      console.log(`Background fetch completed for battery ${batteryId}`);
      return result;
    } catch (error) {
      console.error(`Background fetch failed for battery ${batteryId}:`, error);

      // Notify error
      this.notifyProgressSubscribers(batteryId, {
        status: "error",
        message: `Failed to load data for Battery ${batteryId}: ${error.message}`,
        progress: 0,
      });

      throw error;
    } finally {
      // Clean up active request
      this.activeRequests.delete(requestKey);
    }
  }

  async performLambdaRequest(batteryId, timeRange, requestKey) {
    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 10, message: "Initializing Lambda request..." },
        { progress: 30, message: "Processing battery data..." },
        { progress: 60, message: "Calculating energy metrics..." },
        { progress: 80, message: "Preparing response..." },
      ];

      // Send progress updates
      progressSteps.forEach((step, index) => {
        setTimeout(() => {
          this.notifyProgressSubscribers(batteryId, {
            status: "processing",
            message: step.message,
            progress: step.progress,
          });
        }, index * 500);
      });

      // Extract the battery suffix for Lambda call
      const tagIdSuffix = batteryId.includes("BAT-")
        ? batteryId.split("BAT-")[1]
        : batteryId === "0700"
        ? "0700"
        : batteryId;

      console.log(
        `Invoking Lambda for battery ${batteryId} with suffix ${tagIdSuffix}`
      );

      const response = await invokeLambdaFunction(tagIdSuffix, timeRange);

      if (!response) {
        throw new Error("No response from Lambda function");
      }

      return response;
    } catch (error) {
      console.error(`Lambda request failed for ${batteryId}:`, error);
      throw error;
    }
  }

  // Get cached data without triggering a fetch
  getCachedData(batteryId, timeRange = "7days") {
    const requestKey = `${batteryId}-${timeRange}`;
    return this.cache.get(requestKey) || null;
  }

  // Check if a request is in progress
  isLoading(batteryId, timeRange = "7days") {
    const requestKey = `${batteryId}-${timeRange}`;
    return this.activeRequests.has(requestKey);
  }

  // Clear cache for a specific battery or all
  clearCache(batteryId = null, timeRange = null) {
    if (batteryId && timeRange) {
      const requestKey = `${batteryId}-${timeRange}`;
      this.cache.delete(requestKey);
    } else if (batteryId) {
      // Clear all timeranges for this battery
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${batteryId}-`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Preload data for common batteries
  async preloadCommonBatteries(batteryIds, timeRange = "7days") {
    console.log("Preloading data for common batteries:", batteryIds);

    const preloadPromises = batteryIds.map((batteryId) =>
      this.fetchBatteryData(batteryId, timeRange).catch((error) => {
        console.warn(`Preload failed for battery ${batteryId}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(preloadPromises);
    console.log("Preload completed:", results.length, "requests processed");

    return results;
  }
}

// Create singleton instance
const backgroundLambdaService = new BackgroundLambdaService();

export default backgroundLambdaService;
