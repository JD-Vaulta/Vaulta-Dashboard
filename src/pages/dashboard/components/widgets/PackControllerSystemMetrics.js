import React, { useState } from "react";

const PackControllerSystemMetrics = ({ 
  packControllerState, 
  roundValue, 
  colors = {}, 
  isMobile = false,
  compact = false 
}) => {
  const [activeTab, setActiveTab] = useState("essential");

  // Helper function to safely get values
  const getValue = (key, defaultValue = 0) => {
    return packControllerState?.[key]?.N || packControllerState?.[key] || defaultValue;
  };

  // Helper function to get status color
  const getStatusColor = (value, thresholds = {}) => {
    if (thresholds.critical && (value >= thresholds.critical.max || value <= thresholds.critical.min)) {
      return colors.error || "#F44336";
    }
    if (thresholds.warning && (value >= thresholds.warning.max || value <= thresholds.warning.min)) {
      return colors.warning || "#FF9800";
    }
    return colors.success || "#4CAF50";
  };

  // Compact metric item for reduced scrolling
  const CompactMetricItem = ({ label, value, unit = "", status = "normal", icon = "" }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "6px 8px" : "8px 12px",
        backgroundColor: status === "critical" ? colors.error + "08" : 
                       status === "warning" ? colors.warning + "08" : 
                       "transparent",
        borderRadius: "4px",
        marginBottom: "4px",
        border: status !== "normal" ? `1px solid ${status === "critical" ? colors.error + "30" : colors.warning + "30"}` : "none",
        transition: "all 0.2s ease",
        minHeight: isMobile ? "32px" : "36px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = status === "critical" ? colors.error + "15" : 
                                               status === "warning" ? colors.warning + "15" : 
                                               colors.lightGrey + "30";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = status === "critical" ? colors.error + "08" : 
                                               status === "warning" ? colors.warning + "08" : 
                                               "transparent";
      }}
    >
      <div
        style={{
          fontSize: isMobile ? "11px" : "12px",
          fontWeight: "500",
          color: colors.textDark,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {icon && <span style={{ fontSize: "14px" }}>{icon}</span>}
        {label}
      </div>
      <div
        style={{
          fontSize: isMobile ? "12px" : "14px",
          fontWeight: "600",
          color: status === "critical" ? colors.error : 
                 status === "warning" ? colors.warning : 
                 colors.textDark,
        }}
      >
        {value}{unit}
      </div>
    </div>
  );

  // Grid layout for essential metrics
  const EssentialGrid = ({ metrics }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: "6px",
        padding: "4px",
      }}
    >
      {metrics.map((metric, index) => (
        <div
          key={index}
          style={{
            backgroundColor: colors.background,
            borderRadius: "6px",
            padding: isMobile ? "8px" : "10px",
            border: `1px solid ${colors.lightGrey}`,
            textAlign: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.lightGrey;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "16px" : "18px",
              marginBottom: "4px",
            }}
          >
            {metric.icon}
          </div>
          <div
            style={{
              fontSize: isMobile ? "10px" : "11px",
              color: colors.textLight,
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              marginBottom: "2px",
            }}
          >
            {metric.label}
          </div>
          <div
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              color: metric.status === "critical" ? colors.error : 
                     metric.status === "warning" ? colors.warning : 
                     colors.textDark,
            }}
          >
            {metric.value}{metric.unit}
          </div>
          {metric.subtext && (
            <div
              style={{
                fontSize: isMobile ? "9px" : "10px",
                color: colors.textLight,
                marginTop: "2px",
              }}
            >
              {metric.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Essential metrics (most important, displayed in grid)
  const essentialMetrics = [
    {
      label: "Device ID",
      value: getValue("DeviceId") || "N/A",
      unit: "",
      icon: "🔧",
      subtext: "Controller ID"
    },
    {
      label: "State",
      value: getValue("State"),
      unit: "",
      icon: "⚙️",
      subtext: "System State"
    },
    {
      label: "Events",
      value: getValue("Events"),
      unit: "",
      icon: "📊",
      subtext: "Total Events"
    },
    {
      label: "Model",
      value: getValue("BatteryModel") || getValue("FirmwareModel") || "N/A",
      unit: "",
      icon: "🔋",
      subtext: "Battery Model"
    },
  ];

  // Power metrics (compact list)
  const powerMetrics = [
    {
      label: "Charge Limit",
      value: getValue("SystemChargeCurrent", 144),
      unit: "A",
      icon: "🔋",
    },
    {
      label: "Discharge Limit",
      value: getValue("SystemDischargeCurrent", 144),
      unit: "A",
      icon: "⚡",
    },
    {
      label: "Min Voltage",
      value: getValue("SystemMinVoltage", 0),
      unit: "V",
      icon: "📉",
    },
    {
      label: "Max Voltage",
      value: getValue("SystemMaxVoltage", 100),
      unit: "V",
      icon: "📈",
    },
  ];

  // System info metrics (compact list)
  const systemMetrics = [
    {
      label: "Serial Number",
      value: getValue("SerialNumber") || "N/A",
      unit: "",
      icon: "#️⃣",
    },
    {
      label: "Firmware",
      value: getValue("FirmwareModel") || "N/A",
      unit: "",
      icon: "💾",
    },
    {
      label: "Tag ID",
      value: getValue("TagID") || "N/A",
      unit: "",
      icon: "🏷️",
    },
    {
      label: "Carbon Offset",
      value: roundValue(getValue("Carbon_Offset_kg")),
      unit: "kg",
      icon: "🌱",
    },
  ];

  const getTabData = () => {
    switch (activeTab) {
      case "essential": return { type: "grid", data: essentialMetrics };
      case "power": return { type: "list", data: powerMetrics };
      case "system": return { type: "list", data: systemMetrics };
      default: return { type: "grid", data: essentialMetrics };
    }
  };

  const tabData = getTabData();
  const tabs = compact ? [
    { key: "essential", label: "Essential", icon: "⭐" },
    { key: "power", label: "Power", icon: "⚡" },
    { key: "system", label: "Info", icon: "ℹ️" },
  ] : [
    { key: "essential", label: "Essential", icon: "⭐" },
    { key: "power", label: "Power Limits", icon: "⚡" },
    { key: "system", label: "System Info", icon: "ℹ️" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${colors.lightGrey}`,
          marginBottom: "8px",
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: isMobile ? "6px 8px" : "8px 12px",
              backgroundColor: activeTab === tab.key ? colors.primary : "transparent",
              color: activeTab === tab.key ? colors.white : colors.textDark,
              border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${colors.primary}` : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? "600" : "normal",
              fontSize: isMobile ? "10px" : "12px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              borderRadius: "4px 4px 0 0",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = colors.lightGrey + "50";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={{ fontSize: isMobile ? "11px" : "13px" }}>{tab.icon}</span>
            {!isMobile && tab.label}
          </button>
        ))}
      </div>

      {/* Metrics Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {tabData.type === "grid" ? (
          <EssentialGrid metrics={tabData.data} />
        ) : (
          <div style={{ padding: "0 4px" }}>
            {tabData.data.map((metric, index) => (
              <CompactMetricItem
                key={index}
                label={metric.label}
                value={metric.value}
                unit={metric.unit || ""}
                status={metric.status || "normal"}
                icon={metric.icon || ""}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "6px",
          padding: "6px 8px",
          backgroundColor: colors.background,
          borderRadius: "4px",
          fontSize: isMobile ? "9px" : "10px",
          color: colors.textLight,
          textAlign: "center",
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Updated: {new Date().toLocaleTimeString()}</span>
        <span>Device: {getValue("TagID", "N/A")}</span>
      </div>
    </div>
  );
};

export default PackControllerSystemMetrics;