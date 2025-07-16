import React, { useState } from "react";
// At the top of the file, replace the import:
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Battery Registration Integration
import { useBatteryContext } from "../../../contexts/BatteryContext.js";

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

const DataViewer = ({
  loading,
  error,
  data,
  selectedTagId,
  onFetchData,
  // Removed baseIds prop since we're using battery registration
}) => {
  const [selectedNode, setSelectedNode] = useState("Node0");
  const [selectedParameter, setSelectedParameter] = useState("Temperature");

  // Battery Registration Integration
  const { selectedBattery } = useBatteryContext();

  if (loading) {
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
        Loading data...
      </div>
    );
  }

  if (error) {
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
        {error}
      </div>
    );
  }

  if (!data) {
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

  // Safety checks and fallback data
  if (!data || typeof data !== "object") {
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
        No data available or invalid data format.
      </div>
    );
  }

  // Helper function to safely extract value (handles both direct values and DynamoDB format)
  const safeExtractValue = (value) => {
    if (value === null || value === undefined) return null;
    // If it's a DynamoDB format object with N, S, etc.
    if (typeof value === "object" && value.N) return value.N;
    if (typeof value === "object" && value.S) return value.S;
    // Otherwise return the value directly
    return value;
  };
  console.log("Structure:", data);
  // Ensure data structure exists with fallbacks
  const safeData = {
    Node0: data.Node0 || { voltage: { cellVoltages: [] }, temperature: {} },
    Node1: data.Node1 || { voltage: { cellVoltages: [] }, temperature: {} },
    Pack: data.Pack || {},
    Cell: data.Cell || {},
    Temperature: data.Temperature || {},
    SOC: data.SOC || {},
  };

  // Ensure the selected node exists
  const currentNode = safeData[selectedNode] || {
    voltage: { cellVoltages: [] },
    temperature: {},
  };

  // Helper functions to transform data with safety checks
  const transformTemperatureData = (temperatureData) => {
    if (!temperatureData || typeof temperatureData !== "object") {
      return [{ time: 1 }]; // Return minimal data structure
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
      return [{ time: 1 }]; // Return minimal data structure
    }

    const transformedData = [];
    voltageData.cellVoltages.forEach((voltages, index) => {
      if (Array.isArray(voltages)) {
        const timeData = { time: index + 1 };
        voltages.forEach((voltage, cellIndex) => {
          timeData[`Cell ${cellIndex + 1}`] = voltage;
        });
        transformedData.push(timeData);
      }
    });
    return transformedData.length > 0 ? transformedData : [{ time: 1 }];
  };

  // Get the data for the selected node and parameter with safety checks
  const nodeData = currentNode;
  const graphData =
    selectedParameter === "Temperature"
      ? transformTemperatureData(nodeData.temperature)
      : transformVoltageData(nodeData.voltage);

  // Data for metrics with fallbacks
  const packData = [
    {
      name: "Total Battery Voltage",
      value: safeData.Pack.totalBattVoltage || 0,
    },
    { name: "Total Load Voltage", value: safeData.Pack.totalLoadVoltage || 0 },
    { name: "Total Current", value: safeData.Pack.totalCurrent || 0 },
  ];

  // Debug: Log the data structure to console
  console.log("Full data structure:", data);
  console.log("Cell data:", safeData.Cell);
  console.log("Temperature data:", safeData.Temperature);

  // Try multiple possible property names and locations
  const maxCellVoltageCell =
    safeExtractValue(data.MaximumCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.MaximumCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.maxCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.cellNo) ||
    safeExtractValue(safeData.Cell.maxCellNo) ||
    "N/A";

  const maxCellVoltageNode =
    safeExtractValue(data.MaximumCellVoltageNode) ||
    safeExtractValue(safeData.Cell.MaximumCellVoltageNode) ||
    safeExtractValue(safeData.Cell.maxCellVoltageNode) ||
    safeExtractValue(safeData.Cell.node) ||
    safeExtractValue(safeData.Cell.maxNode) ||
    "N/A";

  const minCellVoltageCell =
    safeExtractValue(data.MinimumCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.MinimumCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.minCellVoltageCellNo) ||
    safeExtractValue(safeData.Cell.minCellNo) ||
    "N/A";

  const minCellVoltageNode =
    safeExtractValue(data.MinimumCellVoltageNode) ||
    safeExtractValue(safeData.Cell.MinimumCellVoltageNode) ||
    safeExtractValue(safeData.Cell.minCellVoltageNode) ||
    safeExtractValue(safeData.Cell.minNode) ||
    "N/A";

  const cellData = [
    {
      name: `Max Cell Voltage\n(Cell ${maxCellVoltageCell})`,
      value: safeData.Cell.maxCellVoltage || 0,
      cellNumber: maxCellVoltageCell,
      node: maxCellVoltageNode,
    },
    {
      name: `Min Cell Voltage\n(Cell ${minCellVoltageCell})`,
      value: safeData.Cell.minCellVoltage || 0,
      cellNumber: minCellVoltageCell,
      node: minCellVoltageNode,
    },
  ];

  // Try multiple possible property names for temperature nodes
  const maxCellTempNode = safeExtractValue(data.Temperature.maxCellTempNode);
  const minCellTempNode = safeExtractValue(data.Temperature.minCellTempNode);

  const temperatureData = [
    {
      name: `Max Cell Temp\n(Node ${maxCellTempNode})`,
      value: safeData.Temperature.maxCellTemp || 0,
      node: maxCellTempNode,
    },
    {
      name: `Min Cell Temp\n(Node ${minCellTempNode})`,
      value: safeData.Temperature.minCellTemp || 0,
      node: minCellTempNode,
    },
  ];

  // Extract threshold values for reference lines
  const cellThresholds = {
    over: safeData.Cell.thresholdOverVoltage || 0,
    under: safeData.Cell.thresholdUnderVoltage || 0,
  };

  const temperatureThresholds = {
    over: safeData.Temperature.thresholdOverTemp || 0,
    under: safeData.Temperature.thresholdUnderTemp || 0,
  };

  const socData = [
    { name: "SOC Percent", value: safeData.SOC.socPercent || 0 },

    { name: "Balance SOC Percent", value: safeData.SOC.balanceSOCPercent || 0 },
  ];

  const gridContainerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(120px, 1fr))", // Minimum 120px per column
    gridTemplateRows: "repeat(5, minmax(80px, 1fr))", // Minimum 80px per row
    gap: "clamp(4px, 1vw, 12px)", // Responsive gap
    height: "80vh",
    padding: "clamp(8px, 2vw, 24px)", // Responsive padding
    backgroundColor: colors.backgroundSolid,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden", // Hide overflow when elements don't fit
    minWidth: "960px", // Minimum container width before elements start disappearing
  };

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "clamp(4px, 1vw, 12px)", // Responsive border radius
    padding: "clamp(8px, 2vw, 20px)", // Responsive padding
    border: `1px solid ${colors.secondary}`,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    minWidth: "0", // Allow shrinking
    minHeight: "0", // Allow shrinking
    overflow: "hidden", // Hide content if too small
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
        /* Base responsive styles */
        .grid-container {
          display: grid;
          grid-template-columns: repeat(8, minmax(120px, 1fr));
          grid-template-rows: repeat(5, minmax(80px, 1fr));
          gap: clamp(4px, 1vw, 12px);
          height: 80vh;
          padding: clamp(8px, 2vw, 24px);
          background-color: ${colors.backgroundSolid};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          min-width: 960px;
        }

        /* Responsive breakpoints for zoom levels */
        @media (max-width: 1400px) {
          .grid-container {
            grid-template-columns: repeat(8, minmax(100px, 1fr));
            grid-template-rows: repeat(5, minmax(70px, 1fr));
            gap: clamp(3px, 0.8vw, 10px);
          }
        }

        @media (max-width: 1200px) {
          .grid-container {
            grid-template-columns: repeat(8, minmax(90px, 1fr));
            grid-template-rows: repeat(5, minmax(60px, 1fr));
            gap: clamp(2px, 0.6vw, 8px);
          }
          
          /* Hide less critical elements */
          .hide-on-small { display: none !important; }
        }

        @media (max-width: 1000px) {
          .grid-container {
            grid-template-columns: repeat(6, minmax(80px, 1fr));
            grid-template-rows: repeat(4, minmax(50px, 1fr));
            gap: clamp(2px, 0.5vw, 6px);
          }
          
          /* Reorganize grid for smaller screens */
          .div4 { grid-column: span 2; grid-row: span 2; grid-row-start: 2; }
          .div5 { grid-column: span 2; grid-row: span 2; grid-column-start: 1; grid-row-start: 4; display: none; }
          .div6 { grid-column: span 2; grid-row: span 2; grid-column-start: 3; grid-row-start: 2; }
          .div7 { grid-column: span 2; grid-row: span 2; grid-column-start: 3; grid-row-start: 4; display: none; }
          .div10 { grid-column: span 2; grid-column-start: 5; grid-row-start: 2; }
          .div16 { grid-column: span 4; grid-row: span 2; grid-column-start: 1; grid-row-start: 4; }
          .div17 { grid-column: span 2; grid-column-start: 5; grid-row-start: 3; }
        }

        @media (max-width: 800px) {
          .grid-container {
            grid-template-columns: repeat(4, minmax(60px, 1fr));
            grid-template-rows: repeat(4, minmax(40px, 1fr));
            gap: clamp(1px, 0.3vw, 4px);
          }
          
          /* Show only essential elements */
          .div4 { grid-column: span 2; grid-row: span 1; grid-row-start: 2; }
          .div5 { display: none !important; }
          .div6 { grid-column: span 2; grid-row: span 1; grid-column-start: 3; grid-row-start: 2; }
          .div7 { display: none !important; }
          .div10 { grid-column: span 2; grid-column-start: 1; grid-row-start: 3; }
          .div16 { grid-column: span 4; grid-row: span 2; grid-column-start: 1; grid-row-start: 4; }
          .div17 { grid-column: span 2; grid-column-start: 3; grid-row-start: 3; }
        }

        @media (max-width: 600px) {
          .grid-container {
            grid-template-columns: repeat(2, minmax(50px, 1fr));
            grid-template-rows: repeat(3, minmax(30px, 1fr));
            gap: 2px;
          }
          
          /* Ultra-compact mode - only header and main graph */
          .div1 { grid-column: span 2; }
          .div4, .div5, .div6, .div7, .div10, .div17 { display: none !important; }
          .div16 { grid-column: span 2; grid-row: span 2; grid-column-start: 1; grid-row-start: 2; }
        }

        /* Responsive text sizing */
        .responsive-text-lg { font-size: clamp(0.8rem, 2vw, 1.5rem); }
        .responsive-text-md { font-size: clamp(0.7rem, 1.5vw, 1.1rem); }
        .responsive-text-sm { font-size: clamp(0.6rem, 1vw, 0.9rem); }
        .responsive-text-xs { font-size: clamp(0.5rem, 0.8vw, 0.7rem); }

        /* Chart responsive sizing */
        .recharts-wrapper { min-height: 40px !important; }
        .recharts-cartesian-axis-tick-value { font-size: clamp(6px, 1.2vw, 12px) !important; }
        .recharts-legend-wrapper { font-size: clamp(6px, 1vw, 10px) !important; }
      `}</style>

      <div className="grid-container">
        {/* div1 - Header with title and battery info - Updated to show current battery */}
        <div
          className="div1"
          style={{
            ...cardStyle,
            gridColumn: "span 8 / span 8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "60px",
          }}
        >
          <h1
            className="responsive-text-lg"
            style={{
              fontWeight: "700",
              color: colors.textDark,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginRight: "auto",
            }}
          >
            Data Analytics
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 2vw, 16px)",
              marginLeft: "auto",
            }}
          >
            {/* Show current battery info */}
            {selectedBattery && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(0.7rem, 1.2vw, 0.9rem)",
                    color: colors.textLight,
                    fontWeight: "500",
                  }}
                >
                  Analyzing Battery:
                </span>
                <span
                  style={{
                    fontSize: "clamp(0.8rem, 1.4vw, 1rem)",
                    color: colors.textDark,
                    fontWeight: "700",
                    fontFamily: "monospace",
                  }}
                >
                  {selectedBattery.nickname || selectedBattery.serialNumber} ({selectedBattery.batteryId})
                </span>
              </div>
            )}

            <button
              onClick={onFetchData}
              style={{
                ...buttonStyle(false),
                backgroundColor: colors.accent,
                color: "#fff",
                fontWeight: "700",
                fontSize: "clamp(0.6rem, 1.2vw, 0.9rem)",
                padding: "clamp(4px, 1vw, 8px) clamp(8px, 2vw, 16px)",
                whiteSpace: "nowrap",
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* div4 - Cell Data with Reference Lines */}
        <div
          className="div4"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridRow: "span 2 / span 2",
            gridRowStart: 2,
            minWidth: "180px", // MINIMUM SIZE CONTROL - Change this value
            minHeight: "160px", // MINIMUM SIZE CONTROL - Change this value
          }}
        >
          <h3
            className="responsive-text-md"
            style={{
              fontWeight: "600",
              color: colors.textDark,
              margin: "0 0 clamp(4px, 1vw, 10px) 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Cell Data
          </h3>
          <div style={{ flex: 1, minHeight: "100px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cellData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.secondary}
                />
                <XAxis
                  dataKey="name"
                  stroke={colors.textLight}
                  fontSize="clamp(6px, 1.2vw, 10px)"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke={colors.textLight}
                  fontSize="clamp(6px, 1.2vw, 10px)"
                  domain={[
                    Math.min(
                      cellThresholds.under * 0.9,
                      cellThresholds.under - 0.5
                    ),
                    Math.max(
                      cellThresholds.over * 1.1,
                      cellThresholds.over + 0.5
                    ),
                  ]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
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
                          <p
                            style={{ margin: "0 0 4px 0", fontWeight: "bold" }}
                          >
                            {label}
                          </p>
                          <p
                            style={{ margin: "0 0 2px 0" }}
                          >{`Value: ${payload[0].value}V`}</p>
                          {data.cellNumber && data.cellNumber !== "N/A" && (
                            <p
                              style={{ margin: "0 0 2px 0" }}
                            >{`Cell Number: ${data.cellNumber}`}</p>
                          )}
                          {data.node && data.node !== "N/A" && (
                            <p
                              style={{ margin: "0" }}
                            >{`Node: ${data.node}`}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill={colors.primary} />
                {/* Reference Lines for Thresholds */}
                <ReferenceLine
                  y={cellThresholds.over}
                  stroke="#ff0000"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <ReferenceLine
                  y={cellThresholds.under}
                  stroke="#ff0000"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* div5 - Pack Data */}
        <div
          className="div5"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridRow: "span 2 / span 2",
            gridColumnStart: 1,
            gridRowStart: 4,
            minWidth: "180px",
            minHeight: "160px",
            background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)",
            border: `1px solid ${colors.secondary}40`,
          }}
        >
          <h3
            className="responsive-text-md"
            style={{
              fontWeight: "700",
              color: colors.textDark,
              margin: "0 0 clamp(6px, 1.5vw, 12px) 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontSize: "clamp(0.7rem, 1.4vw, 0.95rem)",
            }}
          >
            Pack Data
          </h3>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "clamp(4px, 1vw, 10px)",
              minHeight: "100px",
            }}
          >
            {/* Total Battery Voltage KPI Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #f8fffe 0%, #f0fffe 100%)",
                border: `1px solid ${colors.atlantis}20`,
                borderLeft: `4px solid ${colors.atlantis}`,
                borderRadius: "8px",
                padding: "clamp(6px, 1.2vw, 12px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                minHeight: "38px",
                boxShadow: "0 2px 8px rgba(135, 200, 66, 0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.55rem, 1.1vw, 0.75rem)",
                    color: colors.textLight,
                    fontWeight: "600",
                    lineHeight: 1,
                    marginBottom: "3px",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  Battery Voltage
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
                    color: colors.textDark,
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "monospace",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {(safeData.Pack.totalBattVoltage || 0).toFixed(1)}V
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
                    color: colors.atlantis,
                    fontWeight: "700",
                    background: `${colors.atlantis}15`,
                    padding: "2px 6px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.atlantis}30`,
                    textShadow: "none",
                  }}
                >
                  ACTIVE
                </div>
              </div>
            </div>

            {/* Total Load Voltage KPI Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
                border: `1px solid ${colors.primary}20`,
                borderLeft: `4px solid ${colors.primary}`,
                borderRadius: "8px",
                padding: "clamp(6px, 1.2vw, 12px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                minHeight: "38px",
                boxShadow: "0 2px 8px rgba(99, 99, 98, 0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.55rem, 1.1vw, 0.75rem)",
                    color: colors.textLight,
                    fontWeight: "600",
                    lineHeight: 1,
                    marginBottom: "3px",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  Load Voltage
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
                    color: colors.textDark,
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "monospace",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {(safeData.Pack.totalLoadVoltage || 0).toFixed(1)}V
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
                    color: colors.primary,
                    fontWeight: "700",
                    background: `${colors.primary}15`,
                    padding: "2px 6px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.primary}30`,
                    textShadow: "none",
                  }}
                >
                  STABLE
                </div>
              </div>
            </div>

            {/* Total Current KPI Card - DYNAMIC */}
            <div
              style={{
                background:
                  (safeData.Pack.totalCurrent || 0) < 0
                    ? "linear-gradient(135deg, #f8fffe 0%, #f0fffe 100%)" // Green background for charging (negative current)
                    : "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)", // Gray background for discharging (positive current)
                border:
                  (safeData.Pack.totalCurrent || 0) < 0
                    ? `1px solid ${colors.atlantis}20`
                    : `1px solid ${colors.primary}20`,
                borderLeft:
                  (safeData.Pack.totalCurrent || 0) < 0
                    ? `4px solid ${colors.atlantis}` // Green border for charging
                    : `4px solid ${colors.primary}`, // Gray border for discharging
                borderRadius: "8px",
                padding: "clamp(6px, 1.2vw, 12px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                minHeight: "38px",
                boxShadow:
                  (safeData.Pack.totalCurrent || 0) < 0
                    ? "0 2px 8px rgba(135, 200, 66, 0.08)"
                    : "0 2px 8px rgba(99, 99, 98, 0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.55rem, 1.1vw, 0.75rem)",
                    color: colors.textLight,
                    fontWeight: "600",
                    lineHeight: 1,
                    marginBottom: "3px",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  Total Current
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
                    color: colors.textDark,
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "monospace",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {(safeData.Pack.totalCurrent || 0).toFixed(2)}A
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
                    color:
                      (safeData.Pack.totalCurrent || 0) < 0
                        ? colors.atlantis
                        : colors.primary,
                    fontWeight: "700",
                    background:
                      (safeData.Pack.totalCurrent || 0) < 0
                        ? `${colors.atlantis}15`
                        : `${colors.primary}15`,
                    padding: "2px 6px",
                    borderRadius: "12px",
                    border:
                      (safeData.Pack.totalCurrent || 0) < 0
                        ? `1px solid ${colors.atlantis}30`
                        : `1px solid ${colors.primary}30`,
                    textShadow: "none",
                  }}
                >
                  {(safeData.Pack.totalCurrent || 0) < 0
                    ? "CHARGING"
                    : "DISCHARGING"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* div6 - Temperature Data with Reference Lines */}
        <div
          className="div6"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridRow: "span 2 / span 2",
            gridColumnStart: 3,
            gridRowStart: 2,
            minWidth: "180px", // MINIMUM SIZE CONTROL - Change this value
            minHeight: "160px", // MINIMUM SIZE CONTROL - Change this value
          }}
        >
          <h3
            className="responsive-text-md"
            style={{
              fontWeight: "600",
              color: colors.textDark,
              margin: "0 0 clamp(4px, 1vw, 10px) 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Temperature Data
          </h3>
          <div style={{ flex: 1, minHeight: "100px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.secondary}
                />
                <XAxis
                  dataKey="name"
                  stroke={colors.textLight}
                  fontSize="clamp(6px, 1.2vw, 10px)"
                  angle={0}
                  textAnchor="middle"
                  interval={0}
                  height={40}
                />
                <YAxis
                  stroke={colors.textLight}
                  fontSize="clamp(6px, 1.2vw, 10px)"
                  domain={[
                    Math.min(
                      temperatureThresholds.under * 0.9,
                      temperatureThresholds.under - 5
                    ),
                    Math.max(
                      temperatureThresholds.over * 1.1,
                      temperatureThresholds.over + 5
                    ),
                  ]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
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
                          <p
                            style={{ margin: "0 0 4px 0", fontWeight: "bold" }}
                          >
                            {label}
                          </p>
                          <p
                            style={{ margin: "0 0 2px 0" }}
                          >{`Value: ${payload[0].value}°C`}</p>
                          {data.node && data.node !== "N/A" && (
                            <p
                              style={{ margin: "0" }}
                            >{`Node: ${data.node}`}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill={colors.primary} />
                {/* Reference Lines for Temperature Thresholds */}
                <ReferenceLine
                  y={temperatureThresholds.over}
                  stroke="#ff0000"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <ReferenceLine
                  y={temperatureThresholds.under}
                  stroke="#ff0000"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* div7 - SOC Data */}
        {/* div7 - SOC Data */}
        <div
          className="div7"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridRow: "span 2 / span 2",
            gridColumnStart: 3,
            gridRowStart: 4,
            minWidth: "180px",
            minHeight: "160px",
            background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)",
            border: `1px solid ${colors.secondary}40`,
          }}
        >
          <h3
            className="responsive-text-md"
            style={{
              fontWeight: "700",
              color: colors.textDark,
              margin: "0 0 clamp(6px, 1.5vw, 12px) 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontSize: "clamp(0.7rem, 1.4vw, 0.95rem)",
            }}
          >
            SOC Data
          </h3>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "clamp(8px, 1.5vw, 16px)", // Larger gap since only 2 items
              minHeight: "100px",
            }}
          >
            {/* SOC Percent KPI Card */}
            <div
              style={{
                background:
                  (safeData.SOC.socPercent || 0) > 80
                    ? "linear-gradient(135deg, #f8fffe 0%, #f0fffe 100%)" // Green background for charged
                    : (safeData.SOC.socPercent || 0) < 20
                    ? "linear-gradient(135deg, #fdfcfc 0%, #f8f8f8 100%)" // Gray background for low
                    : "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)", // Light gray for normal
                border:
                  (safeData.SOC.socPercent || 0) > 80
                    ? `1px solid ${colors.atlantis}20`
                    : `1px solid ${colors.primary}20`,
                borderLeft:
                  (safeData.SOC.socPercent || 0) > 80
                    ? `4px solid ${colors.atlantis}` // Green border for charged
                    : `4px solid ${colors.primary}`, // Gray border for normal/low
                borderRadius: "8px",
                padding: "clamp(8px, 1.5vw, 16px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                minHeight: "50px",
                boxShadow:
                  (safeData.SOC.socPercent || 0) > 80
                    ? "0 2px 8px rgba(135, 200, 66, 0.08)"
                    : "0 2px 8px rgba(99, 99, 98, 0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.55rem, 1.1vw, 0.75rem)",
                    color: colors.textLight,
                    fontWeight: "600",
                    lineHeight: 1,
                    marginBottom: "3px",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  SOC Percent
                </div>
                <div
                  style={{
                    fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
                    color: colors.textDark,
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "monospace",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {(safeData.SOC.socPercent || 0).toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
                    color:
                      (safeData.SOC.socPercent || 0) > 80
                        ? colors.atlantis
                        : colors.primary,
                    fontWeight: "700",
                    background:
                      (safeData.SOC.socPercent || 0) > 80
                        ? `${colors.atlantis}15`
                        : `${colors.primary}15`,
                    padding: "2px 6px",
                    borderRadius: "12px",
                    border:
                      (safeData.SOC.socPercent || 0) > 80
                        ? `1px solid ${colors.atlantis}30`
                        : `1px solid ${colors.primary}30`,
                    textShadow: "none",
                  }}
                >
                  {(safeData.SOC.socPercent || 0) > 80
                    ? "CHARGED"
                    : (safeData.SOC.socPercent || 0) < 20
                    ? "NEED CHARGING"
                    : "NORMAL"}
                </div>
              </div>
            </div>

            {/* Balance SOC Percent KPI Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)", // Gray like Load Voltage
                border: `1px solid ${colors.primary}20`,
                borderLeft: `4px solid ${colors.primary}`, // Gray border
                borderRadius: "8px",
                padding: "clamp(8px, 1.5vw, 16px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                minHeight: "50px",
                boxShadow: "0 2px 8px rgba(99, 99, 98, 0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.55rem, 1.1vw, 0.75rem)",
                    color: colors.textLight,
                    fontWeight: "600",
                    lineHeight: 1,
                    marginBottom: "3px",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  Balance SOC %
                </div>
                <div
                  style={{
                    fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
                    color: colors.textDark,
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "monospace",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {(safeData.SOC.balanceSOCPercent || 0).toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
                    color: colors.primary,
                    fontWeight: "700",
                    background: `${colors.primary}15`,
                    padding: "2px 6px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.primary}30`,
                    textShadow: "none",
                  }}
                >
                  BALANCE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* div10 - Graph Type Toggle */}
        <div
          className="div10"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridColumnStart: 7,
            gridRowStart: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(4px, 1vw, 8px)",
            minWidth: "140px", // MINIMUM SIZE CONTROL - Change this value
            minHeight: "80px", // MINIMUM SIZE CONTROL - Change this value
          }}
        >
          <h4
            className="responsive-text-sm"
            style={{
              fontWeight: "600",
              color: colors.textDark,
              margin: 0,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Graph Type
          </h4>
          <button
            onClick={() =>
              setSelectedParameter(
                selectedParameter === "Temperature" ? "Voltage" : "Temperature"
              )
            }
            style={{
              ...buttonStyle(false),
              backgroundColor: colors.accent,
              color: "#fff",
              width: "100%",
              fontSize: "clamp(0.6rem, 1.2vw, 0.8rem)",
              padding: "clamp(4px, 1vw, 8px)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedParameter === "Temperature"
              ? "→ Voltage"
              : "→ Temperature"}
          </button>
        </div>

        {/* div16 - Main Graph */}
        <div
          className="div16"
          style={{
            ...cardStyle,
            gridColumn: "span 4 / span 4",
            gridRow: "span 3 / span 3",
            gridColumnStart: 5,
            gridRowStart: 3,
            minWidth: "300px", // MINIMUM SIZE CONTROL - Change this value
            minHeight: "200px", // MINIMUM SIZE CONTROL - Change this value
          }}
        >
          <h3
            className="responsive-text-md"
            style={{
              fontWeight: "600",
              color: colors.textDark,
              margin: "0 0 clamp(8px, 2vw, 15px) 0",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedParameter} Trends - {selectedNode}
          </h3>
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
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* div17 - Node Toggle */}
        <div
          className="div17"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridColumnStart: 5,
            gridRowStart: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(4px, 1vw, 8px)",
            minWidth: "140px", // MINIMUM SIZE CONTROL - Change this value
            minHeight: "80px", // MINIMUM SIZE CONTROL - Change this value
          }}
        >
          <h4
            className="responsive-text-sm"
            style={{
              fontWeight: "600",
              color: colors.textDark,
              margin: 0,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Node Selection
          </h4>
          <button
            onClick={() =>
              setSelectedNode(selectedNode === "Node0" ? "Node1" : "Node0")
            }
            style={{
              ...buttonStyle(false),
              backgroundColor: colors.primary,
              color: "#fff",
              width: "100%",
              fontSize: "clamp(0.6rem, 1.2vw, 0.8rem)",
              padding: "clamp(4px, 1vw, 8px)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            → {selectedNode === "Node0" ? "Node 1" : "Node 0"}
          </button>
        </div>
      </div>
    </>
  );
};

export default DataViewer;