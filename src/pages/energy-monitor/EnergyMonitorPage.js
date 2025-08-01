import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import BatterySelector from "../../components/common/BatterySelector.js";
import KeyInsights from "./components/views/KeyInsights.js";
import HourlyChart from "./components/views/HourlyChart.js";
import DailySummary from "./components/views/DailySummary.js";
import { useEnergyData } from "./hooks/useEnergyData.js";
import { useBatteryContext } from "../../contexts/BatteryContext.js";
import { invokeLambdaFunction } from "../../calc/lastmonthdata.js";

const EnergyMonitorPage = ({ bmsData, lambdaResponse, activeSection }) => {
  const {
    selectedBatteryId,
    selectedBattery,
    loading: batteryContextLoading,
    getBatteryDisplayInfo,
  } = useBatteryContext();

  const [currentActiveSection, setCurrentActiveSection] = useState(
    activeSection || "keyInsights"
  );
  const [isLoadingNewBattery, setIsLoadingNewBattery] = useState(false);
  const [currentLambdaData, setCurrentLambdaData] = useState(lambdaResponse);
  const [lastProcessedBatteryId, setLastProcessedBatteryId] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const previousBatteryId = useRef(null);
  const isRefreshing = useRef(false);

  const {
    loading: energyDataLoading,
    processedData,
    hasData,
  } = useEnergyData(bmsData, currentLambdaData, selectedBatteryId);

  // Function to refresh lambda data for a specific battery
  const refreshLambdaForBattery = useCallback(async (batteryId) => {
    if (!batteryId || batteryId === "0700" || isRefreshing.current) {
      console.log(
        "Energy Monitor: Skipping lambda refresh - invalid battery or already refreshing"
      );
      return;
    }

    console.log(
      "Energy Monitor: Starting lambda refresh for battery:",
      batteryId
    );
    isRefreshing.current = true;
    setIsLoadingNewBattery(true);
    setRefreshError(null);

    try {
      // Extract the suffix for lambda function (remove BAT- prefix if present)
      const tagIdSuffix = batteryId.replace("BAT-", "").replace("0x", "0x");
      console.log(
        "Energy Monitor: Calling lambda with tagIdSuffix:",
        tagIdSuffix
      );

      const response = await invokeLambdaFunction(tagIdSuffix, "7days");
      console.log("Energy Monitor: Lambda response received:", response);

      setCurrentLambdaData(response);
      setLastProcessedBatteryId(batteryId);

      // Only hide loading after data is actually processed
      setIsLoadingNewBattery(false);
    } catch (error) {
      console.error("Energy Monitor: Lambda refresh failed:", error);
      setRefreshError(`Failed to load energy data: ${error.message}`);
      setTimeout(() => {
        setIsLoadingNewBattery(false);
        setRefreshError(null);
      }, 3000);
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // Track battery changes and trigger lambda refresh
  useEffect(() => {
    if (selectedBatteryId && selectedBatteryId !== previousBatteryId.current) {
      console.log(
        "Energy Monitor: Battery changed from",
        previousBatteryId.current,
        "to",
        selectedBatteryId
      );

      // Only refresh if we had a previous battery and it's different
      if (
        previousBatteryId.current !== null &&
        previousBatteryId.current !== selectedBatteryId
      ) {
        console.log(
          "Energy Monitor: Triggering lambda refresh for new battery"
        );
        refreshLambdaForBattery(selectedBatteryId);
      } else if (previousBatteryId.current === null) {
        // First time selection - check if we need to refresh
        console.log(
          "Energy Monitor: First battery selection, checking if refresh needed"
        );
        setLastProcessedBatteryId(selectedBatteryId);
      }

      previousBatteryId.current = selectedBatteryId;
    }
  }, [selectedBatteryId, refreshLambdaForBattery]);

  // Initialize with current lambda response
  useEffect(() => {
    if (lambdaResponse && !isLoadingNewBattery) {
      console.log("Energy Monitor: Updating current lambda data from props");
      setCurrentLambdaData(lambdaResponse);
    }
  }, [lambdaResponse, isLoadingNewBattery]);

  // Update active section when prop changes
  useEffect(() => {
    if (activeSection) {
      setCurrentActiveSection(activeSection);
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (currentActiveSection) {
      case "keyInsights":
        return (
          <KeyInsights
            data={processedData}
            bmsData={bmsData}
            lambdaResponse={currentLambdaData}
          />
        );
      case "hourlyAverages":
        return <HourlyChart data={processedData} />;
      case "dailySummary":
        return <DailySummary data={processedData} />;
      default:
        return (
          <KeyInsights
            data={processedData}
            bmsData={bmsData}
            lambdaResponse={currentLambdaData}
          />
        );
    }
  };

  // Show initial loading while battery context is loading
  if (batteryContextLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: "#fff",
          margin: "10px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "15px" }}>🔋</div>
        <h3 style={{ color: "#1259c3", marginBottom: "10px" }}>
          Initializing Energy Monitor...
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Loading battery information
        </p>
        <div
          style={{
            width: "150px",
            height: "3px",
            backgroundColor: "#f0f0f0",
            borderRadius: "2px",
            margin: "15px auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#4CAF50",
              animation: "slideRight 1.5s infinite",
            }}
          />
        </div>
        {/* Add CSS for animations */}
        <style>{`
          @keyframes slideRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    );
  }

  // Show Pack Controller message
  if (selectedBatteryId === "0700") {
    return (
      <div style={{ margin: "10px" }}>
        {/* Battery Selector */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "15px 20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            Battery Selection:
          </div>
          <BatterySelector
            style={{ minWidth: "180px" }}
            showAddButton={false}
            compact={true}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
          <h3 style={{ color: "#856404", margin: "0 0 15px 0" }}>
            Energy Data Not Available for Pack Controller
          </h3>
          <p
            style={{
              color: "#856404",
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.5",
            }}
          >
            Energy monitoring is only available for individual battery units.
            <br />
            Please select a battery (e.g., 0x440, 0x441) from the battery
            selector above to view energy consumption data.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show no battery selected message
  if (!selectedBatteryId) {
    return (
      <div style={{ margin: "10px" }}>
        {/* Battery Selector */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "15px 20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            Battery Selection:
          </div>
          <BatterySelector
            style={{ minWidth: "180px" }}
            showAddButton={false}
            compact={true}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: "#fff",
            padding: "40px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔋</div>
          <h3 style={{ color: "#666", marginBottom: "15px" }}>
            No Battery Selected
          </h3>
          <p style={{ color: "#888", fontSize: "16px", lineHeight: "1.5" }}>
            Please select a battery from the battery selector above to view
            energy monitoring data.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show loading for initial data load (no previous data exists)
  if (
    energyDataLoading &&
    !hasData &&
    !processedData?.last24Hours?.length &&
    !isLoadingNewBattery
  ) {
    const batteryDisplayInfo = getBatteryDisplayInfo();
    const displayName =
      batteryDisplayInfo?.displayName ||
      selectedBattery?.nickname ||
      selectedBattery?.name ||
      selectedBatteryId;

    return (
      <div style={{ margin: "10px" }}>
        {/* Battery Selector */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "15px 20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            Battery Selection:
          </div>
          <BatterySelector
            style={{ minWidth: "180px" }}
            showAddButton={false}
            compact={true}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: "#fff",
            padding: "40px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "15px" }}>📊</div>
          <h3 style={{ color: "#1259c3", marginBottom: "10px" }}>
            Loading Energy Data...
          </h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Preparing energy consumption data for <strong>{displayName}</strong>
          </p>
          <div
            style={{
              width: "200px",
              height: "4px",
              backgroundColor: "#f0f0f0",
              borderRadius: "2px",
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#4CAF50",
                animation: "slideRight 2s infinite",
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Main content area with data
  const batteryDisplayInfo = getBatteryDisplayInfo();
  const displayName =
    batteryDisplayInfo?.displayName ||
    selectedBattery?.nickname ||
    selectedBattery?.name ||
    selectedBatteryId;

  return (
    <div style={{ margin: "10px", position: "relative" }}>
      {/* Battery Selector */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "15px 20px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#666",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>
            Battery Selection:{" "}
            <strong style={{ color: "#1259c3" }}>{displayName}</strong>
          </span>

          {/* Loading indicator */}
          {isLoadingNewBattery && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "12px",
                color: "#856404",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid #ffc107",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              Loading energy data...
            </div>
          )}

          {/* Success indicator */}
          {hasData && !isLoadingNewBattery && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#d4edda",
                border: "1px solid #4CAF50",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "12px",
                color: "#155724",
              }}
            >
              <span style={{ color: "#4CAF50" }}>●</span>
              Energy data loaded
            </div>
          )}
        </div>

        {/* Add CSS for animations */}
        <style>{`
          @keyframes slideRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BatterySelector
            style={{ minWidth: "180px" }}
            showAddButton={false}
            compact={true}
          />
          <button
            onClick={() => refreshLambdaForBattery(selectedBatteryId)}
            disabled={
              isLoadingNewBattery ||
              !selectedBatteryId ||
              selectedBatteryId === "0700"
            }
            style={{
              padding: "6px 12px",
              backgroundColor: isLoadingNewBattery ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoadingNewBattery ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            {isLoadingNewBattery ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {refreshError && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "15px",
            color: "#d32f2f",
            fontSize: "14px",
          }}
        >
          {refreshError}
        </div>
      )}

      {/* Content - always fully visible */}
      <div>{renderContent()}</div>
    </div>
  );
};

export default EnergyMonitorPage;
