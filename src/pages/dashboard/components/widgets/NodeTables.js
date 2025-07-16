// Updated NodeTables.js with responsive design and professional color scheme
import React, { useState } from "react";
import PropTypes from "prop-types";

const NodeTables = ({ nodeData, condensed = false, colors = {}, isMobile }) => {
  const [activeView, setActiveView] = useState("voltages");

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
        statusColor = colors.error;
        statusIcon = "⚠️";
      } else if (value >= VOLTAGE_THRESHOLDS.THRESHOLD_OVER) {
        status = "HIGH";
        statusColor = colors.warning;
        statusIcon = "⬆️";
      } else if (value >= VOLTAGE_THRESHOLDS.BALANCE) {
        status = "BALANCE";
        statusColor = colors.primary;
        statusIcon = "⚖️";
      } else if (value <= VOLTAGE_THRESHOLDS.CRITICAL_UNDER) {
        status = "CRITICAL LOW";
        statusColor = colors.error;
        statusIcon = "⚠️";
      } else if (value <= VOLTAGE_THRESHOLDS.THRESHOLD_UNDER) {
        status = "LOW";
        statusColor = colors.warning;
        statusIcon = "⬇️";
      } else {
        status = "OK";
        statusColor = colors.success;
        statusIcon = "✓";
      }
    } else {
      // temperatures
      if (value >= TEMP_THRESHOLDS.OVER) {
        status = "OVER TEMP";
        statusColor = colors.error;
        statusIcon = "🔥";
      } else if (value < TEMP_THRESHOLDS.UNDER) {
        status = "UNDER TEMP";
        statusColor = colors.error;
        statusIcon = "❄️";
      } else {
        status = "OK";
        statusColor = colors.success;
        statusIcon = "✓";
      }
    }

    return (
      <div
        style={{
          backgroundColor: statusColor,
          color: colors.white,
          padding: isMobile ? "2px 4px" : "4px 8px",
          borderRadius: "4px",
          fontSize: isMobile ? "9px" : "11px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: isMobile ? "10px" : "12px" }}>{statusIcon}</span>
        {!isMobile && <span>{status}</span>}
      </div>
    );
  };

  // Render threshold legend
  const renderThresholdLegend = (dataType) => {
    const legends = dataType === "voltages" ? [
      { label: "Critical High", threshold: `≥${VOLTAGE_THRESHOLDS.CRITICAL_OVER}V`, color: colors.error, icon: "⚠️" },
      { label: "High", threshold: `≥${VOLTAGE_THRESHOLDS.THRESHOLD_OVER}V`, color: colors.warning, icon: "⬆️" },
      { label: "Balance", threshold: `≥${VOLTAGE_THRESHOLDS.BALANCE}V`, color: colors.primary, icon: "⚖️" },
      { label: "OK", threshold: `${VOLTAGE_THRESHOLDS.THRESHOLD_UNDER}V-${VOLTAGE_THRESHOLDS.THRESHOLD_OVER}V`, color: colors.success, icon: "✓" },
      { label: "Low", threshold: `≤${VOLTAGE_THRESHOLDS.THRESHOLD_UNDER}V`, color: colors.warning, icon: "⬇️" },
      { label: "Critical Low", threshold: `≤${VOLTAGE_THRESHOLDS.CRITICAL_UNDER}V`, color: colors.error, icon: "⚠️" },
    ] : [
      { label: "Over Temp", threshold: `≥${TEMP_THRESHOLDS.OVER}°C`, color: colors.error, icon: "🔥" },
      { label: "OK", threshold: `${TEMP_THRESHOLDS.UNDER}°C-${TEMP_THRESHOLDS.OVER}°C`, color: colors.success, icon: "✓" },
      { label: "Under Temp", threshold: `<${TEMP_THRESHOLDS.UNDER}°C`, color: colors.error, icon: "❄️" },
    ];

    if (isMobile) {
      // Show only a condensed legend on mobile
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginBottom: "8px",
            padding: "6px",
            backgroundColor: colors.background,
            borderRadius: "4px",
            fontSize: "9px",
            justifyContent: "center",
          }}
        >
          {legends.filter((_, index) => index % 2 === 0).map((legend, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "10px" }}>{legend.icon}</span>
              <span style={{ color: colors.textDark }}>
                {legend.label}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
          padding: "8px",
          backgroundColor: colors.background,
          borderRadius: "4px",
          fontSize: "11px",
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
                width: "14px",
                height: "14px",
                backgroundColor: legend.color,
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.white,
                fontSize: "8px",
              }}
            >
              {legend.icon}
            </div>
            <span style={{ color: colors.textDark }}>
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
    
    // Limit data to the specified number of cells
    const limitedData = dataToRender.slice(0, numCells);

    return (
      <div
        style={{
          background: colors.white,
          borderRadius: "6px",
          padding: isMobile ? "8px" : "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          flex: 1,
          margin: "0 4px",
          height: "100%",
          maxHeight: isMobile ? "400px" : "450px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${colors.lightGrey}`,
        }}
      >
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "8px",
            color: colors.textDark,
            fontSize: isMobile ? "12px" : "14px",
            paddingBottom: "8px",
            borderBottom: `1px solid ${colors.lightGrey}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {node.node}{" "}
            {dataType === "voltages" ? "Cell Voltages" : "Temperatures"}
          </span>
          <span style={{ fontSize: isMobile ? "10px" : "12px", color: colors.textLight }}>
            ({limitedData.length} {dataType === "voltages" ? "cells" : "sensors"})
          </span>
        </h3>
        
        {/* Threshold Legend */}
        {renderThresholdLegend(dataType)}
        
        <div
          style={{
            flex: 1,
            overflow: "auto",
            minHeight: 0,
            maxHeight: "300px",
          }}
        >
          <table
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
              fontSize: isMobile ? "11px" : "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: colors.background }}>
                <th
                  style={{
                    padding: isMobile ? "6px" : "8px",
                    border: `1px solid ${colors.lightGrey}`,
                    color: colors.textDark,
                    fontWeight: "600",
                    position: "sticky",
                    top: 0,
                    backgroundColor: colors.background,
                    fontSize: isMobile ? "10px" : "inherit",
                  }}
                >
                  {dataType === "voltages" ? "Cell" : "Sensor"}
                </th>
                <th
                  style={{
                    padding: isMobile ? "6px" : "8px",
                    border: `1px solid ${colors.lightGrey}`,
                    color: colors.textDark,
                    fontWeight: "600",
                    position: "sticky",
                    top: 0,
                    backgroundColor: colors.background,
                    fontSize: isMobile ? "10px" : "inherit",
                  }}
                >
                  {dataType === "voltages" ? "Voltage (V)" : "Temperature (°C)"}
                </th>
                <th
                  style={{
                    padding: isMobile ? "6px" : "8px",
                    border: `1px solid ${colors.lightGrey}`,
                    color: colors.textDark,
                    textAlign: "center",
                    fontWeight: "600",
                    position: "sticky",
                    top: 0,
                    backgroundColor: colors.background,
                    fontSize: isMobile ? "10px" : "inherit",
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
                      backgroundColor: isCritical ? colors.error + "10" : isWarning ? colors.warning + "10" : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: isMobile ? "4px 6px" : "6px 8px",
                        border: `1px solid ${colors.lightGrey}`,
                        color: colors.textDark,
                        fontWeight: isWarning ? "600" : "normal",
                        fontSize: isMobile ? "10px" : "inherit",
                      }}
                    >
                      {dataType === "voltages" ? `Cell ${i}` : `Sensor ${i}`}
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "4px 6px" : "6px 8px",
                        border: `1px solid ${colors.lightGrey}`,
                        color: colors.textDark,
                        fontWeight: isWarning ? "600" : "normal",
                        fontSize: isMobile ? "10px" : "inherit",
                      }}
                    >
                      {value}
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "4px 6px" : "6px 8px",
                        border: `1px solid ${colors.lightGrey}`,
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
          marginBottom: "12px",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setActiveView("voltages")}
          style={{
            padding: "8px 16px",
            backgroundColor:
              activeView === "voltages" ? colors.primary : colors.white,
            color: activeView === "voltages" ? colors.white : colors.textDark,
            border: `1px solid ${
              activeView === "voltages" ? colors.primary : colors.lightGrey
            }`,
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            transition: "all 0.2s ease",
          }}
        >
          Cell Voltages
        </button>
        <button
          onClick={() => setActiveView("temperatures")}
          style={{
            padding: "8px 16px",
            backgroundColor:
              activeView === "temperatures" ? colors.primary : colors.white,
            color: activeView === "temperatures" ? colors.white : colors.textDark,
            border: `1px solid ${
              activeView === "temperatures" ? colors.primary : colors.lightGrey
            }`,
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            transition: "all 0.2s ease",
          }}
        >
          Temperature Data
        </button>
      </div>

      {/* Tables - Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "8px",
          flex: 1,
          minHeight: 0,
          maxHeight: "calc(100vh - 200px)",
          overflow: "auto",
        }}
      >
        {nodeData.map((node, index) => (
          <div
            key={index}
            style={{
              minHeight: isMobile ? "250px" : "300px",
              maxHeight: isMobile ? "400px" : "500px",
              display: "flex",
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
  isMobile: PropTypes.bool,
};

export default NodeTables;