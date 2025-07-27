import React, { useState, useEffect } from "react";
import SystemHealthCheck from "./components/health/SystemHealthCheck.js";
import NotificationManager from "./components/notifications/NotificationManager.js";

const DiagnosticsPage = ({
  bmsData,
  user,
  selectedBattery,
  isLoadingData,
  onRefreshData, // New prop to trigger data refresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSelectedBattery, setLastSelectedBattery] =
    useState(selectedBattery);

  // Handle battery change and refresh data
  useEffect(() => {
    const handleBatteryChange = async () => {
      if (
        selectedBattery &&
        selectedBattery !== lastSelectedBattery &&
        onRefreshData
      ) {
        console.log(
          `Diagnostics: Battery changed from ${lastSelectedBattery} to ${selectedBattery}`
        );

        setIsRefreshing(true);
        try {
          await onRefreshData(selectedBattery);
          setLastSelectedBattery(selectedBattery);
          console.log(
            "Diagnostics: Data refreshed for battery:",
            selectedBattery
          );
        } catch (error) {
          console.error("Diagnostics: Failed to refresh data:", error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    handleBatteryChange();
  }, [selectedBattery, lastSelectedBattery, onRefreshData]);

  // Check if we have valid data
  const hasValidData =
    bmsData && bmsData.lastMinuteData && bmsData.lastMinuteData.length > 0;
  const currentData = hasValidData ? bmsData.lastMinuteData[0] : {};

  // Enhanced data validation
  const hasAnyData = currentData && Object.keys(currentData).length > 0;

  // Debug logging
  useEffect(() => {
    console.log("Diagnostics Debug:", {
      selectedBattery,
      hasBmsData: !!bmsData,
      hasLastMinuteData: !!bmsData?.lastMinuteData,
      lastMinuteDataLength: bmsData?.lastMinuteData?.length || 0,
      hasValidData,
      hasAnyData,
      currentDataKeys: Object.keys(currentData).length,
      isLoadingData,
      isRefreshing,
    });
  }, [
    bmsData,
    selectedBattery,
    hasValidData,
    hasAnyData,
    currentData,
    isLoadingData,
    isRefreshing,
  ]);

  const LoadingOverlay = () => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        borderRadius: "15px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #1259c3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "15px",
          }}
        />
        <p style={{ color: "#1259c3", fontWeight: "500", margin: 0 }}>
          Loading diagnostics for Battery {selectedBattery}...
        </p>
      </div>
    </div>
  );

  const NoDataMessage = () => (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "40px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        textAlign: "center",
        margin: "20px",
      }}
    >
      <div style={{ marginBottom: "20px", fontSize: "48px" }}>⚠️</div>
      <h3 style={{ color: "#666", marginBottom: "15px" }}>No Data Available</h3>
      <p style={{ color: "#888", marginBottom: "20px" }}>
        No diagnostic data found for Battery {selectedBattery || "Unknown"}.{" "}
        This could mean:
      </p>
      <ul
        style={{
          textAlign: "left",
          color: "#888",
          maxWidth: "500px",
          margin: "0 auto 20px auto",
          paddingLeft: "20px",
        }}
      >
        <li>The battery is not currently sending data</li>
        <li>The battery ID might be incorrect</li>
        <li>There's a connectivity issue</li>
        <li>No recent data (last minute) available</li>
      </ul>
      {onRefreshData && (
        <button
          onClick={() => onRefreshData(selectedBattery)}
          style={{
            backgroundColor: "#1259c3",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Retry Loading Data"}
        </button>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#818181",
            marginBottom: "20px",
            borderBottom: "1px solid #c0c0c0",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Battery Diagnostics - {selectedBattery || "Unknown"}</span>
          {(isLoadingData || isRefreshing) && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #f3f3f3",
                  borderTop: "2px solid #1259c3",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span style={{ fontSize: "0.9rem", color: "#1259c3" }}>
                {isRefreshing ? "Refreshing..." : "Loading..."}
              </span>
            </div>
          )}
        </h1>

        {/* Show loading overlay when refreshing */}
        {(isLoadingData || isRefreshing) && <LoadingOverlay />}

        {/* Show no data message if no valid data */}
        {!isLoadingData && !isRefreshing && !hasValidData && <NoDataMessage />}

        {/* Show diagnostics if we have data */}
        {!isLoadingData && !isRefreshing && hasValidData && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              padding: "10px",
              display: "flex",
              gap: "20px",
            }}
          >
            <SystemHealthCheck bmsData={bmsData} />
            <NotificationManager user={user} />
          </div>
        )}

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "5px 10px",
              borderRadius: "3px",
              fontSize: "10px",
              maxWidth: "300px",
              opacity: 0.8,
            }}
          >
            Debug: Battery={selectedBattery}, HasData={hasValidData}, Records=
            {bmsData?.lastMinuteData?.length || 0}, Loading={isLoadingData},
            Refreshing={isRefreshing}
          </div>
        )}
      </div>
    </>
  );
};

export default DiagnosticsPage;
