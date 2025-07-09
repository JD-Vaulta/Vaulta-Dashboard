// Updated DashboardPage.js with navigation
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
  activeSection: initialActiveSection = "system",
}) => {
  const [bmsState, setBmsState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedBattery, setSelectedBattery] = useState("BAT-0x400");
  // Add state for controlling the active section
  const [activeSection, setActiveSection] = useState(initialActiveSection);

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

  // Define colors for consistent styling
  const colors = {
    primary: "#818181",
    secondary: "#c0c0c0",
    accentGreen: "#4CAF50",
    accentRed: "#F44336",
    accentBlue: "#2196F3",
    background: "rgba(192, 192, 192, 0.1)",
    textDark: "#333333",
    textLight: "#555555",
    highlight: "#FFC107",
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
          fontSize: "0.9rem",
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

  // Navigation component
  const Navigation = () => {
    const navItems = [
      { key: "system", label: "System Overview", icon: "📊" },
      { key: "tables", label: "Detailed View", icon: "📋" },
      { key: "installations", label: "Installations", icon: "🏭" },
    ];

    return (
      <div style={{ display: "flex", gap: "5px" }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            style={{
              padding: "8px 16px",
              backgroundColor:
                activeSection === item.key ? colors.accentBlue : "#ffffff",
              color: activeSection === item.key ? "#fff" : colors.textDark,
              border: `1px solid ${colors.secondary}`,
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "system":
        return (
          <MainView
            bmsState={bmsState}
            roundValue={roundValue}
            colors={colors}
            RefreshButton={RefreshButton}
          />
        );
      case "tables":
        return (
          <CellView
            nodeData={nodeData}
            colors={colors}
            RefreshButton={RefreshButton}
          />
        );
      case "installations":
        return <InstallationView />;
      default:
        return (
          <MainView
            bmsState={bmsState}
            roundValue={roundValue}
            colors={colors}
            RefreshButton={RefreshButton}
          />
        );
    }
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
          <Navigation />
        </div>
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
        {renderContent()}
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

DashboardPage.propTypes = {
  bmsData: PropTypes.object,
  activeSection: PropTypes.string,
};

export default DashboardPage;
