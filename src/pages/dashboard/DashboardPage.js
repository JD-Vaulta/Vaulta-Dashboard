import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";

import MainView from "./components/views/MainView.js";
import CellView from "./components/views/CellView.js";
import InstallationView from "./components/views/InstallationView.js";
import LoadingSpinner from "./components/shared/LoadingSpinner.js";

// Pack Controller Components
import PackControllerView from "./components/views/PackControllerView.js";
import PackControllerStatusCards from "./components/widgets/PackControllerStatusCards.js";
import PackControllerGauges from "./components/widgets/PackControllerGauges.js";
import PackControllerAlarms from "./components/widgets/PackControllerAlarms.js";
import PackControllerSystemMetrics from "./components/widgets/PackControllerSystemMetrics.js";
import PackControllerAlarmHistory from "./components/widgets/PackControllerAlarmHistory.js";

// Battery Registration Integration
import BatterySelector from "../../components/common/BatterySelector.js";
import { useBatteryContext } from "../../contexts/BatteryContext.js";

import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "../../aws-exports.js";
import { getLatestReading, getLatestPackControllerReading } from "../../queries.js";

const DashboardPage = ({
  bmsData,
  activeSection = "system",
}) => {
  const [bmsState, setBmsState] = useState(null);
  const [packControllerState, setPackControllerState] = useState(null);
  const [dataType, setDataType] = useState("battery"); // "battery" or "packcontroller"
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [alarmNotifications, setAlarmNotifications] = useState([]); // Added for alarm notifications
  const metricsContainerRef = useRef(null);

  // Battery Registration Integration
  const { getCurrentBatteryTagId, selectedBattery, hasRegisteredBatteries } = useBatteryContext();

  // Check for mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshIntervalRef = useRef(null);

  // Handle new alarm notifications
  const handleNewAlarm = useCallback((alarm) => {
    // Create notification
    const notification = {
      id: Date.now() + Math.random(),
      alarm,
      timestamp: new Date(),
    };

    setAlarmNotifications(prev => [...prev, notification]);

    // Show toast notification
    toast.error(
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: "20px", marginRight: "8px" }}>
          {alarm.severity === "critical" ? "🚨" : "⚠️"}
        </span>
        <div>
          <strong>{alarm.description}</strong>
          <br />
          <small>Severity: {alarm.severity.toUpperCase()}</small>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: alarm.severity === "critical" ? false : 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: `alarm-${alarm.key}`, // Prevent duplicate notifications
      }
    );
  }, []);

  // Function to fetch the latest data based on data type
  const fetchLatestData = useCallback(async () => {
    try {
      if (!isInitialLoad) {
        setIsUpdating(true);
      }

      const session = await fetchAuthSession();
      const credentials = session.credentials;

      const docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        region: awsconfig.region,
        credentials,
      });

      if (dataType === "packcontroller") {
        // Fetch PackController data
        console.log("Fetching PackController data");
        const deviceId = "PACK-CONTROLLER"; // Use the actual device ID from your data
        const latestReading = await getLatestPackControllerReading(docClient, deviceId);

        if (latestReading) {
          console.log("Latest PackController reading received:", latestReading);
          setPackControllerState(latestReading);
          setLastUpdateTime(new Date());
        } else {
          console.warn("No PackController data available");
          if (isInitialLoad) {
            toast.error(
              "No pack controller data available. Please check the connection.",
              {
                autoClose: 5000,
                toastId: "no-packcontroller-data-error",
              }
            );
          }
        }
      } else {
        // Fetch Battery data
        const currentBatteryTagId = getCurrentBatteryTagId();
        
        if (!currentBatteryTagId) {
          console.warn("No battery selected");
          return;
        }

        console.log("Fetching data for battery:", currentBatteryTagId);
        const latestReading = await getLatestReading(docClient, currentBatteryTagId);

        if (latestReading) {
          console.log("Latest reading received:", latestReading);
          setBmsState(latestReading);
          setLastUpdateTime(new Date());
        } else {
          console.warn("No new data available");
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
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);

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
  }, [isInitialLoad, getCurrentBatteryTagId, dataType]);

  // Handle data type change
  const handleDataTypeChange = (newDataType) => {
    console.log("Data type changed to:", newDataType);
    setDataType(newDataType);
    setIsInitialLoad(true);
    
    // Clear previous data
    if (newDataType === "packcontroller") {
      setBmsState(null);
    } else {
      setPackControllerState(null);
    }
  };

  // Set initial data from props (for battery data only)
  useEffect(() => {
    console.log("bmsData:", bmsData);
    if (
      dataType === "battery" &&
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
      console.log("No initial data in props, fetching...");
      // Fetch data based on data type and availability
      if ((dataType === "battery" && hasRegisteredBatteries) || dataType === "packcontroller") {
        fetchLatestData();
      }
    }
  }, [bmsData, fetchLatestData, hasRegisteredBatteries, dataType]);

  // Fetch data when battery selection changes (only for battery data type)
  useEffect(() => {
    if (dataType === "battery" && selectedBattery && isInitialLoad && hasRegisteredBatteries) {
      console.log("Battery changed to:", selectedBattery.batteryId);
      setIsInitialLoad(true);
      setBmsState(null);
      fetchLatestData();
    }
  }, [selectedBattery, fetchLatestData, hasRegisteredBatteries, dataType]);

  // Fetch data when data type changes
  useEffect(() => {
    if (dataType === "packcontroller" || (dataType === "battery" && hasRegisteredBatteries)) {
      fetchLatestData();
    }
  }, [dataType, fetchLatestData, hasRegisteredBatteries]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!isInitialLoad && (
      (dataType === "battery" && hasRegisteredBatteries) || 
      dataType === "packcontroller"
    )) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLatestData();
      }, 20000); // 20 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchLatestData, isInitialLoad, hasRegisteredBatteries, dataType]);

  const roundValue = (value) => {
    if (value === null || value === undefined || value === "NaN") {
      return "0.00";
    }
    return parseFloat(value).toFixed(2);
  };

  // Helper function to safely access data values
  const getDataValue = (field) => {
    const currentState = dataType === "packcontroller" ? packControllerState : bmsState;
    
    if (!currentState || !field) return "0.00";

    if (currentState[field]?.N !== undefined) {
      return currentState[field].N;
    }

    if (currentState[field] !== undefined) {
      return currentState[field];
    }

    return "0.00";
  };

  // Show loading spinner during initial load
  const shouldShowLoading = isInitialLoad || 
    (dataType === "battery" && (!bmsState || !hasRegisteredBatteries)) ||
    (dataType === "packcontroller" && !packControllerState);

  if (shouldShowLoading) {
    return <LoadingSpinner />;
  }

  // Define professional color scheme
  const colors = {
    primary: "#2E7D32",
    secondary: "#66BB6A",
    accent: "#4CAF50",
    grey: "#757575",
    lightGrey: "#E0E0E0",
    darkGrey: "#424242",
    background: "#FAFAFA",
    white: "#FFFFFF",
    textDark: "#212121",
    textLight: "#757575",
    error: "#D32F2F",
    warning: "#F57C00",
    success: "#388E3C",
  };

  // Manual refresh button component
  const RefreshButton = () => (
    <button
      onClick={fetchLatestData}
      disabled={isUpdating}
      style={{
        padding: "8px 16px",
        backgroundColor: isUpdating ? colors.lightGrey : colors.white,
        color: isUpdating ? colors.grey : colors.primary,
        border: `1px solid ${isUpdating ? colors.lightGrey : colors.primary}`,
        borderRadius: "4px",
        cursor: isUpdating ? "not-allowed" : "pointer",
        fontWeight: "500",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease",
        minWidth: "120px",
      }}
      onMouseEnter={(e) => {
        if (!isUpdating) {
          e.target.style.backgroundColor = colors.primary;
          e.target.style.color = colors.white;
        }
      }}
      onMouseLeave={(e) => {
        if (!isUpdating) {
          e.target.style.backgroundColor = colors.white;
          e.target.style.color = colors.primary;
        }
      }}
    >
      {isUpdating ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              border: `2px solid ${colors.grey}`,
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

  // Generate node data for battery view
  const nodeData = dataType === "battery" ? [
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
  ] : [];

  const renderContent = () => {
    if (dataType === "packcontroller") {
      return (
        <PackControllerView
          packControllerState={packControllerState}
          roundValue={roundValue}
          colors={colors}
          RefreshButton={RefreshButton}
          isMobile={isMobile}
          activeSection={activeSection}
          onNewAlarm={handleNewAlarm} // Pass the alarm handler
        />
      );
    }

    // Battery content
    switch (activeSection) {
      case "system":
        return (
          <MainView
            bmsState={bmsState}
            roundValue={roundValue}
            colors={colors}
            RefreshButton={RefreshButton}
            isMobile={isMobile}
            containerRef={metricsContainerRef}
          />
        );
      case "details":
        return (
          <CellView
            nodeData={nodeData}
            colors={colors}
            RefreshButton={RefreshButton}
            isMobile={isMobile}
          />
        );
      case "installations":
        return <InstallationView colors={colors} isMobile={isMobile} />;
      default:
        return (
          <MainView
            bmsState={bmsState}
            roundValue={roundValue}
            colors={colors}
            RefreshButton={RefreshButton}
            isMobile={isMobile}
            containerRef={metricsContainerRef}
          />
        );
    }
  };

  return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.background,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          overflow: "hidden",
        }}
      >
      <ToastContainer />

      {/* Secondary Header Bar */}
      <div
        style={{
          backgroundColor: colors.white,
          padding: "12px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${colors.lightGrey}`,
          minHeight: "50px",
        }}
      >
        <h2
          style={{
            color: colors.textDark,
            fontSize: "18px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          {dataType === "packcontroller" 
            ? (activeSection === "alarms" ? "Alarm History" : "Pack Controller Overview")
            : (activeSection === "system" && "System Overview") ||
              (activeSection === "details" && "Detailed View") ||
              (activeSection === "installations" && "Installations")}
        </h2>
        
        {/* Data Type and Battery Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Data Type Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {!isMobile && (
              <label
                style={{
                  color: colors.textDark,
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Data Type:
              </label>
            )}
            <select
              value={dataType}
              onChange={(e) => handleDataTypeChange(e.target.value)}
              style={{
                backgroundColor: colors.white,
                color: colors.textDark,
                border: `1px solid ${colors.lightGrey}`,
                borderRadius: "4px",
                fontSize: "14px",
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <option value="battery">Battery Data</option>
              <option value="packcontroller">Pack Controller</option>
            </select>
          </div>

          {/* Battery Selector - Only show for battery data type */}
          {dataType === "battery" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {!isMobile && (
                <label
                  style={{
                    color: colors.textDark,
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Battery:
                </label>
              )}
              <BatterySelector
                style={{
                  backgroundColor: colors.white,
                  color: colors.textDark,
                  border: `1px solid ${colors.lightGrey}`,
                  fontSize: "14px",
                  minWidth: "140px",
                }}
                showAddButton={false}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div 
          ref={metricsContainerRef}
          style={{ 
            height: "100%",
            maxHeight: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {renderContent()}
        </div>
      </div>

      {/* Add keyframe animation and global styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Ensure scrollbars are visible */
        * {
          scrollbar-width: thin;
          scrollbar-color: ${colors.grey} ${colors.lightGrey};
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: ${colors.lightGrey};
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: ${colors.grey};
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: ${colors.darkGrey};
        }
        
        /* System metrics scroll behavior */
        .metrics-container {
          display: grid;
          grid-template-columns: repeat(2, minmax(300px, 1fr));
          grid-template-rows: repeat(2, minmax(200px, 1fr));
          gap: 16px;
          padding: 8px;
          min-height: 420px;
        }
        
        @media (max-width: 1024px) {
          .metrics-container {
            grid-template-columns: minmax(300px, 1fr);
            grid-template-rows: repeat(4, minmax(180px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .metrics-container {
            grid-template-columns: minmax(280px, 1fr);
            grid-template-rows: repeat(4, minmax(160px, 1fr));
            overflow-x: auto;
          }
        }
        
        /* Prevent cards from shrinking below minimum */
        .metric-card {
          min-width: 280px;
          min-height: 160px;
        }
      `}</style>
    </div>
  );
};

DashboardPage.propTypes = {
  bmsData: PropTypes.object,
  activeSection: PropTypes.string,
};

export default DashboardPage;