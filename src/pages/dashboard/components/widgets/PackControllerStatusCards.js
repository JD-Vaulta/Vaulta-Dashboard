import React from "react";

const CardItem = ({ label, value, icon, color, isMobile, limits = null }) => {
  const getResponsiveValue = (min, max, unit = 'px') => {
    return `clamp(${min}${unit}, ${(min + max) / 2}vw, ${max}${unit})`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${color}20`,
        borderRadius: "6px",
        padding: isMobile ? "6px 8px" : getResponsiveValue(8, 12),
        backgroundColor: `${color}05`,
        transition: "all 0.2s ease",
        height: isMobile ? "50px" : "60px",
        maxHeight: "70px",
        minWidth: 0,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon && (
        <div
          style={{
            marginRight: isMobile ? "6px" : getResponsiveValue(8, 12),
            color: color,
            fontSize: isMobile ? "16px" : getResponsiveValue(18, 24),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? "24px" : getResponsiveValue(28, 36),
            height: isMobile ? "24px" : getResponsiveValue(28, 36),
            borderRadius: "6px",
            backgroundColor: `${color}15`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          style={{
            color: "#757575",
            fontSize: isMobile ? "9px" : getResponsiveValue(10, 12),
            marginBottom: "2px",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontWeight: "600",
            fontSize: isMobile ? "13px" : getResponsiveValue(14, 18),
            color: "#212121",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        {limits && (
          <div
            style={{
              fontSize: isMobile ? "8px" : getResponsiveValue(9, 10),
              color: "#999",
              fontWeight: "400",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {limits}
          </div>
        )}
      </div>
    </div>
  );
};

const PackControllerStatusCards = ({ packControllerState, roundValue, colors = {}, isMobile }) => {
  // Helper function to safely get values
  const getValue = (key, defaultValue = 0) => {
    return packControllerState?.[key]?.N || packControllerState?.[key] || defaultValue;
  };

  // Helper function to get status color based on value and limits
  const getStatusColor = (value, min, max, colors) => {
    const numValue = parseFloat(value);
    if (numValue >= max * 0.95 || numValue <= min * 1.05) {
      return colors.error || "#F44336";
    } else if (numValue >= max * 0.85 || numValue <= min * 1.15) {
      return colors.warning || "#FF9800";
    }
    return colors.success || "#4CAF50";
  };

  // Card items configuration with limits
  const cardItems = [
    {
      label: "SOC",
      value: `${roundValue(getValue("SOCPercent"))}%`,
      icon: "🔋",
      color: getStatusColor(getValue("SOCPercent"), 0, 100, colors),
      limits: "Range: 0-100%"
    },
    {
      label: "SOH",
      value: `${roundValue(getValue("SOHPercent"))}%`,
      icon: "💚",
      color: getStatusColor(getValue("SOHPercent"), 80, 100, colors),
      limits: "Min: 80%"
    },
    {
      label: "Total Voltage",
      value: `${roundValue(getValue("TotalVoltage"))}V`,
      icon: "⚡",
      color: getStatusColor(getValue("TotalVoltage"), getValue("SystemMinVoltage", 0), getValue("SystemMaxVoltage", 100), colors),
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`
    },
    {
      label: "System Voltage",
      value: `${roundValue(getValue("SystemVoltage"))}V`,
      icon: "🔌",
      color: getStatusColor(getValue("SystemVoltage"), getValue("SystemMinVoltage", 0), getValue("SystemMaxVoltage", 100), colors),
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`
    },
    {
      label: "Total Current",
      value: `${roundValue(getValue("TotalCurrent"))}A`,
      icon: "⚡",
      color: getStatusColor(Math.abs(getValue("TotalCurrent")), 0, getValue("SystemChargeCurrent", 144), colors),
      limits: `Max: ±${getValue("SystemChargeCurrent", 144)}A`
    },
    {
      label: "System Current",
      value: `${roundValue(getValue("SystemCurrent"))}A`,
      icon: "🔄",
      color: getStatusColor(Math.abs(getValue("SystemCurrent")), 0, getValue("SystemDischargeCurrent", 144), colors),
      limits: `Max: ±${getValue("SystemDischargeCurrent", 144)}A`
    },
    {
      label: "System Temp",
      value: `${roundValue(getValue("SystemTemp"))}°C`,
      icon: "🌡️",
      color: getStatusColor(getValue("SystemTemp"), -10, 60, colors),
      limits: "Range: -10-60°C"
    },
    {
      label: "CO₂ Offset",
      value: `${roundValue(getValue("Carbon_Offset_kg"))}kg`,
      icon: "🌱",
      color: colors.success || "#4CAF50",
      limits: "Cumulative"
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: isMobile ? "6px" : "clamp(6px, 1.5vw, 10px)",
        height: "100%",
        alignContent: "start",
        maxHeight: "300px",
        overflow: "auto",
      }}
    >
      {cardItems.map((item, index) => (
        <CardItem
          key={index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          color={item.color}
          isMobile={isMobile}
          limits={item.limits}
        />
      ))}
    </div>
  );
};

export default PackControllerStatusCards;