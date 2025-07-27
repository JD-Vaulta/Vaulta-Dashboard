import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/common/LoadingSpinner.js";
import KeyInsights from "./components/views/KeyInsights.js";
import HourlyChart from "./components/views/HourlyChart.js";
import DailySummary from "./components/views/DailySummary.js";
import SectionNavigation from "./components/widgets/SectionNavigation.js";
import { useEnergyData } from "./hooks/useEnergyData.js";

const EnergyMonitorPage = ({
  bmsData,
  lambdaResponse,
  selectedBattery,
  onRefreshLambdaData, // New prop to trigger lambda data refresh
}) => {
  const [activeSection, setActiveSection] = useState("keyInsights");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentLambdaData, setCurrentLambdaData] = useState(lambdaResponse);
  const [lastSelectedBattery, setLastSelectedBattery] =
    useState(selectedBattery);

  const { loading, processedData } = useEnergyData(bmsData, currentLambdaData);

  // Handle battery change and refresh lambda data
  const handleBatteryChange = useCallback(async () => {
    if (
      selectedBattery &&
      selectedBattery !== lastSelectedBattery &&
      onRefreshLambdaData
    ) {
      console.log(
        `Energy Monitor: Battery changed from ${lastSelectedBattery} to ${selectedBattery}`
      );

      setIsRefreshing(true);
      try {
        // Call parent function to refresh lambda data for new battery
        const newLambdaData = await onRefreshLambdaData(selectedBattery);
        setCurrentLambdaData(newLambdaData);
        setLastSelectedBattery(selectedBattery);

        console.log(
          "Energy Monitor: Lambda data refreshed for battery:",
          selectedBattery
        );
      } catch (error) {
        console.error("Energy Monitor: Failed to refresh lambda data:", error);
        // Keep current data on error
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [selectedBattery, lastSelectedBattery, onRefreshLambdaData]);

  // Effect to handle battery changes
  useEffect(() => {
    handleBatteryChange();
  }, [handleBatteryChange]);

  // Update current lambda data when prop changes
  useEffect(() => {
    if (lambdaResponse && !isRefreshing) {
      setCurrentLambdaData(lambdaResponse);
    }
  }, [lambdaResponse, isRefreshing]);

  const LoadingScreen = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <LoadingSpinner />
        <h2 style={{ marginTop: "20px", color: "#1259c3" }}>
          Loading energy data...
        </h2>
      </div>
    </div>
  );

  const RefreshingOverlay = () => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        borderRadius: "15px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <LoadingSpinner />
        <p style={{ marginTop: "10px", color: "#1259c3", fontWeight: "500" }}>
          Updating data for Battery {selectedBattery}...
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
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

  // Show loading screen only on initial load
  if (loading && !currentLambdaData) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      <div style={{ padding: "20px" }}>
        {/* Battery info header */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "15px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#1259c3" }}>
            Energy Monitor - Battery {selectedBattery || "Unknown"}
          </h2>
          {isRefreshing && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <LoadingSpinner />
              <span style={{ color: "#1259c3", fontSize: "14px" }}>
                Refreshing...
              </span>
            </div>
          )}
        </div>

        <SectionNavigation
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <div style={{ position: "relative" }}>
          {renderContent()}
          {isRefreshing && <RefreshingOverlay />}
        </div>
      </div>
    </div>
  );
};

export default EnergyMonitorPage;
