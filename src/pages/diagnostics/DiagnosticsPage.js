import React, { useState, useEffect } from "react";
import SystemHealthCheck from "./components/health/SystemHealthCheck.js";
import NotificationManager from "./components/notifications/NotificationManager.js";
import BatterySelector from "../../components/common/BatterySelector.js";
import { useBatteryContext } from "../../contexts/BatteryContext.js";
import { getLatestReading, getLatestPackControllerReading } from "../../queries.js";
import { fetchAuthSession } from "aws-amplify/auth";

const DiagnosticsPage = ({ user }) => {
  const {
    selectedBattery,
    selectedBatteryId,
    loading: batteryLoading,
    error: batteryError
  } = useBatteryContext();

  const [bmsData, setBmsData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [lastSelectedBattery, setLastSelectedBattery] = useState(selectedBatteryId);

  // Create AWS SDK v2 DynamoDB DocumentClient with Cognito credentials
  const createV2DocumentClient = async () => {
    try {
      const { credentials } = await fetchAuthSession();
      
      if (!credentials) {
        throw new Error("No credentials available from Cognito session");
      }

      console.log("Creating AWS SDK v2 DocumentClient with Cognito credentials");

      // Import AWS SDK v2
      const AWS = await import("aws-sdk");
      
      // Configure AWS with credentials
      AWS.config.update({
        region: process.env.REACT_APP_AWS_REGION || "ap-southeast-2",
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      });

      // Create DocumentClient using v2
      const docClient = new AWS.DynamoDB.DocumentClient();
      
      console.log("AWS SDK v2 DocumentClient created successfully");
      return docClient;
    } catch (error) {
      console.error("Failed to create AWS SDK v2 DocumentClient:", error);
      throw error;
    }
  };

  // Function to fetch battery data using your existing queries.js functions
  const fetchBatteryData = async (batteryId) => {
    if (!batteryId) {
      console.log("No battery ID provided for data fetch");
      return null;
    }

    setIsLoadingData(true);
    setDataError(null);

    try {
      console.log(`Fetching data for battery: ${batteryId}`);
      
      // Create authenticated DocumentClient for v2
      const docClient = await createV2DocumentClient();
      
      let latestReading = null;
      
      // Handle Pack Controller differently
      if (batteryId === '0700') {
        latestReading = await getLatestPackControllerReading(docClient, "PACK-CONTROLLER");
      } else {
        // For regular batteries, ensure proper format
        const tagId = batteryId.startsWith('BAT-') ? batteryId : `BAT-${batteryId}`;
        latestReading = await getLatestReading(docClient, tagId);
      }

      if (latestReading) {
        // Format the data to match your existing structure
        const formattedData = {
          lastMinuteData: [latestReading]
        };
        
        console.log(`Successfully fetched data for ${batteryId}:`, formattedData);
        return formattedData;
      } else {
        console.log(`No data found for battery: ${batteryId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching data for ${batteryId}:`, error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes("credentials") || error.message.includes("CredentialsError")) {
        errorMessage = "Authentication error: Please refresh the page or sign in again";
      } else if (error.message.includes("AccessDenied")) {
        errorMessage = "Access denied: You don't have permission to access this battery data";
      } else if (error.message.includes("ResourceNotFound")) {
        errorMessage = "Battery data not found: This battery may not exist or has no recent data";
      } else if (error.message.includes("ValidationException")) {
        errorMessage = "Invalid request: Check battery ID format and table configuration";
      } else if (error.code === "NetworkingError" || error.code === "TimeoutError") {
        errorMessage = "Network error: Please check your internet connection and try again";
      }
      
      setDataError(errorMessage);
      return null;
    } finally {
      setIsLoadingData(false);
    }
  };

  // Effect to fetch data when selected battery changes
  useEffect(() => {
    const loadData = async () => {
      if (selectedBatteryId && selectedBatteryId !== lastSelectedBattery) {
        console.log(`Battery changed from ${lastSelectedBattery} to ${selectedBatteryId}`);
        
        const data = await fetchBatteryData(selectedBatteryId);
        setBmsData(data);
        setLastSelectedBattery(selectedBatteryId);
      }
    };

    loadData();
  }, [selectedBatteryId, lastSelectedBattery]);

  // Initial data load
  useEffect(() => {
    if (selectedBatteryId && !bmsData && !isLoadingData) {
      fetchBatteryData(selectedBatteryId).then(data => {
        setBmsData(data);
      });
    }
  }, [selectedBatteryId]);

  // Manual refresh function
  const handleRefreshData = async (batteryId = selectedBatteryId) => {
    if (!batteryId) return;
    
    console.log(`Manual refresh requested for battery: ${batteryId}`);
    const data = await fetchBatteryData(batteryId);
    setBmsData(data);
  };

  // Check if we have valid data
  const hasValidData = bmsData && bmsData.lastMinuteData && bmsData.lastMinuteData.length > 0;
  const currentData = hasValidData ? bmsData.lastMinuteData[0] : {};
  const hasAnyData = currentData && Object.keys(currentData).length > 0;

  // Debug logging
  useEffect(() => {
    console.log("Diagnostics Debug:", {
      selectedBatteryId,
      selectedBattery: selectedBattery?.nickname || selectedBattery?.name,
      hasBmsData: !!bmsData,
      hasLastMinuteData: !!bmsData?.lastMinuteData,
      lastMinuteDataLength: bmsData?.lastMinuteData?.length || 0,
      hasValidData,
      hasAnyData,
      currentDataKeys: Object.keys(currentData).length,
      isLoadingData,
      batteryLoading,
      dataError,
      batteryError
    });
  }, [
    bmsData,
    selectedBatteryId,
    selectedBattery,
    hasValidData,
    hasAnyData,
    currentData,
    isLoadingData,
    batteryLoading,
    dataError,
    batteryError
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
          Loading diagnostics for {selectedBattery?.nickname || selectedBattery?.name || `Battery ${selectedBatteryId}`}...
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
        No diagnostic data found for {selectedBattery?.nickname || selectedBattery?.name || `Battery ${selectedBatteryId}`}.{" "}
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
        <li>Your queries.js function may need the latest (not second-latest) reading</li>
      </ul>
      {dataError && (
        <div
          style={{
            backgroundColor: "#ffebee",
            color: "#d32f2f",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            fontSize: "14px"
          }}
        >
          Error: {dataError}
        </div>
      )}
      <button
        onClick={() => handleRefreshData()}
        style={{
          backgroundColor: "#1259c3",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        disabled={isLoadingData}
      >
        {isLoadingData ? "Refreshing..." : "Retry Loading Data"}
      </button>
    </div>
  );

  const NoBatterySelected = () => (
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
      <div style={{ marginBottom: "20px", fontSize: "48px" }}>🔋</div>
      <h3 style={{ color: "#666", marginBottom: "15px" }}>Select a Battery</h3>
      <p style={{ color: "#888", marginBottom: "20px" }}>
        Please select a battery from the dropdown above to view diagnostics.
      </p>
    </div>
  );

  const TroubleshootingInfo = () => (
    <div
      style={{
        backgroundColor: "#e3f2fd",
        border: "1px solid #90caf9",
        padding: "15px",
        borderRadius: "8px",
        margin: "20px",
        fontSize: "14px"
      }}
    >
      <h4 style={{ color: "#1565c0", marginTop: 0 }}>🔍 Troubleshooting</h4>
      <p style={{ color: "#1565c0", marginBottom: "10px" }}>
        If you're still getting authentication errors, try:
      </p>
      <ul style={{ color: "#1565c0", paddingLeft: "20px", marginBottom: "10px" }}>
        <li>Refreshing the page to get fresh Cognito credentials</li>
        <li>Signing out and signing back in</li>
        <li>Checking that your user has DynamoDB read permissions</li>
        <li>Verifying the table names in your environment variables</li>
      </ul>
      <p style={{ color: "#1565c0", fontSize: "12px", margin: 0 }}>
        Note: Your getLatestReading function gets the <strong>second-latest</strong> reading. 
        If a battery only has one reading, no data will be returned.
      </p>
    </div>
  );

  // Show battery loading error
  if (batteryError) {
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
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#d32f2f",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center"
            }}
          >
            <h3>Battery System Error</h3>
            <p>{batteryError}</p>
          </div>
        </div>
      </>
    );
  }

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
        {/* Header with battery selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #c0c0c0",
            paddingBottom: "15px"
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#818181",
              margin: 0
            }}
          >
            Battery Diagnostics
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Battery Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>
                Battery:
              </label>
              <BatterySelector 
                style={{ minWidth: "200px" }}
                compact={false}
              />
            </div>

            {/* Loading indicator */}
            {(isLoadingData || batteryLoading) && (
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
                  {isLoadingData ? "Loading data..." : "Loading batteries..."}
                </span>
              </div>
            )}

            {/* Refresh button */}
            {selectedBatteryId && (
              <button
                onClick={() => handleRefreshData()}
                disabled={isLoadingData}
                style={{
                  backgroundColor: "#1259c3",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: isLoadingData ? "default" : "pointer",
                  fontSize: "14px",
                  opacity: isLoadingData ? 0.7 : 1
                }}
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>

        {/* Show troubleshooting info if there are credential errors */}
        {dataError && dataError.includes("Authentication") && (
          <TroubleshootingInfo />
        )}

        {/* Show loading overlay when refreshing */}
        {isLoadingData && <LoadingOverlay />}

        {/* Content based on state */}
        {!selectedBatteryId ? (
          <NoBatterySelected />
        ) : !isLoadingData && !hasValidData ? (
          <NoDataMessage />
        ) : !isLoadingData && hasValidData ? (
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
        ) : null}

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
            Debug: Battery={selectedBatteryId}, HasData={hasValidData}, Records=
            {bmsData?.lastMinuteData?.length || 0}, Loading={isLoadingData},
            BatteryLoading={batteryLoading}
            <br />
            SDK: v2 Compatible, Function: getLatestReading (second-latest)
          </div>
        )}
      </div>
    </>
  );
};

export default DiagnosticsPage;