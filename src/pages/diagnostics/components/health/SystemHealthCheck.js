import React from "react";
import BatteryStatus from "./BatteryStatus.js";
import CellHealth from "./CellHealth.js";
import BalanceEvents from "./BalanceEvents.js";
import SystemAlerts from "./SystemAlerts.js";
import { colors } from "../../utils/diagnosticsHelpers.js";

const SystemHealthCheck = ({ bmsData }) => {
  const currentData = bmsData?.lastMinuteData?.[0] || {};

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
    </div>
  );
};

export default SystemHealthCheck;
