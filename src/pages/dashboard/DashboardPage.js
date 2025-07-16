import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";

import MainView from "./components/views/MainView.js";
import CellView from "./components/views/CellView.js";
import InstallationView from "./components/views/InstallationView.js";
import LoadingSpinner from "./components/shared/LoadingSpinner.js";

import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "../../aws-exports.js";
import { getLatestReading } from "../../queries.js";

const DashboardPage = ({
  bmsData,
  activeSection = "system", // Removed "initial" prefix, directly use the prop
}) => {
  const [bmsState, setBmsState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedBattery, setSelectedBattery] = useState("BAT-0x400");
  // Removed local activeSection state - now using prop directly
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const metricsContainerRef = useRef(null);

  // Check for mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Battery options for dropdown
  const batteryOptions = [
    { value: "BAT-0x400", label: "BAT-0x400" },
    { value: "BAT-0x440", label: "BAT-0x440" },
    { value: "BAT-0x480", label: "BAT-0x480" },
    { value: "Pack-Controller", label: "Pack-Controller" },
  ];

  const refreshIntervalRef = useRef(null);

  // Function to fetch the latest data
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

      const latestReading = await getLatestReading(docClient, selectedBattery);

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
  }, [isInitialLoad, selectedBattery]);

  // Handle battery selection change
  const handleBatteryChange = (event) => {
    const newBattery = event.target.value;
    setSelectedBattery(newBattery);
    setIsInitialLoad(true);
    setBmsState(null);
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
    if (!isInitialLoad) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLatestData();
      }, 20000); // 20 seconds
    }

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

    if (bmsState[field]?.N !== undefined) {
      return bmsState[field].N;
    }

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

  // Define professional color scheme
  const colors = {
    primary: "#2E7D32", // Professional green
    secondary: "#66BB6A", // Light green
    accent: "#4CAF50", // Accent green
    grey: "#757575", // Medium grey
    lightGrey: "#E0E0E0", // Light grey
    darkGrey: "#424242", // Dark grey
    background: "#FAFAFA", // Off-white background
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

  // Battery selector dropdown component
  const BatterySelector = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {!isMobile && (
        <label
          htmlFor="battery-select"
          style={{
            color: colors.textDark,
            fontWeight: "500",
            fontSize: "14px",
          }}
        >
          Battery:
        </label>
      )}
      <select
        id="battery-select"
        value={selectedBattery}
        onChange={handleBatteryChange}
        style={{
          padding: "8px 12px",
          backgroundColor: colors.white,
          color: colors.textDark,
          border: `1px solid ${colors.lightGrey}`,
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "400",
          fontSize: "14px",
          minWidth: "140px",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.lightGrey;
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

  // Navigation component - REMOVED since it's now in TopBanner
  // The navigation buttons are now handled by getSectionControls() in App.js

  const renderContent = () => {
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
      case "details": // Changed from "tables" to match App.js
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
          minHeight: "100vh",  // Changed from fixed positioning
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.background,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          overflow: "hidden",
        }}
      >
      <ToastContainer />

      {/* Secondary Header Bar - Only for battery selector */}
      <div
        style={{
          backgroundColor: colors.white,
          padding: "12px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${colors.lightGrey}`,
          minHeight: "50px", // Reduced height since navigation moved to TopBanner
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
          {activeSection === "system" && "System Overview"}
          {activeSection === "details" && "Detailed View"}
          {activeSection === "installations" && "Installations"}
        </h2>
        <BatterySelector />
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
          minHeight: 0,
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
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