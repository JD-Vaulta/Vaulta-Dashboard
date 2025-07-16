import React from "react";

const CardItem = ({ label, value, icon, color, isMobile }) => {
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
      </div>
    </div>
  );
};

const Cards = ({ bmsState, roundValue, colors = {}, isMobile }) => {
  // Card items configuration
  const cardItems = [
    {
      label: "Capacity",
      value: `${roundValue(bmsState.SOCAh?.N || 0)} Ah`,
      icon: "⚡",
      color: colors.primary,
    },
    {
      label: "Battery",
      value: `${roundValue(bmsState.SOCPercent?.N || 0)}%`,
      icon: "🔋",
      color: colors.accent,
    },
    {
      label: "Load V",
      value: `${roundValue(bmsState.TotalLoadVoltage?.N || 0)}V`,
      icon: "⚡",
      color: colors.secondary,
    },
    {
      label: "Batt V",
      value: `${roundValue(bmsState.TotalBattVoltage?.N || 0)}V`,
      icon: "🔌",
      color: colors.success,
    },
    {
      label: "Current",
      value: `${roundValue(bmsState.TotalCurrent?.N || 0)}A`,
      icon: "⚡",
      color: colors.warning,
    },
    {
      label: "CO₂ Offset",
      value: `${roundValue(bmsState.Carbon_Offset_kg?.N || 0)}kg`,
      icon: "🌱",
      color: colors.success,
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
        />
      ))}
    </div>
  );
};

export default Cards;