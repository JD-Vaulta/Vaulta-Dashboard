import React from "react";
import { colors, formatValue } from "../../utils/diagnosticsHelpers.js";

const CellHealth = ({ currentData }) => {
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
        Cell Health
      </h3>
      <div style={{ flex: 1, fontSize: "0.85rem" }}>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Range: {formatValue(currentData.MinimumCellVoltage?.N)}V -{" "}
          {formatValue(currentData.MaximumCellVoltage?.N)}V
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Delta:{" "}
          {(
            (parseFloat(currentData.MaximumCellVoltage?.N || 0) -
              parseFloat(currentData.MinimumCellVoltage?.N || 0)) *
            1000
          ).toFixed(2)}{" "}
          mV
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Min: N{currentData.MinimumCellVoltageNode?.N || "?"}, C
          {currentData.MinimumCellVoltageCellNo?.N || "?"}
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Max: N{currentData.MaximumCellVoltageNode?.N || "?"}, C
          {currentData.MaximumCellVoltageCellNo?.N || "?"}
        </p>
        <div
          style={{
            marginTop: "auto",
            padding: "6px",
            backgroundColor:
              parseFloat(currentData.MinimumCellVoltage?.N || 0) >
              parseFloat(currentData.CellThresholdUnderVoltage?.N || 2.8)
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(244, 67, 54, 0.1)",
            borderRadius: "4px",
            fontSize: "0.8rem",
          }}
        >
          <span
            style={{
              color:
                parseFloat(currentData.MinimumCellVoltage?.N || 0) >
                parseFloat(currentData.CellThresholdUnderVoltage?.N || 2.8)
                  ? colors.accentGreen
                  : colors.accentRed,
              fontWeight: "500",
            }}
          >
            {parseFloat(currentData.MinimumCellVoltage?.N || 0) >
            parseFloat(currentData.CellThresholdUnderVoltage?.N || 2.8)
              ? "✓ Above threshold"
              : "⚠ Below threshold"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CellHealth;
