import React, { useState } from "react";
import DataViewer from "./components/DataViewer.js";
import { fetchData } from "../../queries.js";

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

  // Battery Registration Integration
  const { getCurrentBatteryId, selectedBattery, hasRegisteredBatteries } = useBatteryContext();

  const timeRanges = [
    { label: "Last 1 Minute", value: "1min" },
    { label: "Last 5 Minutes", value: "5min" },
    { label: "Last 1 Hour", value: "1hour" },
    { label: "Last 8 Hours", value: "8hours" },
    { label: "Last 1 Day", value: "1day" },
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 1 Month", value: "1month" },
  ];

  const handleFetchData = async () => {
    // Get current battery ID from context
    const currentBatteryId = getCurrentBatteryId();
    
    if (!currentBatteryId) {
      setError("Please select a battery to analyze");
      return;
    }

    // Remove the "0x" prefix if present for the API call
    const tagId = currentBatteryId.replace(/^0x/, "");

    setLoading(true);
    setError(null);
    setData(null);

    try {
      console.log("Fetching data for battery:", tagId, "time range:", selectedTimeRange);
      const fetchedData = await fetchData(tagId, selectedTimeRange);
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If we have data, show the grid layout
  if (data || loading || error) {
    return (
      <DataViewer
        loading={loading}
        error={error}
        data={data}
        selectedTagId={getCurrentBatteryId()}
        onFetchData={handleFetchData}
        // Remove baseIds prop since we're using battery registration
      />
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
              {hasRegisteredBatteries 
                ? "Select time range to analyze your battery performance" 
                : "Please register a battery first to access analytics"
              }
            </p>
          </div>

          {hasRegisteredBatteries ? (
            <>
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
                      <BatterySelector
                        style={{
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${colors.secondary}`,
                          fontSize: "1rem",
                          backgroundColor: "#fff",
                          minWidth: "200px",
                        }}
                        showAddButton={true}
                        compact={false}
                      />
                    </div>
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
                  <button
                    onClick={handleFetchData}
                    disabled={!selectedBattery}
                    style={{
                      padding: "16px 32px",
                      backgroundColor: selectedBattery ? colors.accent : colors.secondary,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: selectedBattery ? "pointer" : "not-allowed",
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      transition: "all 0.3s ease",
                      boxShadow: selectedBattery ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      opacity: selectedBattery ? 1 : 0.6,
                    }}
                    onMouseOver={(e) => {
                      if (selectedBattery) {
                        e.target.style.backgroundColor = colors.primary;
                        e.target.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedBattery) {
                        e.target.style.backgroundColor = colors.accent;
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    Analyze Data
                  </button>
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
                    What you'll see:
                  </h3>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: colors.textLight,
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    Interactive grid dashboard with cell data, pack information,
                    temperature readings, SOC metrics, and real-time trend analysis
                    for comprehensive battery monitoring.
                  </p>
                </div>

                {selectedBattery && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      backgroundColor: "#e8f5e8",
                      borderRadius: "8px",
                      border: `1px solid ${colors.accent}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: colors.accent,
                        margin: "0 0 4px 0",
                        fontWeight: "600",
                      }}
                    >
                      Ready to analyze:
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
                      {selectedBattery.nickname || selectedBattery.serialNumber} ({selectedBattery.batteryId})
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                backgroundColor: colors.background,
                borderRadius: "8px",
                border: `1px solid ${colors.secondary}`,
                maxWidth: "500px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: colors.textDark,
                  margin: "0 0 16px 0",
                }}
              >
                No Batteries Registered
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  color: colors.textLight,
                  margin: "0 0 24px 0",
                  lineHeight: "1.5",
                }}
              >
                You need to register at least one battery before you can access data analytics.
              </p>
              <button
                onClick={() => window.location.href = '/battery-registration'}
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = colors.primary;
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = colors.accent;
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Register Battery
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPage;