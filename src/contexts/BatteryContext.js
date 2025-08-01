import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getUserBatteries,
  validateBatteryAccess,
  formatBatteryForDisplay,
} from "../services/batteryRegistrationService.js";
import {
  initDynamoDB,
  getLatestReading,
  getLatestPackControllerReading,
  detectBatteryType,
} from "../queries.js";

// Create the context
const BatteryContext = createContext();

// Custom hook to use the battery context
export const useBatteryContext = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error("useBatteryContext must be used within a BatteryProvider");
  }
  return context;
};

// Function to discover available batteries in the system
const discoverAvailableBatteries = async () => {
  try {
    console.log("[BatteryContext] Starting battery discovery...");
    const docClient = await initDynamoDB();
    const availableBatteries = [];

    // Common battery IDs to check (can be expanded)
    const commonBatteryIds = [
      "0x400",
      "0x401",
      "0x402",
      "0x403",
      "0x404",
      "0x405",
      "0x480",
      "0x481",
      "0x482",
      "0x483",
      "0x484",
      "0x485",
      "0x440",
      "0x441",
      "0x442",
      "0x443",
      "0x444",
      "0x445",
      "0x460",
      "0x461",
      "0x462",
      "0x463",
      "0x464",
      "0x465",
    ];

    // Check for Pack Controller first
    try {
      const packControllerData = await getLatestPackControllerReading(
        docClient,
        "PACK-CONTROLLER"
      );
      if (packControllerData) {
        availableBatteries.push({
          id: "0700",
          name: "Pack Controller",
          type: "PACK_CONTROLLER",
          displayName: "Pack Controller (0700)",
          lastSeen: new Date(
            parseInt(
              packControllerData.Timestamp?.N || packControllerData.Timestamp
            ) * 1000
          ),
          isActive: true,
        });
        console.log("[BatteryContext] Found Pack Controller");
      }
    } catch (error) {
      console.log("[BatteryContext] No Pack Controller found:", error.message);
    }

    // Check each common battery ID
    for (const batteryId of commonBatteryIds) {
      try {
        const fullBatteryId = `BAT-${batteryId}`;
        const latestReading = await getLatestReading(docClient, fullBatteryId);

        if (latestReading) {
          const lastSeenTimestamp =
            parseInt(latestReading.Timestamp?.N || latestReading.Timestamp) *
            1000;
          const lastSeen = new Date(lastSeenTimestamp);
          const hoursSinceLastSeen =
            (Date.now() - lastSeenTimestamp) / (1000 * 60 * 60);

          // Consider battery active if it has data within the last 24 hours
          const isActive = hoursSinceLastSeen <= 24;

          if (isActive) {
            availableBatteries.push({
              id: batteryId,
              name: `Battery ${batteryId}`,
              type: "BMS",
              displayName: `Battery ${batteryId}`,
              lastSeen: lastSeen,
              isActive: true,
              fullBatteryId: fullBatteryId,
            });
            console.log(`[BatteryContext] Found active battery: ${batteryId}`);
          }
        }
      } catch (error) {
        // Battery doesn't exist, skip silently
        continue;
      }
    }

    console.log(
      `[BatteryContext] Discovery complete: found ${availableBatteries.length} available batteries`
    );
    return availableBatteries;
  } catch (error) {
    console.error("[BatteryContext] Error during battery discovery:", error);
    return [];
  }
};

// Function to get more comprehensive battery scan (for future expansion)
const scanForAllBatteries = async () => {
  try {
    console.log("[BatteryContext] Starting comprehensive battery scan...");
    const docClient = await initDynamoDB();

    // This is a placeholder for a more comprehensive scan
    // In the future, you could scan the actual DynamoDB tables to find all TagIDs
    // For now, we'll use the discovery method with common IDs

    return await discoverAvailableBatteries();
  } catch (error) {
    console.error("[BatteryContext] Error during comprehensive scan:", error);
    return [];
  }
};

// Battery Provider Component
export const BatteryProvider = ({ children, user }) => {
  const [userBatteries, setUserBatteries] = useState([]);
  const [availableSystemBatteries, setAvailableSystemBatteries] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRegisteredBatteries, setHasRegisteredBatteries] = useState(false);
  const [batteryDiscoveryLoading, setBatteryDiscoveryLoading] = useState(false);

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
        const activeBatteries = result.data.filter(
          (battery) => battery.isActive
        );
        setUserBatteries(activeBatteries);
        setHasRegisteredBatteries(activeBatteries.length > 0);

        console.log(
          "[BatteryContext] Loaded registered batteries:",
          activeBatteries.length,
          "active batteries"
        );

        // Auto-select first battery if none selected
        if (activeBatteries.length > 0 && !selectedBattery) {
          setSelectedBattery(activeBatteries[0]);
          console.log(
            "[BatteryContext] Auto-selected first registered battery:",
            activeBatteries[0].batteryId
          );
        }

        // Clear selected battery if it's no longer available
        if (
          selectedBattery &&
          !activeBatteries.find(
            (b) => b.batteryId === selectedBattery.batteryId
          )
        ) {
          const newSelected =
            activeBatteries.length > 0 ? activeBatteries[0] : null;
          setSelectedBattery(newSelected);
          console.log(
            "[BatteryContext] Selected battery no longer available, switched to:",
            newSelected?.batteryId || "none"
          );
        }
      } else {
        setError(result.message);
        setUserBatteries([]);
        setHasRegisteredBatteries(false);
      }
    } catch (err) {
      setError("Failed to load registered batteries");
      setUserBatteries([]);
      setHasRegisteredBatteries(false);
      console.error("Error loading user batteries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load all available system batteries
  const loadAvailableSystemBatteries = async () => {
    setBatteryDiscoveryLoading(true);
    try {
      const discoveredBatteries = await discoverAvailableBatteries();
      setAvailableSystemBatteries(discoveredBatteries);
      console.log(
        "[BatteryContext] Loaded system batteries:",
        discoveredBatteries.length,
        "available"
      );
      return discoveredBatteries;
    } catch (error) {
      console.error("[BatteryContext] Error loading system batteries:", error);
      setAvailableSystemBatteries([]);
      return [];
    } finally {
      setBatteryDiscoveryLoading(false);
    }
  };

  // Effect to load batteries when user changes
  useEffect(() => {
    loadUserBatteries();
  }, [user]);

  // Effect to load system batteries on mount
  useEffect(() => {
    loadAvailableSystemBatteries();
  }, []);

  // Select a battery (works with both registered and system batteries)
  const selectBattery = (battery) => {
    const batteryObject =
      typeof battery === "string"
        ? userBatteries.find((b) => b.batteryId === battery) ||
          availableSystemBatteries.find((b) => b.id === battery)
        : battery;

    if (batteryObject) {
      setSelectedBattery(batteryObject);
      // Store in localStorage for persistence
      const batteryId = batteryObject.batteryId || batteryObject.id;
      localStorage.setItem("selectedBatteryId", batteryId);
      console.log("[BatteryContext] Selected battery:", batteryId);
    }
  };

  // Enhanced battery selection with validation
  const selectBatteryWithValidation = async (battery) => {
    const batteryObject =
      typeof battery === "string"
        ? userBatteries.find((b) => b.batteryId === battery) ||
          availableSystemBatteries.find((b) => b.id === battery)
        : battery;

    if (batteryObject) {
      const batteryId = batteryObject.batteryId || batteryObject.id;

      // Validate that the battery is accessible
      try {
        setLoading(true);
        const isValid = await validateBatteryAccess(batteryId);

        if (isValid.success) {
          setSelectedBattery(batteryObject);
          localStorage.setItem("selectedBatteryId", batteryId);
          console.log(
            "[BatteryContext] Successfully selected and validated battery:",
            batteryId
          );
          return { success: true, battery: batteryObject };
        } else {
          console.warn(
            "[BatteryContext] Battery validation failed:",
            isValid.message
          );
          return { success: false, message: isValid.message };
        }
      } catch (error) {
        console.warn(
          "[BatteryContext] Battery validation error, selecting anyway:",
          error
        );
        // Still select the battery even if validation fails
        setSelectedBattery(batteryObject);
        localStorage.setItem("selectedBatteryId", batteryId);
        return {
          success: true,
          battery: batteryObject,
          warning: error.message,
        };
      } finally {
        setLoading(false);
      }
    }

    return { success: false, message: "Battery not found" };
  };

  const getBatteryDisplayInfo = () => {
    if (!selectedBattery) return null;

    const batteryId = selectedBattery.batteryId || selectedBattery.id;
    const displayName =
      selectedBattery.nickname ||
      selectedBattery.name ||
      selectedBattery.displayName ||
      `Battery ${batteryId}`;

    return {
      id: batteryId,
      displayName,
      type: selectedBattery.type || detectBatteryType(batteryId),
      isRegistered: !!selectedBattery.batteryId, // Has batteryId means it's registered
      isSystemBattery: !!selectedBattery.id && !selectedBattery.batteryId,
      lastSeen: selectedBattery.lastSeen,
      isActive: selectedBattery.isActive !== false,
    };
  };

  // 3. Add this method to check if current battery supports energy monitoring:

  const currentBatterySupportsEnergyMonitoring = () => {
    const batteryId = getCurrentBatteryId();
    if (!batteryId) return false;

    // Pack Controller doesn't support energy monitoring
    if (batteryId === "0700" || batteryId === "PACK-CONTROLLER") return false;

    // All other batteries should support energy monitoring
    return true;
  };
  // Select battery by ID (helper function for Data Analytics)
  const selectBatteryById = (batteryId) => {
    // First check registered batteries
    let battery = userBatteries.find((b) => b.batteryId === batteryId);

    // If not found, check system batteries
    if (!battery) {
      battery = availableSystemBatteries.find((b) => b.id === batteryId);
    }

    if (battery) {
      setSelectedBattery(battery);
      localStorage.setItem("selectedBatteryId", batteryId);
      console.log("[BatteryContext] Selected battery by ID:", batteryId);
    }
  };

  // Effect to restore selected battery from localStorage
  useEffect(() => {
    if (
      (userBatteries.length > 0 || availableSystemBatteries.length > 0) &&
      !selectedBattery
    ) {
      const savedBatteryId = localStorage.getItem("selectedBatteryId");
      if (savedBatteryId) {
        // Check registered batteries first
        let savedBattery = userBatteries.find(
          (b) => b.batteryId === savedBatteryId
        );

        // If not found, check system batteries
        if (!savedBattery) {
          savedBattery = availableSystemBatteries.find(
            (b) => b.id === savedBatteryId
          );
        }

        if (savedBattery) {
          setSelectedBattery(savedBattery);
          return;
        }
      }

      // If no saved battery or saved battery not found, select first available
      if (userBatteries.length > 0) {
        setSelectedBattery(userBatteries[0]);
      } else if (availableSystemBatteries.length > 0) {
        setSelectedBattery(availableSystemBatteries[0]);
      }
    }
  }, [userBatteries, availableSystemBatteries]);

  // Get batteries formatted for dropdown (combines registered and system batteries)
  const getBatteryOptions = () => {
    const registeredOptions = userBatteries.map(formatBatteryForDisplay);

    // Add system batteries that aren't already registered
    const systemOptions = availableSystemBatteries
      .filter(
        (sysBattery) =>
          !userBatteries.find(
            (userBattery) => userBattery.batteryId === sysBattery.id
          )
      )
      .map((sysBattery) => ({
        value: sysBattery.id,
        label: sysBattery.displayName || sysBattery.name,
        type: sysBattery.type,
        isSystemBattery: true,
      }));

    return [...registeredOptions, ...systemOptions];
  };

  // Get all available batteries for Data Analytics (formatted for the dropdown)
  const getAllAvailableBatteries = () => {
    const allBatteries = [];

    // Add registered batteries
    userBatteries.forEach((battery) => {
      allBatteries.push({
        id: battery.batteryId,
        name:
          battery.nickname ||
          battery.serialNumber ||
          `Battery ${battery.batteryId}`,
        type: detectBatteryType(battery.batteryId),
        source: "registered",
        displayName: `${battery.nickname || battery.serialNumber} (${
          battery.batteryId
        })`,
        isActive: battery.isActive,
      });
    });

    // Add system batteries that aren't registered
    availableSystemBatteries.forEach((battery) => {
      const isAlreadyRegistered = userBatteries.find(
        (userBat) => userBat.batteryId === battery.id
      );
      if (!isAlreadyRegistered) {
        allBatteries.push({
          id: battery.id,
          name: battery.name,
          type: battery.type,
          source: "system",
          displayName: battery.displayName,
          isActive: battery.isActive,
          lastSeen: battery.lastSeen,
        });
      }
    });

    return allBatteries;
  };

  // Check if user has access to a specific battery
  const checkBatteryAccess = async (batteryId) => {
    return await validateBatteryAccess(batteryId);
  };

  // Refresh batteries (useful after registration)
  const refreshBatteries = () => {
    loadUserBatteries();
    loadAvailableSystemBatteries();
  };

  // Get current battery ID for API calls
  const getCurrentBatteryId = () => {
    if (!selectedBattery) return null;
    return selectedBattery.batteryId || selectedBattery.id;
  };

  // Get current battery's tag ID format (for your existing API calls)
  const getCurrentBatteryTagId = () => {
    const batteryId = getCurrentBatteryId();
    if (!batteryId) return null;

    // For pack controller, return as-is
    if (batteryId === "0700") return batteryId;

    // Convert from "0x440" format to "BAT-0x440" format if needed
    return batteryId.startsWith("BAT-") ? batteryId : `BAT-${batteryId}`;
  };

  const contextValue = {
    // State
    userBatteries,
    availableSystemBatteries,
    selectedBattery,
    loading,
    error,
    hasRegisteredBatteries,
    batteryDiscoveryLoading,

    // Actions
    loadUserBatteries,
    loadAvailableSystemBatteries,
    selectBatteryWithValidation,
    selectBattery,
    selectBatteryById,
    refreshBatteries,
    checkBatteryAccess,

    // Helpers
    getBatteryDisplayInfo,
    currentBatterySupportsEnergyMonitoring,
    getBatteryOptions,
    getAllAvailableBatteries,
    getCurrentBatteryId,
    getCurrentBatteryTagId,

    // Computed values
    selectedBatteryDisplayInfo: getBatteryDisplayInfo(),
    supportsEnergyMonitoring: currentBatterySupportsEnergyMonitoring(),
    selectedBatteryId:
      selectedBattery?.batteryId || selectedBattery?.id || null,
    selectedBatteryNickname:
      selectedBattery?.nickname || selectedBattery?.name || null,
    batteryCount: userBatteries.length,
    systemBatteryCount: availableSystemBatteries.length,
    totalAvailableBatteries:
      userBatteries.length +
      availableSystemBatteries.filter(
        (sysBattery) =>
          !userBatteries.find(
            (userBattery) => userBattery.batteryId === sysBattery.id
          )
      ).length,
  };

  return (
    <BatteryContext.Provider value={contextValue}>
      {children}
    </BatteryContext.Provider>
  );
};
