import React, { useState } from "react";

const PackControllerSystemMetrics = ({ 
  packControllerState, 
  roundValue, 
  colors = {}, 
  isMobile = false 
}) => {
  const [activeTab, setActiveTab] = useState("system");

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

  // Helper function to render metric item
  const MetricItem = ({ label, value, unit = "", limits = "", status = "normal", icon = "" }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "8px 12px" : "10px 16px",
        backgroundColor: status === "critical" ? colors.error + "10" : 
                       status === "warning" ? colors.warning + "10" : 
                       colors.background,
        borderRadius: "6px",
        marginBottom: "8px",
        border: `1px solid ${status === "critical" ? colors.error + "30" : 
                              status === "warning" ? colors.warning + "30" : 
                              colors.lightGrey}`,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = status === "critical" ? colors.error + "20" : 
                                               status === "warning" ? colors.warning + "20" : 
                                               colors.lightGrey + "50";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = status === "critical" ? colors.error + "10" : 
                                               status === "warning" ? colors.warning + "10" : 
                                               colors.background;
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "600",
            color: colors.textDark,
            marginBottom: "2px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
          {label}
        </div>
        {limits && (
          <div
            style={{
              fontSize: isMobile ? "10px" : "11px",
              color: colors.textLight,
              fontWeight: "400",
            }}
          >
            {limits}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: isMobile ? "14px" : "16px",
          fontWeight: "700",
          color: status === "critical" ? colors.error : 
                 status === "warning" ? colors.warning : 
                 colors.textDark,
        }}
      >
        {value}{unit}
      </div>
    </div>
  );

  const systemMetrics = [
    {
      label: "Device ID",
      value: getValue("DeviceId"),
      icon: "🔧",
      limits: "",
    },
    {
      label: "Serial Number",
      value: getValue("SerialNumber"),
      icon: "#️⃣",
      limits: "",
    },
    {
      label: "Firmware Model",
      value: getValue("FirmwareModel"),
      icon: "💾",
      limits: "",
    },
    {
      label: "Battery Model",
      value: getValue("BatteryModel"),
      icon: "🔋",
      limits: "",
    },
    {
      label: "System State",
      value: getValue("State"),
      icon: "⚙️",
      limits: "State codes: 0-7",
    },
    {
      label: "Events Count",
      value: getValue("Events"),
      icon: "📊",
      limits: "Cumulative events",
    },
  ];

  const powerMetrics = [
    {
      label: "Total Voltage",
      value: roundValue(getValue("TotalVoltage")),
      unit: "V",
      icon: "⚡",
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`,
      status: getStatusColor(getValue("TotalVoltage"), {
        critical: { min: getValue("SystemMinVoltage", 0) * 0.9, max: getValue("SystemMaxVoltage", 100) * 1.1 },
        warning: { min: getValue("SystemMinVoltage", 0) * 0.95, max: getValue("SystemMaxVoltage", 100) * 1.05 }
      }) === colors.error ? "critical" : 
             getStatusColor(getValue("TotalVoltage"), {
               warning: { min: getValue("SystemMinVoltage", 0) * 0.95, max: getValue("SystemMaxVoltage", 100) * 1.05 }
             }) === colors.warning ? "warning" : "normal"
    },
    {
      label: "System Voltage",
      value: roundValue(getValue("SystemVoltage")),
      unit: "V",
      icon: "🔌",
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`,
    },
    {
      label: "Total Current",
      value: roundValue(getValue("TotalCurrent")),
      unit: "A",
      icon: "⚡",
      limits: `Max: ±${getValue("SystemChargeCurrent", 144)}A`,
      status: Math.abs(getValue("TotalCurrent")) > getValue("SystemChargeCurrent", 144) * 0.9 ? "warning" : "normal"
    },
    {
      label: "System Current",
      value: roundValue(getValue("SystemCurrent")),
      unit: "A",
      icon: "🔄",
      limits: `Max: ±${getValue("SystemDischargeCurrent", 144)}A`,
    },
    {
      label: "Charge Current Limit",
      value: getValue("SystemChargeCurrent", 144),
      unit: "A",
      icon: "🔋",
      limits: "Maximum charge current",
    },
    {
      label: "Discharge Current Limit",
      value: getValue("SystemDischargeCurrent", 144),
      unit: "A",
      icon: "⚡",
      limits: "Maximum discharge current",
    },
  ];

  const batteryMetrics = [
    {
      label: "State of Charge",
      value: roundValue(getValue("SOCPercent")),
      unit: "%",
      icon: "🔋",
      limits: "Range: 0-100%",
      status: getValue("SOCPercent") < 20 ? "critical" : getValue("SOCPercent") < 50 ? "warning" : "normal"
    },
    {
      label: "System SOC",
      value: roundValue(getValue("SystemSoc")),
      unit: "%",
      icon: "📊",
      limits: "System-level SOC",
    },
    {
      label: "State of Health",
      value: roundValue(getValue("SOHPercent")),
      unit: "%",
      icon: "💚",
      limits: "Range: 80-100%",
      status: getValue("SOHPercent") < 80 ? "critical" : getValue("SOHPercent") < 90 ? "warning" : "normal"
    },
    {
      label: "System SOH",
      value: roundValue(getValue("SystemSoh")),
      unit: "%",
      icon: "📈",
      limits: "System-level SOH",
    },
    {
      label: "System Temperature",
      value: roundValue(getValue("SystemTemp")),
      unit: "°C",
      icon: "🌡️",
      limits: "Range: -10 to 60°C",
      status: getValue("SystemTemp") > 50 ? "warning" : getValue("SystemTemp") > 60 ? "critical" : "normal"
    },
    {
      label: "Carbon Offset",
      value: roundValue(getValue("Carbon_Offset_kg")),
      unit: "kg",
      icon: "🌱",
      limits: "Cumulative CO₂ offset",
    },
  ];

  const getTabData = () => {
    switch (activeTab) {
      case "system": return systemMetrics;
      case "power": return powerMetrics;
      case "battery": return batteryMetrics;
      default: return systemMetrics;
    }
  };

  const tabData = getTabData();
  const tabs = [
    { key: "system", label: "System", icon: "⚙️" },
    { key: "power", label: "Power", icon: "⚡" },
    { key: "battery", label: "Battery", icon: "🔋" },
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
          marginBottom: "12px",
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: isMobile ? "8px 12px" : "10px 16px",
              backgroundColor: activeTab === tab.key ? colors.primary : "transparent",
              color: activeTab === tab.key ? colors.white : colors.textDark,
              border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${colors.primary}` : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? "600" : "normal",
              fontSize: isMobile ? "11px" : "13px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              borderRadius: "4px 4px 0 0",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = colors.lightGrey;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={{ fontSize: isMobile ? "12px" : "14px" }}>{tab.icon}</span>
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
        <div style={{ padding: "0 4px" }}>
          {tabData.map((metric, index) => (
            <MetricItem
              key={index}
              label={metric.label}
              value={metric.value}
              unit={metric.unit || ""}
              limits={metric.limits || ""}
              status={metric.status || "normal"}
              icon={metric.icon || ""}
            />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "8px",
          padding: "8px 12px",
          backgroundColor: colors.background,
          borderRadius: "6px",
          fontSize: isMobile ? "10px" : "11px",
          color: colors.textLight,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        Last updated: {new Date().toLocaleTimeString()} • 
        Device: {getValue("TagID", "N/A")}
      </div>
    </div>
  );
};

export default PackControllerSystemMetrics;