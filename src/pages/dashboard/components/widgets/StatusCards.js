import React from "react";

const CardItem = ({ label, value, icon, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      border: "1px solid #e8e8e8",
      borderRadius: "12px",
      padding: "20px",
      margin: "5px",
      backgroundColor: "#ffffff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      flex: "1 1 calc(50% - 10px)",
      minWidth: "140px",
      transition: "box-shadow 0.2s ease",
      height: "90px",
    }}
  >
    {icon && (
      <div
        style={{
          marginRight: "18px",
          color: color,
          fontSize: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          backgroundColor: `${color}15`, // 10% opacity of the color
        }}
      >
        {icon}
      </div>
    )}
    <div>
      <div
        style={{
          color: "#666666",
          fontSize: "14px",
          marginBottom: "6px",
          fontWeight: "600",
          letterSpacing: "0.3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: "700",
          fontSize: "22px",
          color: "#333333",
          letterSpacing: "0.5px",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const Cards = ({ bmsState, roundValue, colors = {} }) => {
  // Use provided colors or fallback to default
  const cardColors = {
    primary: colors.primary || "#2a5bd7",
    secondary: colors.secondary || "#a0a0a0",
    accentGreen: colors.accentGreen || "#3a9b40",
    accentRed: colors.accentRed || "#e53935",
    highlight: colors.highlight || "#ffb300",
  };

  // Organize all card items into a single array to use with flex layout
  const cardItems = [
    // State of Charge Items
    {
      label: "Capacity (Ah)",
      value: roundValue(bmsState.SOCAh?.N || 0),
      icon: "",
      color: cardColors.primary,
    },
    {
      label: "Battery Level",
      value: `${roundValue(bmsState.SOCPercent?.N || 0)}%`,
      icon: "",
      color: cardColors.primary,
    },
    // Voltage Readings
    {
      label: "Load Voltage",
      value: `${roundValue(bmsState.TotalLoadVoltage?.N || 0)} V`,
      icon: "",
      color: cardColors.primary,
    },
    {
      label: "Battery Voltage",
      value: `${roundValue(bmsState.TotalBattVoltage?.N || 0)} V`,
      icon: "",
      color: cardColors.accentGreen,
    },
    // Current & Environmental Impact
    {
      label: "Total Current",
      value: `${roundValue(bmsState.TotalCurrent?.N || 0)} A`,
      icon: "",
      color: cardColors.highlight,
    },
    {
      label: "Carbon Offset",
      value: `${roundValue(bmsState.Carbon_Offset_kg?.N || 0)} kg`,
      icon: "",
      color: cardColors.accentGreen,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        margin: "-5px", // To compensate for card margins
        height: "100%",
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
        />
      ))}
    </div>
  );
};

export default Cards;
