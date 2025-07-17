import React, { useState, useEffect } from "react";
import PackControllerStatusCards from "../widgets/PackControllerStatusCards.js";
import PackControllerGauges from "../widgets/PackControllerGauges.js";
import PackControllerAlarms from "../widgets/PackControllerAlarms.js";
import PackControllerSystemMetrics from "../widgets/PackControllerSystemMetrics.js";
import PackControllerAlarmHistory from "../widgets/PackControllerAlarmHistory.js";

const PackControllerView = ({ 
  packControllerState, 
  roundValue, 
  colors, 
  RefreshButton, 
  isMobile,
  activeSection = "overview" 
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTablet = windowWidth < 1024;

  // Calculate responsive font sizes and spacing
  const getResponsiveValue = (min, max, unit = 'px') => {
    return `clamp(${min}${unit}, ${(min + max) / 2}vw, ${max}${unit})`;
  };

  // Check if we have active alarms
  const getActiveAlarms = () => {
    if (!packControllerState) return [];
    
    const alarmKeys = [
      "VictronAlarmContactor", "VictronAlarmShortCircuit", "VictronAlarmCellHighTempCharge",
      "VictronAlarmHighCurrent", "VictronAlarmCellLowTemp", "VictronAlarmBmsInternal",
      "VictronAlarmCellHighTemp", "VictronAlarmCellHighVoltage", "VictronAlarmCellLowVoltage",
      "VictronAlarmCellImbalance", "VictronAlarmChargeHighCurrent", "VictronAlarmGeneral",
      "VictronAlarmCellLowTempCharge", "ProtectionChargeOverCurrent", "ProtectionDischargeOverCurrent",
      "ProtectionSystemError", "ProtectionCellUnderVoltage", "ProtectionCellOverVoltage",
      "ProtectionCellUnderTemperature", "ProtectionCellOverTemperature"
    ];

    const activeAlarms = [];
    alarmKeys.forEach(key => {
      const value = parseInt(packControllerState[key]?.N || packControllerState[key] || 0);
      if (value > 0) {
        activeAlarms.push({
          key,
          value,
          severity: key.includes("Protection") ? "critical" : "high"
        });
      }
    });

    return activeAlarms;
  };

  const activeAlarms = getActiveAlarms();

  if (activeSection === "alarms") {
    return (
      <div style={{
        height: "100%",
        maxHeight: "calc(100vh - 100px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        <PackControllerAlarmHistory 
          packControllerState={packControllerState}
          colors={colors}
          isMobile={isMobile}
          RefreshButton={RefreshButton}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isTablet ? "1fr" : "minmax(280px, 350px) 1fr",
        gridTemplateRows: isTablet ? "auto auto" : "1fr",
        gap: getResponsiveValue(8, 16),
        height: "100%",
        maxHeight: "calc(100vh - 100px)",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left Section - Status and Alarms */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: getResponsiveValue(8, 16),
          minHeight: 0,
          maxHeight: isTablet ? "auto" : "100%",
          overflow: "hidden",
        }}
      >
        {/* Pack Controller Status Section */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            padding: getResponsiveValue(12, 16),
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "0 0 auto",
            height: isTablet ? "auto" : "45%",
            maxHeight: isTablet ? "none" : "350px",
            minHeight: isMobile ? "auto" : "200px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: getResponsiveValue(8, 12),
              paddingBottom: getResponsiveValue(8, 12),
              borderBottom: `1px solid ${colors.lightGrey}`,
              flexWrap: "wrap",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                color: colors.textDark,
                fontWeight: "600",
                fontSize: getResponsiveValue(14, 18),
                margin: 0,
              }}
            >
              Pack Controller Status
            </h2>
            <RefreshButton />
          </div>
          <div style={{ 
            flex: 1, 
            overflow: "auto", 
            minHeight: 0,
            maxHeight: "100%",
          }}>
            <PackControllerStatusCards
              packControllerState={packControllerState}
              roundValue={roundValue}
              colors={colors}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Active Alarms Section */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: isMobile ? "250px" : "200px",
            maxHeight: isTablet ? "400px" : "400px",
            overflow: "hidden",
          }}
        >
          <PackControllerAlarms
            packControllerState={packControllerState}
            activeAlarms={activeAlarms}
            colors={colors}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Right Section - Metrics and Performance */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: getResponsiveValue(8, 16),
          minHeight: 0,
          maxHeight: isTablet ? "auto" : "100%",
          overflow: "hidden",
        }}
      >
        {/* Performance Gauges */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            padding: getResponsiveValue(12, 16),
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "0 0 auto",
            minHeight: isMobile ? "250px" : "200px",
            maxHeight: isTablet ? "350px" : "350px",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              color: colors.textDark,
              marginBottom: getResponsiveValue(8, 12),
              fontWeight: "600",
              fontSize: getResponsiveValue(14, 18),
              paddingBottom: getResponsiveValue(8, 12),
              borderBottom: `1px solid ${colors.lightGrey}`,
              flexShrink: 0,
            }}
          >
            Performance Metrics
          </h2>
          <div style={{ 
            flex: 1, 
            overflow: "hidden",
            minHeight: 0,
            maxHeight: "100%",
          }}>
            <PackControllerGauges
              packControllerState={packControllerState}
              roundValue={roundValue}
              colors={colors}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* System Metrics */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            padding: getResponsiveValue(12, 16),
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: isMobile ? "300px" : "250px",
            maxHeight: isTablet ? "400px" : "600px",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              color: colors.textDark,
              marginBottom: getResponsiveValue(8, 12),
              fontWeight: "600",
              fontSize: getResponsiveValue(14, 18),
              paddingBottom: getResponsiveValue(8, 12),
              borderBottom: `1px solid ${colors.lightGrey}`,
              flexShrink: 0,
            }}
          >
            System Details
          </h2>
          <div style={{ 
            flex: 1, 
            overflow: "auto",
            minHeight: 0,
            maxHeight: "100%",
          }}>
            <PackControllerSystemMetrics
              packControllerState={packControllerState}
              roundValue={roundValue}
              colors={colors}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackControllerView;