import React, { useState } from "react";
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
} from "recharts";

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
  setSelectedTagId,
  onFetchData,
  baseIds,
}) => {
  const [selectedNode, setSelectedNode] = useState("Node0");
  const [selectedParameter, setSelectedParameter] = useState("Temperature");

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
          height: "800vh",
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

  const cellData = [
    { name: "Max Cell Voltage", value: safeData.Cell.maxCellVoltage || 0 },
    { name: "Min Cell Voltage", value: safeData.Cell.minCellVoltage || 0 },
    {
      name: "Threshold Over Voltage",
      value: safeData.Cell.thresholdOverVoltage || 0,
    },
    {
      name: "Threshold Under Voltage",
      value: safeData.Cell.thresholdUnderVoltage || 0,
    },
  ];

  const temperatureData = [
    { name: "Max Cell Temp", value: safeData.Temperature.maxCellTemp || 0 },
    { name: "Min Cell Temp", value: safeData.Temperature.minCellTemp || 0 },
    {
      name: "Threshold Over Temp",
      value: safeData.Temperature.thresholdOverTemp || 0,
    },
    {
      name: "Threshold Under Temp",
      value: safeData.Temperature.thresholdUnderTemp || 0,
    },
  ];

  const socData = [
    { name: "SOC Percent", value: safeData.SOC.socPercent || 0 },
    { name: "SOC Ah", value: safeData.SOC.socAh || 0 },
    { name: "Balance SOC Percent", value: safeData.SOC.balanceSOCPercent || 0 },
    { name: "Balance SOC Ah", value: safeData.SOC.balanceSOCAh || 0 },
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

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${colors.secondary}`,
    backgroundColor: "#fff",
    color: colors.textDark,
    fontSize: "0.9rem",
    cursor: "pointer",
    minWidth: "150px",
  };

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
        {/* div1 - Header with title, battery selection, and fetch button */}
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
              marginRight: "auto", // Pushes everything else to the right
            }}
          >
            Data Analytics
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(4px, 1vw, 12px)",
              marginLeft: "auto", // Ensures this group stays on the right
            }}
          >
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              style={{
                ...selectStyle,
                minWidth: "clamp(80px, 15vw, 150px)",
                fontSize: "clamp(0.6rem, 1.2vw, 0.9rem)",
              }}
            >
              {baseIds &&
                baseIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
            </select>

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
              Fetch Data
            </button>
          </div>
        </div>

        {/* div4 - Cell Data */}
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
                <Bar dataKey="value" fill={colors.primary} />
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
            Pack Data
          </h3>
          <div style={{ flex: 1, minHeight: "100px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="clamp(25px, 8vw, 50px)"
                  fill={colors.primary}
                  label={(entry) => `${entry.value}`}
                  labelStyle={{ fontSize: "clamp(6px, 1.2vw, 10px)" }}
                >
                  {packData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.primary} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.backgroundSolid,
                    border: `1px solid ${colors.secondary}`,
                    borderRadius: "6px",
                    color: colors.textDark,
                    fontSize: "clamp(8px, 1.5vw, 12px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* div6 - Temperature Data */}
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
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke={colors.textLight}
                  fontSize="clamp(6px, 1.2vw, 10px)"
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
                <Bar dataKey="value" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* div7 - SOC Data */}
        <div
          className="div7"
          style={{
            ...cardStyle,
            gridColumn: "span 2 / span 2",
            gridRow: "span 2 / span 2",
            gridColumnStart: 3,
            gridRowStart: 4,
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
            SOC Data
          </h3>
          <div style={{ flex: 1, minHeight: "100px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={socData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="clamp(25px, 8vw, 50px)"
                  fill={colors.stormDust}
                  label={(entry) => `${entry.value}`}
                  labelStyle={{ fontSize: "clamp(6px, 1.2vw, 10px)" }}
                >
                  {socData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.stormDust} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.backgroundSolid,
                    border: `1px solid ${colors.secondary}`,
                    borderRadius: "6px",
                    color: colors.textDark,
                    fontSize: "clamp(8px, 1.5vw, 12px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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
                  : Array.from({ length: 14 }).map((_, index) => (
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
