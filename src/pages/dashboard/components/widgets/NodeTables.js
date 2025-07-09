import React, { useState } from "react";
import PropTypes from "prop-types";

const NodeTables = ({ nodeData, condensed = false, colors = {} }) => {
  const [activeView, setActiveView] = useState("voltages");

  // Define colors using provided colors object or fallback to defaults
  const tableColors = {
    textDark: colors.textDark || "#333333",
    textLight: colors.textLight || "#666666",
    primary: colors.primary || "#818181",
    secondary: colors.secondary || "#c0c0c0",
    accentGreen: colors.accentGreen || "#8BC34A",
    accentRed: colors.accentRed || "#FF0000",
    accentOrange: colors.accentOrange || "#FF9800",
    accentYellow: colors.accentYellow || "#FFC107",
    accentBlue: colors.accentBlue || "#2196F3",
    highlight: colors.highlight || "#FFC107",
    background: colors.background || "rgba(192, 192, 192, 0.1)",
  };

  // Voltage thresholds
  const VOLTAGE_THRESHOLDS = {
    CRITICAL_OVER: 3.8,
    THRESHOLD_OVER: 3.65,
    BALANCE: 3.45,
    THRESHOLD_UNDER: 2.8,
    CRITICAL_UNDER: 2.0,
  };

  // Temperature thresholds
  const TEMP_THRESHOLDS = {
    OVER: 60,
    UNDER: 0,
  };

  // Renders status cell with color and threshold indicators
  const renderStatus = (value, dataType) => {
    let status, statusColor, statusIcon;

    if (dataType === "voltages") {
      if (value >= VOLTAGE_THRESHOLDS.CRITICAL_OVER) {
        status = "CRITICAL HIGH";
        statusColor = tableColors.accentRed;
        statusIcon = "⚠️";
      } else if (value >= VOLTAGE_THRESHOLDS.THRESHOLD_OVER) {
        status = "HIGH";
        statusColor = tableColors.accentOrange;
        statusIcon = "⬆️";
      } else if (value >= VOLTAGE_THRESHOLDS.BALANCE) {
        status = "BALANCE";
        statusColor = tableColors.accentBlue;
        statusIcon = "⚖️";
      } else if (value <= VOLTAGE_THRESHOLDS.CRITICAL_UNDER) {
        status = "CRITICAL LOW";
        statusColor = tableColors.accentRed;
        statusIcon = "⚠️";
      } else if (value <= VOLTAGE_THRESHOLDS.THRESHOLD_UNDER) {
        status = "LOW";
        statusColor = tableColors.accentOrange;
        statusIcon = "⬇️";
      } else {
        status = "OK";
        statusColor = tableColors.accentGreen;
        statusIcon = "✓";
      }
    } else {
      // temperatures
      if (value >= TEMP_THRESHOLDS.OVER) {
        status = "OVER TEMP";
        statusColor = tableColors.accentRed;
        statusIcon = "🔥";
      } else if (value < TEMP_THRESHOLDS.UNDER) {
        status = "UNDER TEMP";
        statusColor = tableColors.accentRed;
        statusIcon = "❄️";
      } else {
        status = "OK";
        statusColor = tableColors.accentGreen;
        statusIcon = "✓";
      }
    }

    return (
      <div
        style={{
          backgroundColor: statusColor,
          color: "white",
          padding: condensed ? "2px 5px" : "5px 10px",
          borderRadius: "4px",
          fontSize: condensed ? "0.7rem" : "0.8rem",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          textAlign: "center",
          minWidth: condensed ? "80px" : "120px",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: condensed ? "0.8rem" : "1rem" }}>{statusIcon}</span>
        <span>{status}</span>
      </div>
    );
  };

  // Render threshold legend
  const renderThresholdLegend = (dataType) => {
    const legends = dataType === "voltages" ? [
      { label: "Critical High", threshold: `≥${VOLTAGE_THRESHOLDS.CRITICAL_OVER}V`, color: tableColors.accentRed, icon: "⚠️" },
      { label: "High", threshold: `≥${VOLTAGE_THRESHOLDS.THRESHOLD_OVER}V`, color: tableColors.accentOrange, icon: "⬆️" },
      { label: "Balance", threshold: `≥${VOLTAGE_THRESHOLDS.BALANCE}V`, color: tableColors.accentBlue, icon: "⚖️" },
      { label: "OK", threshold: `${VOLTAGE_THRESHOLDS.THRESHOLD_UNDER}V-${VOLTAGE_THRESHOLDS.THRESHOLD_OVER}V`, color: tableColors.accentGreen, icon: "✓" },
      { label: "Low", threshold: `≤${VOLTAGE_THRESHOLDS.THRESHOLD_UNDER}V`, color: tableColors.accentOrange, icon: "⬇️" },
      { label: "Critical Low", threshold: `≤${VOLTAGE_THRESHOLDS.CRITICAL_UNDER}V`, color: tableColors.accentRed, icon: "⚠️" },
    ] : [
      { label: "Over Temp", threshold: `≥${TEMP_THRESHOLDS.OVER}°C`, color: tableColors.accentRed, icon: "🔥" },
      { label: "OK", threshold: `${TEMP_THRESHOLDS.UNDER}°C-${TEMP_THRESHOLDS.OVER}°C`, color: tableColors.accentGreen, icon: "✓" },
      { label: "Under Temp", threshold: `<${TEMP_THRESHOLDS.UNDER}°C`, color: tableColors.accentRed, icon: "❄️" },
    ];

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
          padding: "10px",
          backgroundColor: tableColors.background,
          borderRadius: "4px",
          fontSize: condensed ? "0.7rem" : "0.8rem",
        }}
      >
        {legends.map((legend, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: legend.color,
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "10px",
              }}
            >
              {legend.icon}
            </div>
            <span style={{ color: tableColors.textDark }}>
              {legend.label}: {legend.threshold}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = (dataType, node) => {
    const dataToRender =
      dataType === "voltages" ? node.data.cellVoltages : node.data.temperatures;
    
    // Get the number of cells to display
    const numCells = node.data.numcells || dataToRender.length;
    console.log(`${node.node} - Number of cells to display: ${numCells}`);
    
    // Limit data to the specified number of cells
    const limitedData = dataToRender.slice(0, numCells);

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: condensed ? "10px" : "15px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          flex: 1,
          margin: "0 5px",
          height: "100%",
          overflow: "auto",
          border: `1px solid ${tableColors.secondary}`,
        }}
      >
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "10px",
            color: tableColors.textDark,
            fontSize: condensed ? "0.95rem" : "1.1rem",
            borderBottom: `1px solid ${tableColors.secondary}`,
            paddingBottom: "5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {node.node}{" "}
            {dataType === "voltages" ? "Cell Voltages" : "Temperatures"}
          </span>
          <span style={{ fontSize: condensed ? "0.8rem" : "0.9rem", color: tableColors.textLight }}>
            ({limitedData.length} {dataType === "voltages" ? "cells" : "sensors"})
          </span>
        </h3>
        
        {/* Threshold Legend */}
        {renderThresholdLegend(dataType)}
        
        <div
          style={{
            height: condensed ? "auto" : "calc(100% - 100px)",
            overflow: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
              fontSize: condensed ? "0.8rem" : "0.9rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: tableColors.background }}>
                <th
                  style={{
                    padding: condensed ? "5px 8px" : "8px 12px",
                    border: `1px solid ${tableColors.secondary}`,
                    color: tableColors.textDark,
                    width: "20%",
                  }}
                >
                  {dataType === "voltages" ? "Cell" : "Sensor"}
                </th>
                <th
                  style={{
                    padding: condensed ? "5px 8px" : "8px 12px",
                    border: `1px solid ${tableColors.secondary}`,
                    color: tableColors.textDark,
                    width: "30%",
                  }}
                >
                  {dataType === "voltages" ? "Voltage (V)" : "Temperature (°C)"}
                </th>
                <th
                  style={{
                    padding: condensed ? "5px 8px" : "8px 12px",
                    border: `1px solid ${tableColors.secondary}`,
                    color: tableColors.textDark,
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {limitedData.map((value, i) => {
                const valueNum = parseFloat(value);
                const isWarning = dataType === "voltages" 
                  ? (valueNum >= VOLTAGE_THRESHOLDS.THRESHOLD_OVER || valueNum <= VOLTAGE_THRESHOLDS.THRESHOLD_UNDER)
                  : (valueNum >= TEMP_THRESHOLDS.OVER || valueNum < TEMP_THRESHOLDS.UNDER);
                const isCritical = dataType === "voltages"
                  ? (valueNum >= VOLTAGE_THRESHOLDS.CRITICAL_OVER || valueNum <= VOLTAGE_THRESHOLDS.CRITICAL_UNDER)
                  : false;
                
                return (
                  <tr 
                    key={i}
                    style={{
                      backgroundColor: isCritical ? "rgba(255, 0, 0, 0.1)" : isWarning ? "rgba(255, 152, 0, 0.1)" : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: condensed ? "4px 8px" : "8px 12px",
                        border: `1px solid ${tableColors.secondary}`,
                        color: tableColors.textDark,
                        fontWeight: isWarning ? "600" : "normal",
                      }}
                    >
                      {dataType === "voltages" ? `Cell ${i}` : `Sensor ${i}`}
                    </td>
                    <td
                      style={{
                        padding: condensed ? "4px 8px" : "8px 12px",
                        border: `1px solid ${tableColors.secondary}`,
                        color: tableColors.textDark,
                        fontWeight: isWarning ? "600" : "normal",
                      }}
                    >
                      {value}
                    </td>
                    <td
                      style={{
                        padding: condensed ? "4px 8px" : "8px 12px",
                        border: `1px solid ${tableColors.secondary}`,
                        textAlign: "center",
                      }}
                    >
                      {renderStatus(valueNum, dataType)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: condensed ? "10px" : "15px",
        }}
      >
        <button
          onClick={() => setActiveView("voltages")}
          style={{
            margin: "0 5px",
            padding: condensed ? "5px 15px" : "8px 16px",
            backgroundColor:
              activeView === "voltages" ? tableColors.accentGreen : "#ffffff",
            color: activeView === "voltages" ? "#fff" : tableColors.textDark,
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            fontSize: condensed ? "0.8rem" : "0.9rem",
            transition: "all 0.3s ease",
          }}
        >
          Cell Voltages
        </button>
        <button
          onClick={() => setActiveView("temperatures")}
          style={{
            margin: "0 5px",
            padding: condensed ? "5px 15px" : "8px 16px",
            backgroundColor:
              activeView === "temperatures"
                ? tableColors.accentGreen
                : "#ffffff",
            color:
              activeView === "temperatures" ? "#fff" : tableColors.textDark,
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            fontSize: condensed ? "0.8rem" : "0.9rem",
            transition: "all 0.3s ease",
          }}
        >
          Temperature Data
        </button>
      </div>

      {/* Tables - Side by Side */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          height: "calc(100% - 50px)",
        }}
      >
        {nodeData.map((node, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              margin: "0 5px",
              height: "100%",
            }}
          >
            {renderTable(activeView, node)}
          </div>
        ))}
      </div>
    </div>
  );
};

NodeTables.propTypes = {
  nodeData: PropTypes.arrayOf(
    PropTypes.shape({
      node: PropTypes.string.isRequired,
      data: PropTypes.shape({
        cellVoltages: PropTypes.array.isRequired,
        temperatures: PropTypes.array.isRequired,
        numcells: PropTypes.number,
      }).isRequired,
    })
  ).isRequired,
  condensed: PropTypes.bool,
  colors: PropTypes.object,
};

export default NodeTables;