import React from "react";
import { colors, formatValue } from "../../utils/diagnosticsHelpers.js";

const BalanceEvents = ({ currentData }) => {
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
        Balance & Events
      </h3>
      <div style={{ flex: 1, fontSize: "0.85rem" }}>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Node 0:{" "}
          {currentData.Node00BalanceStatus?.N === "0" ? "false" : "true"}
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Node 1:{" "}
          {currentData.Node01BalanceStatus?.N === "0" ? "false" : "true"}
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Balance SOC: {formatValue(currentData.BalanceSOCPercent?.N)}%
        </p>
        <p style={{ color: colors.textLight, marginBottom: "6px" }}>
          Threshold: {formatValue(currentData.CellBalanceThresholdVoltage?.N)}V
        </p>
        <div
          style={{
            marginTop: "auto",
            padding: "6px",
            backgroundColor: colors.background,
            borderRadius: "4px",
            borderLeft: `3px solid ${colors.accentBlue}`,
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: colors.textDark,
              fontWeight: "500",
              margin: 0,
            }}
          >
            Events: {parseInt(currentData.Events?.N || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceEvents;
