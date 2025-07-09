import React from "react";
import { colors, getHealthStatus } from "../../utils/diagnosticsHelpers.js";

const SystemAlerts = ({ currentData }) => {
  const alerts = getHealthStatus(currentData);

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
        System Alerts
      </h3>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          fontSize: "0.85rem",
        }}
      >
        {alerts.length === 0 ? (
          <div
            style={{
              padding: "8px",
              backgroundColor: "#e8f5e9",
              borderRadius: "4px",
              color: colors.accentGreen,
              marginBottom: "8px",
            }}
          >
            ✓ All systems normal
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  padding: "6px",
                  marginBottom: "4px",
                  backgroundColor:
                    alert.type === "critical"
                      ? "rgba(244, 67, 54, 0.1)"
                      : alert.type === "warning"
                      ? "rgba(255, 193, 7, 0.1)"
                      : "rgba(33, 150, 243, 0.1)",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${
                    alert.type === "critical"
                      ? colors.accentRed
                      : alert.type === "warning"
                      ? colors.highlight
                      : colors.accentBlue
                  }`,
                  fontSize: "0.8rem",
                  color: colors.textDark,
                }}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>
          <p style={{ color: colors.textLight, fontSize: "0.75rem" }}>
            Last:{" "}
            {currentData.Timestamp?.N
              ? new Date(
                  parseInt(currentData.Timestamp.N) * 1000
                ).toLocaleTimeString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemAlerts;
