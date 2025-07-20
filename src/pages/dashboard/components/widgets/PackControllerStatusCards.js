import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const CardItem = ({ label, value, icon, color, isMobile, limits = null, percentage = null, maxValue = null }) => {
  const getResponsiveValue = (min, max, unit = 'px') => {
    return `clamp(${min}${unit}, ${(min + max) / 2}vw, ${max}${unit})`;
  };

  // Determine if this should be a gauge card
  const isGaugeCard = percentage !== null && maxValue !== null;

  // Standard card height for all cards
  const cardHeight = isMobile ? "80px" : "100px";

  if (isGaugeCard) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${color}20`,
          borderRadius: "8px",
          padding: isMobile ? "10px" : getResponsiveValue(12, 16),
          backgroundColor: `${color}05`,
          transition: "all 0.2s ease",
          height: cardHeight,
          minWidth: 0,
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Gauge */}
        <div
          style={{
            width: isMobile ? "50px" : "70px",
            height: isMobile ? "50px" : "70px",
            marginRight: isMobile ? "8px" : "12px",
            flexShrink: 0,
          }}
        >
          <CircularProgressbar
            value={Math.max(0, Math.min(100, percentage))}
            text={`${Math.round(parseFloat(value) || 0)}`}
            strokeWidth={12}
            styles={buildStyles({
              textSize: isMobile ? "18px" : "16px",
              pathColor: "#70ab5c",
              textColor: "#212121",
              trailColor: "#f0f0f0",
              pathTransitionDuration: 0.5,
              strokeLinecap: 'butt',
              text: {
                fontWeight: 'bold',
                dominantBaseline: 'middle',
                textAnchor: 'middle',
              },
            })}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              color: "#757575",
              fontSize: isMobile ? "10px" : getResponsiveValue(10, 12),
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
              fontSize: isMobile ? "16px" : getResponsiveValue(16, 20),
              color: "#212121",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: "2px",
            }}
          >
            {value}
          </div>
          {limits && (
            <div
              style={{
                fontSize: isMobile ? "9px" : getResponsiveValue(9, 10),
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
  }

  // Regular card - same size as gauge card but with icon layout
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${color}20`,
        borderRadius: "8px",
        padding: isMobile ? "10px" : getResponsiveValue(12, 16),
        backgroundColor: `${color}05`,
        transition: "all 0.2s ease",
        height: cardHeight, // Same height as gauge cards
        minWidth: 0,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon - same size as gauge area */}
      {icon && (
        <div
          style={{
            marginRight: isMobile ? "8px" : "12px",
            color: color,
            fontSize: isMobile ? "24px" : "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? "50px" : "70px",
            height: isMobile ? "50px" : "70px",
            borderRadius: "50%",
            backgroundColor: `${color}15`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      
      {/* Info - same layout as gauge cards */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          style={{
            color: "#757575",
            fontSize: isMobile ? "10px" : getResponsiveValue(10, 12),
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
            fontSize: isMobile ? "16px" : getResponsiveValue(16, 20),
            color: "#212121",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "2px",
          }}
        >
          {value}
        </div>
        {limits && (
          <div
            style={{
              fontSize: isMobile ? "9px" : getResponsiveValue(9, 10),
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

const PackControllerStatusCards = ({ 
  packControllerState, 
  roundValue, 
  colors = {}, 
  isMobile,
  expanded = false 
}) => {
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

  // Enhanced card items with gauge values included
  const cardItems = [
    // Gauge Cards (with circular progress)
    {
      label: "State of Charge",
      value: `${roundValue(getValue("SOCPercent"))}%`,
      icon: "🔋",
      color: getStatusColor(getValue("SOCPercent"), 0, 100, colors),
      limits: "Range: 0-100%",
      percentage: getValue("SOCPercent"),
      maxValue: 100,
      isGauge: true
    },
    {
      label: "System Temperature",
      value: `${roundValue(getValue("SystemTemp"))}°C`,
      icon: "🌡️",
      color: getStatusColor(getValue("SystemTemp"), -10, 60, colors),
      limits: "Range: -10 to 60°C",
      percentage: ((getValue("SystemTemp") + 10) / 70) * 100,
      maxValue: 60,
      isGauge: true
    },
    {
      label: "Total Voltage",
      value: `${roundValue(getValue("TotalVoltage"))}V`,
      icon: "⚡",
      color: getStatusColor(getValue("TotalVoltage"), getValue("SystemMinVoltage", 0), getValue("SystemMaxVoltage", 100), colors),
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`,
      percentage: ((getValue("TotalVoltage") - getValue("SystemMinVoltage", 0)) / (getValue("SystemMaxVoltage", 100) - getValue("SystemMinVoltage", 0))) * 100,
      maxValue: getValue("SystemMaxVoltage", 100),
      isGauge: true
    },
    {
      label: "Total Current",
      value: `${roundValue(getValue("TotalCurrent"))}A`,
      icon: "⚡",
      color: getStatusColor(Math.abs(getValue("TotalCurrent")), 0, getValue("SystemChargeCurrent", 144), colors),
      limits: `Max: ±${getValue("SystemChargeCurrent", 144)}A`,
      percentage: (Math.abs(getValue("TotalCurrent")) / getValue("SystemChargeCurrent", 144)) * 100,
      maxValue: getValue("SystemChargeCurrent", 144),
      isGauge: true
    },

    // Regular Cards - same size as gauge cards
    {
      label: "State of Health",
      value: `${roundValue(getValue("SOHPercent"))}%`,
      icon: "💚",
      color: getStatusColor(getValue("SOHPercent"), 80, 100, colors),
      limits: "Min: 80%"
    },
    {
      label: "System Voltage",
      value: `${roundValue(getValue("SystemVoltage"))}V`,
      icon: "🔌",
      color: getStatusColor(getValue("SystemVoltage"), getValue("SystemMinVoltage", 0), getValue("SystemMaxVoltage", 100), colors),
      limits: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`
    },
    {
      label: "System Current",
      value: `${roundValue(getValue("SystemCurrent"))}A`,
      icon: "🔄",
      color: getStatusColor(Math.abs(getValue("SystemCurrent")), 0, getValue("SystemDischargeCurrent", 144), colors),
      limits: `Max: ±${getValue("SystemDischargeCurrent", 144)}A`
    },
    {
      label: "CO₂ Offset",
      value: `${roundValue(getValue("Carbon_Offset_kg"))}kg`,
      icon: "🌱",
      color: colors.success || "#4CAF50",
      limits: "Cumulative"
    },
    {
      label: "System State",
      value: getValue("State", "N/A"),
      icon: "⚙️",
      color: colors.primary || "#2196F3",
      limits: "Operating State"
    },
    {
      label: "Total Events",
      value: getValue("Events", 0),
      icon: "📊",
      color: colors.primary || "#2196F3",
      limits: "System Events"
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: expanded 
          ? (isMobile ? "1fr" : "repeat(3, 1fr)") // 3 columns when expanded
          : (isMobile ? "1fr" : "repeat(2, 1fr)"), // 2 columns normal
        gap: isMobile ? "8px" : "clamp(8px, 1.5vw, 12px)",
        height: "100%",
        alignContent: "start",
        maxHeight: expanded ? "500px" : "300px",
        overflow: "auto",
        padding: "4px",
        // Ensure equal row heights
        gridAutoRows: isMobile ? "80px" : "100px",
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
          percentage={item.percentage}
          maxValue={item.maxValue}
        />
      ))}
    </div>
  );
};

export default PackControllerStatusCards;