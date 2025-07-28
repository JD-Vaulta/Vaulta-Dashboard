import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Battery Registration Integration
import { useBatteryContext } from "../../../contexts/BatteryContext.js";
import { detectBatteryType } from "../../../queries.js";

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
  primary: "#636362", // storm-dust - main UI elements
  secondary: "#adaead", // edward - borders and secondary elements
  background: "rgba(234,234,232,0.1)", // desert-storm with opacity
  backgroundSolid: "#eaeae8", // desert-storm solid
  textDark: "#1a1b1a", // heavy-metal - main text
  textLight: "#636362", // storm-dust - secondary text
  accent: "#87c842", // atlantis - used sparingly
  error: "#bf1c1b", // thunderbird - error states
};

// Smart data sampling for performance
const sampleDataForDisplay = (data, maxPoints = 1000) => {
  if (!Array.isArray(data) || data.length <= maxPoints) {
    return data;
  }

  const sampledData = [];
  const step = data.length / maxPoints;

  for (let i = 0; i < data.length; i += step) {
    const index = Math.floor(i);
    if (index < data.length) {
      sampledData.push(data[index]);
    }
  }

  // Always include the last point
  if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
    sampledData.push(data[data.length - 1]);
  }

  return sampledData;
};

// Smart sampling for cell voltage arrays
const sampleCellVoltages = (cellVoltages, maxPointsPerCell = 200) => {
  return cellVoltages.map((cellData) =>
    sampleDataForDisplay(cellData, maxPointsPerCell)
  );
};

// Smart sampling for temperature data
const sampleTemperatureData = (temperatureData, maxPointsPerSensor = 200) => {
  const sampledTempData = {};
  Object.entries(temperatureData).forEach(([sensor, values]) => {
    sampledTempData[sensor] = sampleDataForDisplay(values, maxPointsPerSensor);
  });
  return sampledTempData;
};

// Transform PackController data for charts
const transformPackControllerData = (systemData, metric) => {
  if (!systemData || !systemData[metric] || !systemData[metric].values) {
    return [{ time: 1, value: 0 }];
  }

  const values = systemData[metric].values;
  const timestamps = systemData[metric].timestamps;

  const transformedData = values.map((value, index) => ({
    time: timestamps[index] || index + 1,
    value: value,
    formattedTime: timestamps[index]
      ? new Date(timestamps[index] * 1000).toLocaleTimeString()
      : `Point ${index + 1}`,
  }));

  return transformedData.length > 0 ? transformedData : [{ time: 1, value: 0 }];
};

// Calculate min/max values for a dataset with 10% padding
const calculateMinMax = (data) => {
  if (!data || data.length === 0) {
    return { min: 0, max: 0 };
  }

  const values = data
    .map((item) => item.value)
    .filter((val) => val !== null && val !== undefined && !isNaN(val));
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return { min, max };
};

// Calculate Y-axis domain with 10% padding
const calculateYAxisDomain = (data, paddingPercent = 10) => {
  if (!data || data.length === 0) {
    return [0, 100];
  }

  // Extract all numeric values from the data
  const values = [];
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (
        key !== "time" &&
        key !== "formattedTime" &&
        typeof item[key] === "number" &&
        !isNaN(item[key])
      ) {
        values.push(item[key]);
      }
    });
  });

  if (values.length === 0) {
    return [0, 100];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  // If min and max are the same, add some padding to avoid a flat line
  if (min === max) {
    const padding = Math.abs(min) * 0.1 || 1; // Use 10% of value or 1 as fallback
    return [min - padding, max + padding];
  }

  // Calculate 10% padding
  const range = max - min;
  const padding = range * (paddingPercent / 100);

  const paddedMin = min - padding;
  const paddedMax = max + padding;

  return [paddedMin, paddedMax];
};

// PackController Chart Component - Updated with dynamic Y-axis range
const PackControllerChart = ({
  data,
  metric,
  title,
  unit,
  color,
  showMinMax = true,
}) => {
  const chartData = useMemo(() => {
    return transformPackControllerData(data, metric);
  }, [data, metric]);

  const minMaxData = useMemo(() => {
    return calculateMinMax(chartData);
  }, [chartData]);

  const yAxisDomain = useMemo(() => {
    return calculateYAxisDomain(chartData);
  }, [chartData]);

  const currentValue = chartData[chartData.length - 1]?.value || 0;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "clamp(4px, 1vw, 12px)",
        padding: "clamp(8px, 2vw, 20px)",
        border: `1px solid ${colors.secondary}`,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        minWidth: "0",
        minHeight: "200px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "clamp(4px, 1vw, 10px)",
        }}
      >
        <h3
          style={{
            fontWeight: "600",
            color: colors.textDark,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "clamp(0.8rem, 1.5vw, 1.1rem)",
            flex: 1,
          }}
        >
          {title}
        </h3>

        {/* Current value indicator */}
        <div
          style={{
            fontSize: "clamp(0.6rem, 1vw, 0.8rem)",
            color: colors.textLight,
            backgroundColor: "rgba(255,255,255,0.9)",
            padding: "2px 6px",
            borderRadius: "4px",
            border: `1px solid ${colors.secondary}30`,
            whiteSpace: "nowrap",
          }}
        >
          {currentValue.toFixed(2)}
          {unit}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: "150px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} />
            <XAxis
              dataKey="time"
              stroke={colors.textLight}
              fontSize="clamp(8px, 1.5vw, 12px)"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) =>
                new Date(value * 1000).toLocaleTimeString()
              }
            />
            <YAxis
              stroke={colors.textLight}
              fontSize="clamp(8px, 1.5vw, 12px)"
              domain={yAxisDomain}
              tickFormatter={(value) => `${value.toFixed(1)}${unit}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        backgroundColor: colors.backgroundSolid,
                        border: `1px solid ${colors.secondary}`,
                        borderRadius: "6px",
                        padding: "8px",
                        color: colors.textDark,
                        fontSize: "clamp(8px, 1.5vw, 12px)",
                      }}
                    >
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>
                        {new Date(label * 1000).toLocaleString()}
                      </p>
                      <p style={{ margin: "0 0 2px 0" }}>
                        {`${title}: ${payload[0].value?.toFixed(2)}${unit}`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Min/Max indicators with range info */}
      {showMinMax && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "8px",
            fontSize: "clamp(0.5rem, 0.8vw, 0.7rem)",
            color: colors.textLight,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: colors.background,
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            <span style={{ color: colors.error }}>↓</span>
            <span>
              Min: {minMaxData.min.toFixed(2)}
              {unit}
            </span>
          </div>

          <div
            style={{
              fontSize: "clamp(0.4rem, 0.7vw, 0.6rem)",
              color: colors.textLight,
              backgroundColor: colors.background,
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Range: {(minMaxData.max - minMaxData.min).toFixed(2)}
            {unit}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: colors.background,
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            <span style={{ color: colors.accent }}>↑</span>
            <span>
              Max: {minMaxData.max.toFixed(2)}
              {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DataViewer = ({
  loading,
  error,
  data,
  selectedTagId,
  onFetchData,
  loadingProgress,
  onBatteryChange,
  onTimeRangeChange,
  currentTimeRange,
  batteryType: propBatteryType,
  availableBatteries = [],
}) => {
  const [selectedNode, setSelectedNode] = useState("Node0");
  const [selectedParameter, setSelectedParameter] = useState("Temperature");

  // Battery Registration Integration
  const { selectedBattery, hasRegisteredBatteries, getCurrentBatteryId } =
    useBatteryContext();

  // Detect battery type
  const detectedBatteryType = useMemo(() => {
    if (propBatteryType) return propBatteryType;
    if (selectedTagId) return detectBatteryType(selectedTagId);
    if (data && data.type) return data.type;
    return "BMS";
  }, [propBatteryType, selectedTagId, data]);

  // Clear cache on battery/time change
  useEffect(() => {
    return () => {
      // Memory cleanup
      if (window.gc) window.gc();
    };
  }, [selectedTagId, currentTimeRange]);

  // Debug effect to track selectedTagId changes
  useEffect(() => {
    console.log("=== DATAVIEWER PROPS CHANGE ===");
    console.log("selectedTagId changed to:", selectedTagId);
    console.log("propBatteryType:", propBatteryType);
    console.log("detectedBatteryType:", detectedBatteryType);
    console.log("availableBatteries:", availableBatteries.length, "batteries");
    console.log("===============================");
  }, [selectedTagId, propBatteryType, detectedBatteryType, availableBatteries]);

  // Handle internal battery change
  const handleInternalBatteryChange = useCallback(
    (newBatteryId) => {
      console.log("=== DATAVIEWER BATTERY CHANGE ===");
      console.log("New Battery ID:", newBatteryId);
      console.log("Current selectedTagId:", selectedTagId);
      console.log("Available batteries:", availableBatteries);
      console.log("PropBatteryType:", propBatteryType);
      console.log("DetectedBatteryType:", detectedBatteryType);

      // Prevent unnecessary calls if the same battery is selected
      if (newBatteryId === selectedTagId) {
        console.log("Same battery selected, skipping change");
        console.log("=== END DATAVIEWER BATTERY CHANGE ===");
        return;
      }

      // Clear any error states immediately when switching
      if (error) {
        console.log("Clearing error state on battery change");
      }

      // Call the parent's onBatteryChange function
      if (onBatteryChange) {
        console.log("Calling parent onBatteryChange with:", newBatteryId);
        onBatteryChange(newBatteryId);
      } else {
        console.log("ERROR: onBatteryChange is not provided!");
      }
      console.log("=== END DATAVIEWER BATTERY CHANGE ===");
    },
    [
      onBatteryChange,
      selectedTagId,
      availableBatteries,
      propBatteryType,
      detectedBatteryType,
      error,
    ]
  );

  // Time ranges for the selector
  const timeRanges = [
    { label: "Last 1 Minute", value: "1min" },
    { label: "Last 5 Minutes", value: "5min" },
    { label: "Last 1 Hour", value: "1hour" },
    { label: "Last 8 Hours", value: "8hours" },
    { label: "Last 1 Day", value: "1day" },
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 1 Month", value: "1month" },
  ];

  // Optimized data processing with sampling - only for BMS data
  const processedData = useMemo(() => {
    if (!data || typeof data !== "object") {
      return {
        type: "BMS",
        Node0: { voltage: { cellVoltages: [] }, temperature: {} },
        Node1: { voltage: { cellVoltages: [] }, temperature: {} },
        Cell: {
          maxCellVoltage: 0,
          minCellVoltage: 0,
          thresholdOverVoltage: 0,
          thresholdUnderVoltage: 0,
        },
        Temperature: {
          maxCellTemp: 0,
          minCellTemp: 0,
          thresholdOverTemp: 0,
          thresholdUnderTemp: 0,
          maxCellTempNode: 0,
          minCellTempNode: 0,
        },
        SOC: { socPercent: 0, balanceSOCPercent: 0 },
      };
    }

    // If it's PackController data, return as-is
    if (
      data.type === "PACK_CONTROLLER" ||
      detectedBatteryType === "PACK_CONTROLLER"
    ) {
      return data;
    }

    // Sample the BMS data intelligently to prevent overwhelming the UI
    const sampledData = {
      type: "BMS",
      Node0: {
        voltage: {
          cellVoltages: data.Node0?.voltage?.cellVoltages
            ? sampleCellVoltages(data.Node0.voltage.cellVoltages)
            : Array.from({ length: 14 }, () => []),
        },
        temperature: data.Node0?.temperature
          ? sampleTemperatureData(data.Node0.temperature)
          : {},
      },
      Node1: {
        voltage: {
          cellVoltages: data.Node1?.voltage?.cellVoltages
            ? sampleCellVoltages(data.Node1.voltage.cellVoltages)
            : Array.from({ length: 14 }, () => []),
        },
        temperature: data.Node1?.temperature
          ? sampleTemperatureData(data.Node1.temperature)
          : {},
      },
      Cell: data.Cell || {
        maxCellVoltage: 0,
        minCellVoltage: 0,
        thresholdOverVoltage: 0,
        thresholdUnderVoltage: 0,
      },
      Temperature: data.Temperature || {
        maxCellTemp: 0,
        minCellTemp: 0,
        thresholdOverTemp: 0,
        thresholdUnderTemp: 0,
        maxCellTempNode: 0,
        minCellTempNode: 0,
      },
      SOC: data.SOC || { socPercent: 0, balanceSOCPercent: 0 },
    };

    return sampledData;
  }, [data, detectedBatteryType]);

  // Calculate processed node data and graph data for BMS
  const { currentNode, nodeData, graphData, bmsYAxisDomain } = useMemo(() => {
    // Ensure the selected node exists
    const currentNode = processedData[selectedNode] || {
      voltage: { cellVoltages: [] },
      temperature: {},
    };

    // Helper functions to transform data with safety checks
    const transformTemperatureData = (temperatureData) => {
      if (!temperatureData || typeof temperatureData !== "object") {
        return [{ time: 1 }];
      }

      const transformedData = [];
      Object.entries(temperatureData).forEach(([sensor, values]) => {
        if (Array.isArray(values)) {
          values.forEach((value, index) => {
            if (!transformedData[index]) {
              transformedData[index] = { time: index + 1 };
            }
            transformedData[index][sensor] = value;
          });
        }
      });
      return transformedData.length > 0 ? transformedData : [{ time: 1 }];
    };

    const transformVoltageData = (voltageData) => {
      if (
        !voltageData ||
        !voltageData.cellVoltages ||
        !Array.isArray(voltageData.cellVoltages)
      ) {
        return [{ time: 1 }];
      }

      const transformedData = [];
      const maxLength = Math.max(
        ...voltageData.cellVoltages.map((arr) => arr.length)
      );

      for (let timeIndex = 0; timeIndex < maxLength; timeIndex++) {
        const timeData = { time: timeIndex + 1 };
        voltageData.cellVoltages.forEach((voltages, cellIndex) => {
          if (voltages[timeIndex] !== undefined && voltages[timeIndex] > 0) {
            timeData[`Cell ${cellIndex + 1}`] = voltages[timeIndex];
          }
        });
        transformedData.push(timeData);
      }

      return transformedData.length > 0 ? transformedData : [{ time: 1 }];
    };

    // Get the data for the selected node and parameter with safety checks
    const nodeData = currentNode;
    const graphData =
      selectedParameter === "Temperature"
        ? transformTemperatureData(nodeData.temperature)
        : transformVoltageData(nodeData.voltage);

    // Calculate Y-axis domain for BMS data
    const bmsYAxisDomain = calculateYAxisDomain(graphData);

    return { currentNode, nodeData, graphData, bmsYAxisDomain };
  }, [processedData, selectedNode, selectedParameter]);

  // Helper function to safely extract value
  const safeExtractValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object" && value.N) return value.N;
    if (typeof value === "object" && value.S) return value.S;
    return value;
  };

  // Loading state with progress
  if (loading && !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          padding: "40px",
          backgroundColor: colors.backgroundSolid,
          borderRadius: "12px",
          margin: "20px",
          border: `1px solid ${colors.secondary}`,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.secondary}`,
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: colors.textDark,
              fontSize: "1.5rem",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            Loading{" "}
            {detectedBatteryType === "PACK_CONTROLLER"
              ? "Pack Controller"
              : "Battery"}{" "}
            Data
          </h2>

          {/* Spinner */}
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

          {/* Progress Information */}
          {loadingProgress && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: colors.textLight,
                  fontSize: "1rem",
                  marginBottom: "10px",
                }}
              >
                {loadingProgress.message || "Loading..."}
              </p>

              {loadingProgress.total > 0 && (
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: colors.secondary,
                    borderRadius: "4px",
                    marginBottom: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        (loadingProgress.current / loadingProgress.total) * 100,
                        100
                      )}%`,
                      height: "100%",
                      backgroundColor: colors.accent,
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}

              <p
                style={{
                  color: colors.textLight,
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                Page {loadingProgress.current}{" "}
                {loadingProgress.total > 0
                  ? `of ~${loadingProgress.total}`
                  : ""}
              </p>
            </div>
          )}

          {/* Battery/Controller Info */}
          <div
            style={{
              backgroundColor: colors.background,
              borderRadius: "8px",
              padding: "12px",
              border: `1px solid ${colors.secondary}`,
            }}
          >
            <p
              style={{
                color: colors.textLight,
                fontSize: "0.9rem",
                margin: "0 0 4px 0",
              }}
            >
              Analyzing{" "}
              {detectedBatteryType === "PACK_CONTROLLER"
                ? "Pack Controller"
                : "Battery"}
              :
            </p>
            <p
              style={{
                color: colors.textDark,
                fontSize: "1rem",
                fontWeight: "600",
                fontFamily: "monospace",
                margin: 0,
              }}
            >
              {detectedBatteryType === "PACK_CONTROLLER"
                ? "Pack Controller (0700)"
                : selectedBattery
                ? `${
                    selectedBattery.nickname || selectedBattery.serialNumber
                  } (${selectedBattery.batteryId})`
                : selectedTagId}
            </p>
          </div>
        </div>

        {/* CSS for spinner animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          padding: "20px",
          backgroundColor: colors.background,
          borderRadius: "8px",
          color: colors.error,
          textAlign: "center",
          border: `1px solid ${colors.secondary}`,
          fontSize: "1.2rem",
        }}
      >
        <div>
          <h3 style={{ color: colors.error, marginBottom: "10px" }}>
            Error Loading Data
          </h3>
          <p style={{ color: colors.textLight, marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={onFetchData}
            style={{
              padding: "12px 24px",
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          color: colors.textLight,
          fontSize: "1.2rem",
        }}
      >
        No data available.
      </div>
    );
  }

  // PackController-specific rendering
  if (detectedBatteryType === "PACK_CONTROLLER") {
    // Only render PackController UI if battery type is PackController
    // This prevents errors when switching from BMS to PackController
    if (processedData.type === "PACK_CONTROLLER" || !data) {
      return (
        <>
          {/* Responsive CSS Styles */}
          <style>{`
            .pack-controller-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: auto repeat(2, 300px);
              gap: clamp(8px, 2vw, 20px);
              min-height: 80vh;
              padding: clamp(8px, 2vw, 24px);
              background-color: ${colors.backgroundSolid};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .pack-controller-header {
              grid-column: 1 / -1;
              background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
              border-radius: 12px;
              padding: 16px 24px;
              border: 1px solid ${colors.secondary};
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 16px;
            }

            @media (max-width: 1200px) {
              .pack-controller-container {
                grid-template-columns: repeat(2, 1fr);
                gap: clamp(6px, 1.5vw, 16px);
              }
            }

            @media (max-width: 768px) {
              .pack-controller-container {
                grid-template-columns: 1fr;
                gap: clamp(4px, 1vw, 12px);
              }
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <div className="pack-controller-container">
            {/* Header */}
            <div className="pack-controller-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: colors.textDark,
                    margin: 0,
                  }}
                >
                  Pack Controller Analytics
                </h1>

                {/* Progressive Loading Indicator */}
                {loading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: `2px solid ${colors.secondary}`,
                        borderTop: `2px solid ${colors.accent}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span
                      style={{ color: colors.textLight, fontSize: "0.9rem" }}
                    >
                      {loadingProgress?.message || "Loading..."}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {/* Battery/Controller Selector */}
                <select
                  value={selectedTagId || ""}
                  onChange={(e) => handleInternalBatteryChange(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${colors.secondary}`,
                    fontSize: "0.9rem",
                    backgroundColor: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <option value="">Select Device</option>
                  {availableBatteries.map((battery) => (
                    <option key={battery.id} value={battery.id}>
                      {battery.name}{" "}
                      {battery.type === "PACK_CONTROLLER"
                        ? "(Controller)"
                        : "(Battery)"}
                    </option>
                  ))}
                </select>

                {/* Time Range Selector */}
                <select
                  value={currentTimeRange || "1hour"}
                  onChange={(e) => {
                    console.log("=== DATAVIEWER TIME RANGE CHANGE (PC) ===");
                    console.log("New time range:", e.target.value);
                    console.log("Current time range:", currentTimeRange);
                    if (onTimeRangeChange) {
                      onTimeRangeChange(e.target.value);
                    } else {
                      console.log("ERROR: onTimeRangeChange is not provided!");
                    }
                    console.log(
                      "=== END DATAVIEWER TIME RANGE CHANGE (PC) ==="
                    );
                  }}
                  disabled={loading}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${colors.secondary}`,
                    fontSize: "0.9rem",
                    backgroundColor: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>

                {/* Refresh Button */}
                <button
                  onClick={onFetchData}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>

                {/* Data Info */}
                {data && !loading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{ color: colors.textLight, fontSize: "0.8rem" }}
                    >
                      Pack Controller
                    </span>
                    <span
                      style={{
                        backgroundColor: "#4169E1",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Only show charts if we have PackController data or if loading */}
            {processedData.type === "PACK_CONTROLLER" &&
            processedData.System ? (
              <>
                {/* System Temperature Chart */}
                <PackControllerChart
                  data={processedData.System}
                  metric="systemTemp"
                  title="System Temperature"
                  unit="°C"
                  color={colors.thunderbird}
                  showMinMax={true}
                />

                {/* Total Voltage Chart */}
                <PackControllerChart
                  data={processedData.System}
                  metric="totalVoltage"
                  title="Total Voltage"
                  unit="V"
                  color={colors.primary}
                  showMinMax={true}
                />

                {/* SOC Percent Chart */}
                <PackControllerChart
                  data={processedData.System}
                  metric="socPercent"
                  title="State of Charge"
                  unit="%"
                  color={colors.accent}
                  showMinMax={true}
                />

                {/* SOH Percent Chart */}
                <PackControllerChart
                  data={processedData.System}
                  metric="sohPercent"
                  title="State of Health"
                  unit="%"
                  color={colors.atlantis}
                  showMinMax={true}
                />
              </>
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  color: colors.textLight,
                  fontSize: "1.2rem",
                }}
              >
                {loading
                  ? "Loading PackController data..."
                  : "No PackController data available"}
              </div>
            )}
          </div>
        </>
      );
    }
  }

  // Get the data for the selected node and parameter with safety checks
  // BMS-specific rendering (existing code but without Cell Data section)
  // Additional safety check: if we're in transition between battery types, show loading
  if (loading && (!data || (data.type && data.type !== detectedBatteryType))) {
    return (
      <>
        {/* CSS for spinner animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
            color: colors.textLight,
            fontSize: "1.2rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
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
            <div>
              Switching to{" "}
              {detectedBatteryType === "BMS" ? "Battery" : "Pack Controller"}...
            </div>
          </div>
        </div>
      </>
    );
  }

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "clamp(4px, 1vw, 12px)",
    padding: "clamp(8px, 2vw, 20px)",
    border: `1px solid ${colors.secondary}`,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    minWidth: "0",
    minHeight: "0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const buttonStyle = (isActive) => ({
    padding: "8px 16px",
    backgroundColor: isActive ? colors.primary : colors.background,
    color: isActive ? "#fff" : colors.textDark,
    border: `1px solid ${colors.secondary}`,
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
  });

  return (
    <>
      {/* Responsive CSS Styles */}
      <style>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(8, minmax(120px, 1fr));
          grid-template-rows: auto repeat(3, minmax(100px, 1fr));
          gap: clamp(4px, 1vw, 12px);
          min-height: 80vh;
          padding: clamp(8px, 2vw, 24px);
          background-color: ${colors.backgroundSolid};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          min-width: 960px;
        }

        .controls-header {
          grid-column: span 8;
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border-radius: 12px;
          padding: 16px 24px;
          border: 1px solid ${colors.secondary};
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 8px;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          z-index: 10;
        }

        @media (max-width: 1400px) {
          .grid-container {
            grid-template-columns: repeat(8, minmax(100px, 1fr));
            grid-template-rows: auto repeat(3, minmax(90px, 1fr));
            gap: clamp(3px, 0.8vw, 10px);
          }
        }

        @media (max-width: 1200px) {
          .grid-container {
            grid-template-columns: repeat(6, minmax(90px, 1fr));
            grid-template-rows: auto repeat(3, minmax(80px, 1fr));
            gap: clamp(2px, 0.6vw, 8px);
          }
          
          .hide-on-small { display: none !important; }
        }

        @media (max-width: 1000px) {
          .grid-container {
            grid-template-columns: repeat(4, minmax(80px, 1fr));
            grid-template-rows: auto repeat(2, minmax(70px, 1fr));
            gap: clamp(2px, 0.5vw, 6px);
          }
        }

        .responsive-text-lg { font-size: clamp(0.8rem, 2vw, 1.5rem); }
        .responsive-text-md { font-size: clamp(0.7rem, 1.5vw, 1.1rem); }
        .responsive-text-sm { font-size: clamp(0.6rem, 1vw, 0.9rem); }
        .responsive-text-xs { font-size: clamp(0.5rem, 0.8vw, 0.7rem); }

        .recharts-wrapper { min-height: 40px !important; }
        .recharts-cartesian-axis-tick-value { font-size: clamp(6px, 1.2vw, 12px) !important; }
        .recharts-legend-wrapper { font-size: clamp(6px, 1vw, 10px) !important; }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="grid-container">
        {/* Dynamic Controls Header */}
        <div className="controls-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: colors.textDark,
                margin: 0,
              }}
            >
              Battery Data Analytics
            </h1>

            {/* Progressive Loading Indicator */}
            {loading && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: `2px solid ${colors.secondary}`,
                    borderTop: `2px solid ${colors.accent}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span style={{ color: colors.textLight, fontSize: "0.9rem" }}>
                  {loadingProgress?.message || "Loading..."}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Battery/Controller Selector */}
            <select
              value={selectedTagId || ""}
              onChange={(e) => handleInternalBatteryChange(e.target.value)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.secondary}`,
                fontSize: "0.9rem",
                backgroundColor: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <option value="">Select Device</option>
              {availableBatteries.map((battery) => (
                <option key={battery.id} value={battery.id}>
                  {battery.name}{" "}
                  {battery.type === "PACK_CONTROLLER"
                    ? "(Controller)"
                    : "(Battery)"}
                </option>
              ))}
            </select>

            {/* Time Range Selector */}
            <select
              value={currentTimeRange || "1hour"}
              onChange={(e) => {
                console.log("=== DATAVIEWER TIME RANGE CHANGE (BMS) ===");
                console.log("New time range:", e.target.value);
                console.log("Current time range:", currentTimeRange);
                if (onTimeRangeChange) {
                  onTimeRangeChange(e.target.value);
                } else {
                  console.log("ERROR: onTimeRangeChange is not provided!");
                }
                console.log("=== END DATAVIEWER TIME RANGE CHANGE (BMS) ===");
              }}
              disabled={loading}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.secondary}`,
                fontSize: "0.9rem",
                backgroundColor: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={onFetchData}
              disabled={loading}
              style={{
                ...buttonStyle(false),
                backgroundColor: colors.accent,
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.9rem",
                padding: "8px 16px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            {/* Data Info */}
            {data && !loading && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ color: colors.textLight, fontSize: "0.8rem" }}>
                  Battery: {selectedBattery?.batteryId || selectedTagId}
                </span>
                <span
                  style={{
                    backgroundColor: colors.accent,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                  }}
                >
                  LIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Graph with Progressive Updates and Dynamic Y-axis */}
        <div
          style={{
            ...cardStyle,
            gridColumn: "span 8 / span 8",
            gridRow: "span 3 / span 3",
            gridColumnStart: 1,
            gridRowStart: 2,
            minWidth: "400px",
            minHeight: "300px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h3
              className="responsive-text-md"
              style={{
                fontWeight: "600",
                color: colors.textDark,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedParameter} Trends - {selectedNode}
            </h3>

            {/* Chart controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() =>
                  setSelectedParameter(
                    selectedParameter === "Temperature"
                      ? "Voltage"
                      : "Temperature"
                  )
                }
                style={{
                  ...buttonStyle(false),
                  backgroundColor: colors.accent,
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "4px 8px",
                }}
              >
                {selectedParameter === "Temperature"
                  ? "→ Voltage"
                  : "→ Temperature"}
              </button>
              <button
                onClick={() =>
                  setSelectedNode(selectedNode === "Node0" ? "Node1" : "Node0")
                }
                style={{
                  ...buttonStyle(false),
                  backgroundColor: colors.primary,
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "4px 8px",
                }}
              >
                → {selectedNode === "Node0" ? "Node 1" : "Node 0"}
              </button>
            </div>
          </div>

          {/* Loading overlay for this specific chart */}
          {loading && graphData.length <= 1 && (
            <div className="loading-overlay">
              <div style={{ textAlign: "center", color: colors.textLight }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: `4px solid ${colors.secondary}`,
                    borderTop: `4px solid ${colors.accent}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                <div style={{ fontSize: "0.9rem" }}>
                  Loading {selectedParameter.toLowerCase()} data...
                </div>
                {loadingProgress && (
                  <div style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                    {loadingProgress.message}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: "150px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.secondary}
                />
                <XAxis
                  dataKey="time"
                  stroke={colors.textLight}
                  fontSize="clamp(8px, 1.5vw, 12px)"
                />
                <YAxis
                  stroke={colors.textLight}
                  fontSize="clamp(8px, 1.5vw, 12px)"
                  domain={bmsYAxisDomain}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.backgroundSolid,
                    border: `1px solid ${colors.secondary}`,
                    borderRadius: "6px",
                    color: colors.textDark,
                    fontSize: "clamp(8px, 1.5vw, 12px)",
                  }}
                />
                {selectedParameter === "Temperature"
                  ? Object.keys(nodeData.temperature).map((sensor, index) => (
                      <Line
                        key={sensor}
                        type="monotone"
                        dataKey={sensor}
                        stroke={
                          index % 2 === 0 ? colors.primary : colors.accent
                        }
                        strokeWidth="clamp(1px, 0.3vw, 2px)"
                        dot={false}
                        connectNulls={false}
                      />
                    ))
                  : Array.from({ length: 8 }).map((_, index) => (
                      <Line
                        key={`Cell ${index + 1}`}
                        type="monotone"
                        dataKey={`Cell ${index + 1}`}
                        stroke={
                          index % 3 === 0
                            ? colors.primary
                            : index % 3 === 1
                            ? colors.accent
                            : colors.ghost
                        }
                        strokeWidth="clamp(0.5px, 0.2vw, 1px)"
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data quality indicator with range info */}
          {data && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                fontSize: "0.6rem",
                color: colors.textLight,
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: `1px solid ${colors.secondary}30`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "2px",
              }}
            >
              <div>{graphData.length} points • Sampled for performance</div>
              <div>Range: ±10% of min/max values</div>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default DataViewer;
