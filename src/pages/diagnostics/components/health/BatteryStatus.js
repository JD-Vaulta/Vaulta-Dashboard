import React from "react";
import { colors, formatValue } from "../../utils/diagnosticsHelpers.js";

const BatteryStatus = ({ currentData }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          fontSize: "0.95rem",
          marginBottom: "12px",
          color: colors.textDark,
          borderBottom: `1px solid ${colors.secondary}`,
          paddingBottom: "6px",
        }}
      >
        Battery Status
      </h3>
      <div style={{ flex: 1, fontSize: "0.85rem" }}>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          SOC: {formatValue(currentData.SOCPercent?.N)}%
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          State:{" "}
          <span
            style={{
              color:
                currentData.State?.S === "BMS_STATE_ALL_ENABLED"
                  ? colors.accentGreen
                  : colors.highlight,
              fontWeight: "500",
            }}
          >
            {currentData.State?.S === "BMS_STATE_ALL_ENABLED"
              ? "Enabled"
              : currentData.State?.S || "Unknown"}
          </span>
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Temp: {formatValue(currentData.MaxCellTemp?.N)}°C
          <span
            style={{
              fontSize: "0.8rem",
              color:
                parseFloat(currentData.MaxCellTemp?.N || 0) <
                parseFloat(currentData.TempThresholdOverTemp?.N || 60)
                  ? colors.accentGreen
                  : colors.accentRed,
              marginLeft: "5px",
            }}
          >
            (
            {parseFloat(currentData.MaxCellTemp?.N || 0) <
            parseFloat(currentData.TempThresholdOverTemp?.N || 60)
              ? "OK"
              : "High"}
            )
          </span>
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Voltage: {formatValue(currentData.TotalBattVoltage?.N)}V
        </p>
        <p style={{ color: colors.textLight }}>
          Current: {formatValue(currentData.TotalCurrent?.N)}A
        </p>
      </div>
    </div>
  );
};

export default BatteryStatus;
