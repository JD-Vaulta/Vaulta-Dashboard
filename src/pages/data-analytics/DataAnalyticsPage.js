import React, { useState, useCallback, useEffect } from "react";
import DataViewer from "./components/DataViewer.js";
import { fetchData, testBatteryConnection, detectBatteryType } from "../../queries.js";

// Battery Registration Integration
import BatterySelector from "../../components/common/BatterySelector.js";
import { useBatteryContext } from "../../contexts/BatteryContext.js";

// Updated color scheme
const colors = {
  edward: "#adaead",
  heavyMetal: "#1a1b1a",
  desertStorm: "#eaeae8",
  atlantis: "#87c842",
  stormDust: "#636362",
  thunderbird: "#bf1c1b",
  grannySmith: "#b8e09f",
  ghost: "#cbccd4",
  // Main usage colors
  primary: "#636362", // storm-dust
  secondary: "#adaead", // edward
  background: "rgba(234,234,232,0.1)", // desert-storm with opacity
  backgroundSolid: "#eaeae8", // desert-storm solid
  textDark: "#1a1b1a", // heavy-metal
  textLight: "#636362", // storm-dust
  accent: "#87c842", // atlantis
  error: "#bf1c1b", // thunderbird
};

const DataAnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1hour");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: "" });
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [selectedBatteryType, setSelectedBatteryType] = useState("BMS"); // Track battery type
  const [selectedDeviceId, setSelectedDeviceId] = useState(""); // Track selected device ID (for PackController or BMS)

  // Battery Registration Integration - Enhanced with dynamic discovery
  const { 
    getAllAvailableBatteries, 
    selectBatteryById, 
    getCurrentBatteryId, 
    selectedBattery, 
    hasRegisteredBatteries, 
    batteryDiscoveryLoading,
    availableSystemBatteries,
    loadAvailableSystemBatteries
  } = useBatteryContext();

  // Get dynamic battery list
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [batteriesLoading, setBatteriesLoading] = useState(true);

  // Load available batteries on component mount
  useEffect(() => {
    const loadBatteries = async () => {
      try {
        setBatteriesLoading(true);
        
        // Get all available batteries from context
        const allBatteries = getAllAvailableBatteries();
        
        // If no batteries found, try to refresh the discovery
        if (allBatteries.length === 0 && !batteryDiscoveryLoading) {
          console.log('No batteries found, refreshing discovery...');
          await loadAvailableSystemBatteries();
          // Get batteries again after refresh
          const refreshedBatteries = getAllAvailableBatteries();
          setAvailableBatteries(refreshedBatteries);
        } else {
          setAvailableBatteries(allBatteries);
        }
        
        console.log('Loaded available batteries:', allBatteries);
      } catch (error) {
        console.error('Error loading batteries:', error);
        setError('Failed to load available batteries');
      } finally {
        setBatteriesLoading(false);
      }
    };

    loadBatteries();
  }, [getAllAvailableBatteries, batteryDiscoveryLoading, loadAvailableSystemBatteries]);

  // Update available batteries when system batteries change
  useEffect(() => {
    if (!batteryDiscoveryLoading) {
      const allBatteries = getAllAvailableBatteries();
      setAvailableBatteries(allBatteries);
      console.log('Updated available batteries:', allBatteries);
    }
  }, [availableSystemBatteries, batteryDiscoveryLoading, getAllAvailableBatteries]);

  const timeRanges = [
    { label: "Last 1 Minute", value: "1min" },
    { label: "Last 5 Minutes", value: "5min" },
    { label: "Last 1 Hour", value: "1hour" },
    { label: "Last 8 Hours", value: "8hours" },
    { label: "Last 1 Day", value: "1day" },
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 1 Month", value: "1month" },
  ];

  // Main data fetching function
  const handleFetchData = useCallback(async () => {
    // For PackController, use selectedDeviceId. For BMS, use battery context
    let currentBatteryId;
    if (selectedBatteryType === 'PACK_CONTROLLER') {
      currentBatteryId = selectedDeviceId; // This should be "0700"
    } else {
      currentBatteryId = getCurrentBatteryId();
    }
    
    if (!currentBatteryId) {
      setError("Please select a battery/controller to analyze");
      return;
    }

    // Keep the "0x" prefix - don't remove it
    const tagId = currentBatteryId;

    // Detect battery type for logging
    const batteryType = detectBatteryType(tagId);
    setSelectedBatteryType(batteryType);

    setLoading(true);
    setError(null);
    setLoadingProgress({ current: 0, total: 0, message: "Initializing..." });
    setHasStartedAnalysis(true);

    try {
      console.log("=== FETCH DATA DEBUG ===");
      console.log("Selected Device ID:", selectedDeviceId);
      console.log("Selected Battery Type:", selectedBatteryType);
      console.log("Current Battery ID:", currentBatteryId);
      console.log("tagId being passed to fetchData:", tagId);
      console.log("Detected battery type:", batteryType);
      console.log("Selected time range:", selectedTimeRange);
      console.log("Available batteries:", availableBatteries);
      console.log("========================");
      
      // Create progress callback for progressive plotting
      const progressCallback = (progress) => {
        setLoadingProgress(progress);
        
        // Progressive plotting: Update display with partial data as it comes in
        if (progress.partialData) {
          setData(progress.partialData);
        }
      };
      
      const fetchedData = await fetchData(tagId, selectedTimeRange, progressCallback);
      setData(fetchedData);
      setLoadingProgress({ current: 100, total: 100, message: "Complete!" });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
      setLoadingProgress({ current: 0, total: 0, message: "" });
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId, selectedBatteryType, getCurrentBatteryId, selectedTimeRange, availableBatteries]);

  // Handle battery change without refresh - updated for dynamic batteries
  const handleBatteryChange = useCallback(async (newBatteryId) => {
    if (!newBatteryId) return;
    
    try {
      // Detect battery type
      const batteryType = detectBatteryType(newBatteryId);
      setSelectedBatteryType(batteryType);
      setSelectedDeviceId(newBatteryId); // Always set the device ID
      
      console.log("=== BATTERY CHANGE DEBUG ===");
      console.log("New Battery ID:", newBatteryId);
      console.log("Detected Battery Type:", batteryType);
      console.log("Set Device ID to:", newBatteryId);
      console.log("Available batteries:", availableBatteries);
      console.log("============================");
      
      // Update battery context only for BMS batteries
      if (batteryType === 'BMS') {
        selectBatteryById(newBatteryId);
      }
      
      // Auto-fetch data for new battery if we've already started analysis
      if (hasStartedAnalysis) {
        // Clear current data to show loading state
        setData(null);
        setError(null);
        
        // Small delay to allow context to update
        setTimeout(() => {
          handleFetchData();
        }, 100);
      }
    } catch (error) {
      console.error("Error changing battery:", error);
      setError("Failed to switch battery. Please try again.");
    }
  }, [hasStartedAnalysis, handleFetchData, selectBatteryById, availableBatteries]);

  // Handle time range change without refresh
  const handleTimeRangeChange = useCallback(async (newTimeRange) => {
    setSelectedTimeRange(newTimeRange);
    
    // Auto-fetch data for new time range if we've already started analysis
    if (hasStartedAnalysis) {
      // Clear current data to show loading state
      setData(null);
      setError(null);
      
      // Small delay to allow state to update
      setTimeout(() => {
        handleFetchData();
      }, 100);
    }
  }, [hasStartedAnalysis, handleFetchData]);

  const handleTestConnection = async () => {
    let currentBatteryId;
    if (selectedBatteryType === 'PACK_CONTROLLER') {
      currentBatteryId = selectedDeviceId;
    } else {
      currentBatteryId = getCurrentBatteryId();
    }
    
    if (!currentBatteryId) {
      console.log("No battery/controller selected for testing");
      return;
    }
    
    await testBatteryConnection(currentBatteryId);
  };

  // Refresh batteries function
  const handleRefreshBatteries = async () => {
    setBatteriesLoading(true);
    try {
      await loadAvailableSystemBatteries();
      const refreshedBatteries = getAllAvailableBatteries();
      setAvailableBatteries(refreshedBatteries);
      console.log('Refreshed batteries:', refreshedBatteries);
    } catch (error) {
      console.error('Error refreshing batteries:', error);
      setError('Failed to refresh batteries');
    } finally {
      setBatteriesLoading(false);
    }
  };

  // If we have started analysis or have data/loading/error, show the viewer
  if (hasStartedAnalysis) {
    // Determine the correct TagId to pass to DataViewer
    const currentTagId = selectedBatteryType === 'PACK_CONTROLLER' ? selectedDeviceId : getCurrentBatteryId();
    
    return (
      <DataViewer
        loading={loading}
        error={error}
        data={data}
        selectedTagId={currentTagId}
        onFetchData={handleFetchData}
        loadingProgress={loadingProgress}
        onBatteryChange={handleBatteryChange}
        onTimeRangeChange={handleTimeRangeChange}
        currentTimeRange={selectedTimeRange}
        batteryType={selectedBatteryType} // Pass battery type to DataViewer
        availableBatteries={availableBatteries} // Pass dynamic available batteries
      />
    );
  }

  // Show loading state while discovering batteries
  if (batteriesLoading || batteryDiscoveryLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: colors.backgroundSolid,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.primary}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "500px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "700",
                  color: colors.textDark,
                  margin: "0 0 16px 0",
                  letterSpacing: "0.5px",
                }}
              >
                Battery Data Analytics
              </h1>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: colors.textLight,
                  margin: 0,
                }}
              >
                Discovering available batteries in the system...
              </p>
            </div>

            {/* Loading Spinner */}
            <div
              style={{
                width: "50px",
                height: "50px",
                border: `4px solid ${colors.secondary}`,
                borderTop: `4px solid ${colors.accent}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px auto",
              }}
            />

            <div
              style={{
                textAlign: "center",
                padding: "20px",
                backgroundColor: colors.background,
                borderRadius: "8px",
                border: `1px solid ${colors.secondary}`,
              }}
            >
              <p
                style={{
                  fontSize: "1rem",
                  color: colors.textDark,
                  margin: "0 0 8px 0",
                  fontWeight: "600",
                }}
              >
                🔍 Scanning for batteries...
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: colors.textLight,
                  margin: 0,
                  lineHeight: "1.4",
                }}
              >
                Checking for BMS batteries and Pack Controllers in the system
              </p>
            </div>

            {/* CSS for spinner animation */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  // Initial state - show selection interface
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: colors.backgroundSolid,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.primary}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "500px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                color: colors.textDark,
                margin: "0 0 16px 0",
                letterSpacing: "0.5px",
              }}
            >
              Battery Data Analytics
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: colors.textLight,
                margin: 0,
              }}
            >
              Select time range to analyze your battery performance with progressive loading
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "30px",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    color: colors.textDark,
                    marginBottom: "8px",
                    display: "block",
                    fontWeight: "600",
                  }}
                >
                  Selected Battery:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Dynamic battery selector */}
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      handleBatteryChange(selectedId);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: `2px solid ${colors.secondary}`,
                      fontSize: "1rem",
                      backgroundColor: "#fff",
                      minWidth: "200px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select Battery/Controller</option>
                    {availableBatteries.map((battery) => (
                      <option key={battery.id} value={battery.id}>
                        {battery.displayName} ({battery.type === 'PACK_CONTROLLER' ? 'Controller' : 'Battery'})
                      </option>
                    ))}
                  </select>
                  
                  {/* Refresh batteries button */}
                  <button
                    onClick={handleRefreshBatteries}
                    disabled={batteriesLoading}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: colors.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: batteriesLoading ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      opacity: batteriesLoading ? 0.6 : 1,
                    }}
                    title="Refresh available batteries"
                  >
                    {batteriesLoading ? "⟲" : "🔄"}
                  </button>
                </div>
                
                {/* Battery discovery info */}
                {availableBatteries.length > 0 && (
                  <div style={{ 
                    marginTop: "8px", 
                    fontSize: "0.8rem", 
                    color: colors.textLight,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>✅ Found {availableBatteries.length} available device{availableBatteries.length !== 1 ? 's' : ''}</span>
                    <span style={{ 
                      backgroundColor: colors.accent, 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: "8px", 
                      fontSize: "0.7rem",
                      fontWeight: "600"
                    }}>
                      DYNAMIC
                    </span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: "250px" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    color: colors.textDark,
                    marginBottom: "8px",
                    display: "block",
                    fontWeight: "600",
                  }}
                >
                  Time Period:
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: `2px solid ${colors.secondary}`,
                    width: "100%",
                    fontSize: "1rem",
                    color: colors.textDark,
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleFetchData}
                  disabled={!selectedDeviceId && !selectedBattery}
                  style={{
                    padding: "16px 32px",
                    backgroundColor: (selectedDeviceId || selectedBattery) ? colors.accent : colors.secondary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: (selectedDeviceId || selectedBattery) ? "pointer" : "not-allowed",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    transition: "all 0.3s ease",
                    boxShadow: (selectedDeviceId || selectedBattery) ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    opacity: (selectedDeviceId || selectedBattery) ? 1 : 0.6,
                  }}
                  onMouseOver={(e) => {
                    if (selectedDeviceId || selectedBattery) {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedDeviceId || selectedBattery) {
                      e.target.style.backgroundColor = colors.accent;
                      e.target.style.transform = "translateY(0)";
                    }
                  }}
                >
                  Start Progressive Analysis
                </button>
                
                {(selectedDeviceId || selectedBattery) && (
                  <button
                    onClick={handleTestConnection}
                    style={{
                      padding: "16px 24px",
                      backgroundColor: colors.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = colors.textDark;
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    Test Connection
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "20px",
                backgroundColor: colors.background,
                borderRadius: "8px",
                border: `1px solid ${colors.secondary}`,
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: colors.textDark,
                  margin: "0 0 8px 0",
                }}
              >
                ⚡ Progressive Features:
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  🔍 <strong>Dynamic Discovery</strong> - Automatically finds available batteries and controllers
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  📊 <strong>Real-time plotting</strong> - Charts update as data loads
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  🔄 <strong>Dynamic controls</strong> - Switch battery/time range without refresh
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  ⚡ <strong>Smart sampling</strong> - Optimized for performance with large datasets
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  📈 <strong>Progressive loading</strong> - See results immediately, no waiting
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: colors.textLight,
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  🎛️ <strong>Multi-type support</strong> - BMS batteries and Pack Controller
                </p>
              </div>
            </div>

            {selectedDeviceId && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  backgroundColor: selectedBatteryType === 'PACK_CONTROLLER' ? "#e8f0ff" : "#e8f5e8",
                  borderRadius: "8px",
                  border: `1px solid ${selectedBatteryType === 'PACK_CONTROLLER' ? '#4169E1' : colors.accent}`,
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: selectedBatteryType === 'PACK_CONTROLLER' ? '#4169E1' : colors.accent,
                    margin: "0 0 4px 0",
                    fontWeight: "600",
                  }}
                >
                  Ready for progressive analysis:
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: colors.textDark,
                    margin: 0,
                    fontWeight: "600",
                    fontFamily: "monospace",
                  }}
                >
                  {(() => {
                    const battery = availableBatteries.find(b => b.id === selectedDeviceId);
                    return battery ? battery.displayName : selectedDeviceId;
                  })()}
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: colors.textLight,
                    margin: "4px 0 0 0",
                    fontStyle: "italic",
                  }}
                >
                  {selectedBatteryType === 'PACK_CONTROLLER' 
                    ? 'System-level metrics: Temperature, Voltage, SOC, SOH, Carbon Offset'
                    : 'Cell-level analysis: Individual cells, temperatures, balancing data'
                  }
                </p>
                
                {/* Show if this is a dynamically discovered battery */}
                {(() => {
                  const battery = availableBatteries.find(b => b.id === selectedDeviceId);
                  return battery && battery.source === 'system' && (
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ 
                        backgroundColor: colors.accent, 
                        color: "white", 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "0.7rem",
                        fontWeight: "600"
                      }}>
                        DISCOVERED DYNAMICALLY
                      </span>
                      {battery.lastSeen && (
                        <p style={{
                          fontSize: "0.7rem",
                          color: colors.textLight,
                          margin: "4px 0 0 0",
                        }}>
                          Last seen: {battery.lastSeen.toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPage;