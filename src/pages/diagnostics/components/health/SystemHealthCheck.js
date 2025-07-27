import React from "react";
import BatteryStatus from "./BatteryStatus.js";
import CellHealth from "./CellHealth.js";
import BalanceEvents from "./BalanceEvents.js";
import SystemAlerts from "./SystemAlerts.js";
import { colors } from "../../utils/diagnosticsHelpers.js";

const SystemHealthCheck = ({ bmsData }) => {
  const currentData = bmsData?.lastMinuteData?.[0] || {};
  const hasData = currentData && Object.keys(currentData).length > 0;

  // Enhanced data validation
  const hasMinimalRequiredData =
    hasData &&
    (currentData.SOCPercent?.N ||
      currentData.TotalBattVoltage?.N ||
      currentData.State?.S ||
      currentData.MinimumCellVoltage?.N ||
      currentData.MaximumCellVoltage?.N);

  console.log("SystemHealthCheck Debug:", {
    hasBmsData: !!bmsData,
    hasLastMinuteData: !!bmsData?.lastMinuteData,
    lastMinuteDataLength: bmsData?.lastMinuteData?.length || 0,
    hasData,
    hasMinimalRequiredData,
    currentDataKeys: Object.keys(currentData),
    sampleData: {
      SOCPercent: currentData.SOCPercent?.N,
      TotalBattVoltage: currentData.TotalBattVoltage?.N,
      State: currentData.State?.S,
    },
  });

  const EmptyStateCard = ({ title, message }) => (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "120px",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "10px", opacity: 0.5 }}>
        📊
      </div>
      <h3
        style={{
          fontSize: "0.95rem",
          marginBottom: "8px",
          color: colors.textDark,
          borderBottom: `1px solid ${colors.secondary}`,
          paddingBottom: "6px",
          width: "100%",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.8rem",
          color: colors.textLight,
          margin: "0",
          fontStyle: "italic",
        }}
      >
        {message}
      </p>
    </div>
  );

  const LoadingCard = ({ title }) => (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "120px",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #f3f3f3",
          borderTop: "2px solid #1259c3",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "10px",
        }}
      />
      <h3
        style={{
          fontSize: "0.95rem",
          marginBottom: "8px",
          color: colors.textDark,
          borderBottom: `1px solid ${colors.secondary}`,
          paddingBottom: "6px",
          width: "100%",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.8rem",
          color: colors.textLight,
          margin: "0",
          fontStyle: "italic",
        }}
      >
        Loading...
      </p>
    </div>
  );

  if (!hasData) {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div
          style={{
            width: "50%",
            backgroundColor: colors.background,
            padding: "20px",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              marginBottom: "15px",
              color: colors.textDark,
            }}
          >
            System Health Check
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "15px",
              flex: 1,
            }}
          >
            <EmptyStateCard
              title="Battery Status"
              message="No battery data available"
            />
            <EmptyStateCard
              title="Cell Health"
              message="No cell data available"
            />
            <EmptyStateCard
              title="Balance & Events"
              message="No balance data available"
            />
            <EmptyStateCard
              title="System Alerts"
              message="No system data available"
            />
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "rgba(255, 193, 7, 0.1)",
              borderRadius: "5px",
              borderLeft: `3px solid ${colors.highlight}`,
              fontSize: "0.85rem",
              color: colors.textDark,
            }}
          >
            <strong>No Data:</strong> This battery may not be sending data, or
            there might be a connectivity issue. Check the battery connection
            and try refreshing the page.
          </div>
        </div>
      </>
    );
  }

  if (!hasMinimalRequiredData) {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div
          style={{
            width: "50%",
            backgroundColor: colors.background,
            padding: "20px",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              marginBottom: "15px",
              color: colors.textDark,
            }}
          >
            System Health Check
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "15px",
              flex: 1,
            }}
          >
            <LoadingCard title="Battery Status" />
            <LoadingCard title="Cell Health" />
            <LoadingCard title="Balance & Events" />
            <LoadingCard title="System Alerts" />
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              borderRadius: "5px",
              borderLeft: `3px solid ${colors.accentBlue}`,
              fontSize: "0.85rem",
              color: colors.textDark,
            }}
          >
            <strong>Partial Data:</strong> Some diagnostic data is missing. The
            system is still collecting information from the battery.
          </div>
        </div>
      </>
    );
  }

  // Normal operation with data
  return (
    <div
      style={{
        width: "50%",
        backgroundColor: colors.background,
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          marginBottom: "15px",
          color: colors.textDark,
        }}
      >
        System Health Check
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "15px",
          flex: 1,
        }}
      >
        <BatteryStatus currentData={currentData} />
        <CellHealth currentData={currentData} />
        <BalanceEvents currentData={currentData} />
        <SystemAlerts currentData={currentData} />
      </div>

      {/* Data freshness indicator */}
      <div
        style={{
          marginTop: "15px",
          padding: "8px",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderRadius: "5px",
          borderLeft: `3px solid ${colors.accentGreen}`,
          fontSize: "0.8rem",
          color: colors.textDark,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          <strong>✓ Live Data:</strong> Diagnostics active
        </span>
        <span style={{ fontSize: "0.75rem", color: colors.textLight }}>
          Last update:{" "}
          {currentData.Timestamp?.N
            ? new Date(
                parseInt(currentData.Timestamp.N) * 1000
              ).toLocaleTimeString()
            : "Unknown"}
        </span>
      </div>
    </div>
  );
};

export default SystemHealthCheck;
