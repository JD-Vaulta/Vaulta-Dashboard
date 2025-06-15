import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";
import Cards from "./Cards.js";
import Gauges from "./Gauges.js";
import NodeTables from "./NodeTables.js";
import LoadingSpinner from "./LoadingSpinner.js";
import WeatherCard from "./WeatherCard.js";
import BatteryMetricsCarousel from "./BatteryMetricsCarousel.js";
import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "../../aws-exports.js";
import { getLatestReading } from "../../queries.js";

const Dashboard = ({ bmsData, activeSection = "system" }) => {
  const [bmsState, setBmsState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedBattery, setSelectedBattery] = useState("BAT-0x400");

  // Battery options for dropdown
  const batteryOptions = [
    { value: "BAT-0x400", label: "BAT-0x400" },
    { value: "BAT-0x440", label: "BAT-0x440" },
    { value: "BAT-0x480", label: "BAT-0x480" },
    { value: "Pack-Controller", label: "Pack-Controller" }
  ];

  // Refs for tracking components
  const batteryStatusRef = useRef(null);
  const batteryPerformanceRef = useRef(null);
  const weatherRef = useRef(null);
  const systemMetricsRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Function to fetch the latest data
  const fetchLatestData = useCallback(async () => {
    try {
      // Don't show updating state during initial load
      if (!isInitialLoad) {
        setIsUpdating(true);
      }

      // Get the AWS credentials
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      // Use DocumentClient for easier data handling
      const docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        region: awsconfig.region,
        credentials,
      });

      // Fetch only the latest reading for the selected battery
      const latestReading = await getLatestReading(docClient, selectedBattery);

      if (latestReading) {
        console.log("Latest reading received:", latestReading);
        setBmsState(latestReading);
        setLastUpdateTime(new Date());
      } else {
        console.warn("No new data available");

        // If no data on initial load, show error
        if (isInitialLoad) {
          toast.error(
            "No battery data available. Please check the connection.",
            {
              autoClose: 5000,
              toastId: "no-data-error",
            }
          );
        }
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);

      // Only show toast if not initial load
      if (!isInitialLoad) {
        toast.error("Failed to update latest data.", {
          autoClose: 3000,
          toastId: "update-error",
        });
      }
    } finally {
      setIsUpdating(false);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad, selectedBattery]);

  // Handle battery selection change
  const handleBatteryChange = (event) => {
    const newBattery = event.target.value;
    setSelectedBattery(newBattery);
    setIsInitialLoad(true); // Reset to show loading state
    setBmsState(null); // Clear current data
  };

  // Set initial data from props
  useEffect(() => {
    console.log("bmsData:", bmsData);
    if (
      bmsData &&
      bmsData.lastMinuteData &&
      bmsData.lastMinuteData.length > 0
    ) {
      console.log(
        "Setting initial bmsState from props:",
        bmsData.lastMinuteData[0]
      );
      setBmsState(bmsData.lastMinuteData[0]);
      setLastUpdateTime(new Date());
      setIsInitialLoad(false);
    } else {
      // If no initial data, fetch it
      console.log("No initial data in props, fetching...");
      fetchLatestData();
    }
  }, [bmsData, fetchLatestData]);

  // Fetch data when battery selection changes
  useEffect(() => {
    if (selectedBattery && isInitialLoad) {
      fetchLatestData();
    }
  }, [selectedBattery, isInitialLoad, fetchLatestData]);

  // Set up auto-refresh interval
  useEffect(() => {
    // Only start interval after initial load
    if (!isInitialLoad) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLatestData();
      }, 20000); // 20 seconds
    }

    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchLatestData, isInitialLoad]);

  const roundValue = (value) => {
    if (value === null || value === undefined || value === "NaN") {
      return "0.00";
    }
    return parseFloat(value).toFixed(2);
  };

  // Helper function to safely access data values
  const getDataValue = (field) => {
    if (!bmsState || !field) return "0.00";

    // If field has the .N property (DynamoDB format)
    if (bmsState[field]?.N !== undefined) {
      return bmsState[field].N;
    }

    // If field is directly a number or string
    if (bmsState[field] !== undefined) {
      return bmsState[field];
    }

    return "0.00";
  };

  const nodeData = [
    {
      node: "Node 00",
      data: {
        balanceStatus: roundValue(getDataValue("Node00BalanceStatus")),
        totalVoltage: roundValue(getDataValue("Node00TotalVoltage")),
        cellVoltages: Array.from({ length: 14 }, (_, i) =>
          roundValue(getDataValue(`Node00Cell${i < 10 ? `0${i}` : i}`))
        ),
        temperatures: Array.from({ length: 6 }, (_, i) =>
          roundValue(getDataValue(`Node00Temp${i < 10 ? `0${i}` : i}`))
        ),
        tempCount: roundValue(getDataValue("Node00TempCount")),
        numcells: roundValue(getDataValue("Node00CellCount")),
      },
    },
    {
      node: "Node 01",
      data: {
        balanceStatus: roundValue(getDataValue("Node01BalanceStatus")),
        totalVoltage: roundValue(getDataValue("Node01TotalVoltage")),
        cellVoltages: Array.from({ length: 14 }, (_, i) =>
          roundValue(getDataValue(`Node01Cell${i < 10 ? `0${i}` : i}`))
        ),
        temperatures: Array.from({ length: 6 }, (_, i) =>
          roundValue(getDataValue(`Node01Temp${i < 10 ? `0${i}` : i}`))
        ),
        tempCount: roundValue(getDataValue("Node01TempCount")),
        numcells: roundValue(getDataValue("Node01CellCount")),
      },
    },
  ];

  // Show loading spinner during initial load
  if (isInitialLoad || !bmsState) {
    return <LoadingSpinner />;
  }

  // Define colors for consistent styling
  const colors = {
    primary: "#818181", // Base gray
    secondary: "#c0c0c0", // Light gray
    accentGreen: "#4CAF50", // Vibrant green
    accentRed: "#F44336", // Strategic red
    accentBlue: "#2196F3", // Complementary blue
    background: "rgba(192, 192, 192, 0.1)",
    textDark: "#333333",
    textLight: "#555555",
    highlight: "#FFC107", // Accent yellow
  };

  // Manual refresh button component
  const RefreshButton = () => (
    <button
      onClick={fetchLatestData}
      disabled={isUpdating}
      style={{
        padding: "8px 16px",
        backgroundColor: isUpdating ? "#cccccc" : "#ffffff",
        color: colors.textDark,
        border: "none",
        borderRadius: "5px",
        cursor: isUpdating ? "not-allowed" : "pointer",
        fontWeight: "600",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
      }}
    >
      {isUpdating ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              border: "2px solid #333",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginRight: "6px",
            }}
          ></span>
          Updating...
        </>
      ) : (
        "Refresh Data"
      )}
    </button>
  );

  // Battery selector dropdown component
  const BatterySelector = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <label 
        htmlFor="battery-select" 
        style={{ 
          color: colors.textDark, 
          fontWeight: "600",
          fontSize: "0.9rem" 
        }}
      >
        Battery:
      </label>
      <select
        id="battery-select"
        value={selectedBattery}
        onChange={handleBatteryChange}
        style={{
          padding: "6px 12px",
          backgroundColor: "#ffffff",
          color: colors.textDark,
          border: `1px solid ${colors.secondary}`,
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "0.85rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          minWidth: "150px",
        }}
      >
        {batteryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#f2f2f2",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <ToastContainer />

      {/* Header Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "10px 20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${colors.secondary}`,
        }}
      >
        <h1
          style={{
            color: colors.textDark,
            fontSize: "1.5rem",
            fontWeight: "600",
            margin: 0,
          }}
        >
          System Overview
        </h1>
        <BatterySelector />
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          padding: "10px",
        }}
      >
        {activeSection === "system" ? (
          <>
            {/* Left Section - Combined Battery Status and Performance */}
            <div
              ref={batteryStatusRef}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "30%",
                minWidth: "300px",
                marginRight: "10px",
                gap: "10px",
              }}
            >
              {/* Battery Status Section */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "15px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  border: `1px solid ${colors.secondary}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h2
                    style={{
                      color: colors.textDark,
                      fontWeight: "600",
                      fontSize: "1.2rem",
                      margin: 0,
                    }}
                  >
                    Battery Status
                  </h2>
                  <RefreshButton />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    borderTop: `1px solid ${colors.secondary}`,
                    paddingTop: "15px",
                  }}
                >
                  <Cards
                    bmsState={bmsState}
                    roundValue={roundValue}
                    containerRef={batteryStatusRef}
                    colors={colors}
                  />
                </div>
              </div>

              {/* Battery Performance Section */}
              <div
                ref={batteryPerformanceRef}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "0px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${colors.secondary}`,
                }}
              >
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Gauges
                    bmsState={bmsState}
                    roundValue={roundValue}
                    containerRef={batteryPerformanceRef}
                    colors={colors}
                  />
                </div>
              </div>
            </div>

            {/* Right Section - Weather and System Metrics */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  gap: "10px",
                  minHeight: 0,
                }}
              >
                {/* Weather Card */}
                <div
                  ref={weatherRef}
                  style={{
                    flex: 0.35,
                    minWidth: 0,
                    minHeight: 0,
                  }}
                >
                  <WeatherCard city="Brisbane" containerRef={weatherRef} />
                </div>

                {/* System Metrics */}
                <div
                  ref={systemMetricsRef}
                  style={{
                    flex: 0.65,
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "15px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    border: `1px solid ${colors.secondary}`,
                  }}
                >
                  <h2
                    style={{
                      color: colors.textDark,
                      marginBottom: "15px",
                      fontWeight: "600",
                      fontSize: "1.2rem",
                      borderBottom: `1px solid ${colors.secondary}`,
                      paddingBottom: "5px",
                    }}
                  >
                    System Metrics
                  </h2>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <BatteryMetricsCarousel
                      bmsState={bmsState}
                      roundValue={roundValue}
                      containerRef={systemMetricsRef}
                      colors={colors}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Tables Section */
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              flex: 1,
              overflow: "hidden",
              border: `1px solid ${colors.secondary}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2
                style={{
                  color: colors.textDark,
                  fontWeight: "600",
                  fontSize: "1.2rem",
                  margin: 0,
                }}
              >
                Cell & Temperature Data
              </h2>
              <RefreshButton />
            </div>
            <div
              style={{
                flex: 1,
                borderTop: `1px solid ${colors.secondary}`,
                paddingTop: "15px",
              }}
            >
              <NodeTables nodeData={nodeData} colors={colors} />
            </div>
          </div>
        )}
      </div>

      {/* Add a keyframe animation for the spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

Dashboard.propTypes = {
  bmsData: PropTypes.object,
  activeSection: PropTypes.string,
};

export default Dashboard;