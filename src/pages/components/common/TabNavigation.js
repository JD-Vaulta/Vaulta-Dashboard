import React from "react";
import { colors } from "../../diagnostics/utils/diagnosticsHelpers.js";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: "15px",
        borderBottom: `1px solid ${colors.secondary}`,
      }}
    >
      <button
        onClick={() => setActiveTab("subscribe")}
        style={{
          padding: "8px 16px",
          backgroundColor:
            activeTab === "subscribe" ? colors.accentBlue : "transparent",
          color: activeTab === "subscribe" ? "#fff" : colors.textDark,
          border: "none",
          borderBottom:
            activeTab === "subscribe"
              ? `2px solid ${colors.accentBlue}`
              : "none",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
          cursor: "pointer",
          fontWeight: activeTab === "subscribe" ? "600" : "normal",
          fontSize: "0.85rem",
          marginRight: "5px",
          marginBottom: "-1px",
          transition: "all 0.2s ease",
        }}
      >
        Subscribe
      </button>
      <button
        onClick={() => setActiveTab("manage")}
        style={{
          padding: "8px 16px",
          backgroundColor:
            activeTab === "manage" ? colors.accentBlue : "transparent",
          color: activeTab === "manage" ? "#fff" : colors.textDark,
          border: "none",
          borderBottom:
            activeTab === "manage" ? `2px solid ${colors.accentBlue}` : "none",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
          cursor: "pointer",
          fontWeight: activeTab === "manage" ? "600" : "normal",
          fontSize: "0.85rem",
          marginBottom: "-1px",
          transition: "all 0.2s ease",
        }}
      >
        Manage Subscriptions
      </button>
    </div>
  );
};

export default TabNavigation;
