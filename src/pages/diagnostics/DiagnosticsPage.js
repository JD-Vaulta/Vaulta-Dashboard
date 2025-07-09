import React from "react";
import SystemHealthCheck from "./components/health/SystemHealthCheck.js";
import NotificationManager from "./components/notifications/NotificationManager.js";

const DiagnosticsPage = ({ bmsData, user }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#818181",
          marginBottom: "20px",
          borderBottom: "1px solid #c0c0c0",
          paddingBottom: "10px",
        }}
      >
        Battery Diagnostics
      </h1>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "10px",
          display: "flex",
          gap: "20px",
        }}
      >
        <SystemHealthCheck bmsData={bmsData} />
        <NotificationManager user={user} />
      </div>
    </div>
  );
};

export default DiagnosticsPage;
