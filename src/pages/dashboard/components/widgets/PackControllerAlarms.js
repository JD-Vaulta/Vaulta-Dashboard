import React from "react";

const PackControllerAlarms = ({ 
  packControllerState, 
  activeAlarms = [], 
  colors = {}, 
  isMobile = false 
}) => {
  // Helper function to safely get values
  const getValue = (key, defaultValue = 0) => {
    return packControllerState?.[key]?.N || packControllerState?.[key] || defaultValue;
  };

  // Get alarm description and icon
  const getAlarmInfo = (alarmKey) => {
    const alarmMap = {
      // Victron Alarms
      VictronAlarmContactor: { icon: "⚡", description: "Contactor Alarm", color: colors.error },
      VictronAlarmShortCircuit: { icon: "⚠️", description: "Short Circuit", color: colors.error },
      VictronAlarmCellHighTempCharge: { icon: "🔥", description: "High Temp Charge", color: colors.error },
      VictronAlarmHighCurrent: { icon: "⚡", description: "High Current", color: colors.error },
      VictronAlarmCellLowTemp: { icon: "❄️", description: "Cell Low Temp", color: colors.error },
      VictronAlarmBmsInternal: { icon: "⚙️", description: "BMS Internal", color: colors.error },
      VictronAlarmCellHighTemp: { icon: "🔥", description: "Cell High Temp", color: colors.error },
      VictronAlarmCellHighVoltage: { icon: "⬆️", description: "High Voltage", color: colors.error },
      VictronAlarmCellLowVoltage: { icon: "⬇️", description: "Low Voltage", color: colors.error },
      VictronAlarmCellImbalance: { icon: "⚖️", description: "Cell Imbalance", color: colors.error },
      VictronAlarmChargeHighCurrent: { icon: "🔋", description: "Charge High Current", color: colors.error },
      VictronAlarmGeneral: { icon: "🚨", description: "General Alarm", color: colors.error },
      VictronAlarmCellLowTempCharge: { icon: "❄️", description: "Low Temp Charge", color: colors.error },

      // Victron Warnings
      VictronWarningCellLowTemp: { icon: "❄️", description: "Cell Low Temp", color: colors.warning },
      VictronWarningContactor: { icon: "⚡", description: "Contactor Warning", color: colors.warning },
      VictronWarningGeneral: { icon: "⚠️", description: "General Warning", color: colors.warning },
      VictronWarningCellHighTemp: { icon: "🔥", description: "Cell High Temp", color: colors.warning },
      VictronWarningSystemStatus: { icon: "🔧", description: "System Status", color: colors.warning },
      VictronWarningChargeHighCurrent: { icon: "🔋", description: "Charge High Current", color: colors.warning },
      VictronWarningHighCurrent: { icon: "⚡", description: "High Current", color: colors.warning },
      VictronWarningCellLowVoltage: { icon: "⬇️", description: "Low Voltage", color: colors.warning },
      VictronWarningBmsInternal: { icon: "⚙️", description: "BMS Internal", color: colors.warning },
      VictronWarningCellChargeLowTemp: { icon: "❄️", description: "Charge Low Temp", color: colors.warning },
      VictronWarningShortCircuit: { icon: "⚠️", description: "Short Circuit", color: colors.warning },
      VictronWarningCellHighVoltage: { icon: "⬆️", description: "High Voltage", color: colors.warning },
      VictronWarningCellImbalance: { icon: "⚖️", description: "Cell Imbalance", color: colors.warning },
      VictronWarningCellChargeHighTemp: { icon: "🔥", description: "Charge High Temp", color: colors.warning },

      // Protection Alarms
      ProtectionChargeOverCurrent: { icon: "🛡️", description: "Charge Over-Current", color: colors.error },
      ProtectionDischargeOverCurrent: { icon: "🛡️", description: "Discharge Over-Current", color: colors.error },
      ProtectionSystemError: { icon: "🛡️", description: "System Error", color: colors.error },
      ProtectionCellUnderVoltage: { icon: "🛡️", description: "Cell Under-Voltage", color: colors.error },
      ProtectionCellOverVoltage: { icon: "🛡️", description: "Cell Over-Voltage", color: colors.error },
      ProtectionCellUnderTemperature: { icon: "🛡️", description: "Cell Under-Temp", color: colors.error },
      ProtectionCellOverTemperature: { icon: "🛡️", description: "Cell Over-Temp", color: colors.error },

      // General Alarms
      AlarmCellLowVoltage: { icon: "⬇️", description: "Cell Low Voltage", color: colors.error },
      AlarmCellHighVoltage: { icon: "⬆️", description: "Cell High Voltage", color: colors.error },
      AlarmCellLowTemperature: { icon: "❄️", description: "Cell Low Temp", color: colors.error },
      AlarmInternalCommunicationFail: { icon: "📡", description: "Comm Failure", color: colors.error },
      AlarmDischargeHighCurrent: { icon: "⚡", description: "Discharge High Current", color: colors.error },
      AlarmChargeHighCurrent: { icon: "🔋", description: "Charge High Current", color: colors.error },
      AlarmCellHighTemperature: { icon: "🔥", description: "Cell High Temp", color: colors.error },
    };

    return alarmMap[alarmKey] || { 
      icon: "⚠️", 
      description: alarmKey.replace(/([A-Z])/g, ' $1').trim(), 
      color: colors.warning 
    };
  };

  // Get current active alarms
  const getCurrentAlarms = () => {
    if (!packControllerState) return [];
    
    const alarmKeys = [
      // High priority alarms
      "ProtectionChargeOverCurrent", "ProtectionDischargeOverCurrent", "ProtectionSystemError",
      "ProtectionCellUnderVoltage", "ProtectionCellOverVoltage", "ProtectionCellUnderTemperature",
      "ProtectionCellOverTemperature",
      
      // Victron alarms
      "VictronAlarmContactor", "VictronAlarmShortCircuit", "VictronAlarmCellHighTempCharge",
      "VictronAlarmHighCurrent", "VictronAlarmCellLowTemp", "VictronAlarmBmsInternal",
      "VictronAlarmCellHighTemp", "VictronAlarmCellHighVoltage", "VictronAlarmCellLowVoltage",
      "VictronAlarmCellImbalance", "VictronAlarmChargeHighCurrent", "VictronAlarmGeneral",
      "VictronAlarmCellLowTempCharge",
      
      // General alarms
      "AlarmCellLowVoltage", "AlarmCellHighVoltage", "AlarmCellLowTemperature",
      "AlarmInternalCommunicationFail", "AlarmDischargeHighCurrent", "AlarmChargeHighCurrent",
      "AlarmCellHighTemperature",
      
      // Warnings
      "VictronWarningCellLowTemp", "VictronWarningContactor", "VictronWarningGeneral",
      "VictronWarningCellHighTemp", "VictronWarningSystemStatus", "VictronWarningChargeHighCurrent",
      "VictronWarningHighCurrent", "VictronWarningCellLowVoltage", "VictronWarningBmsInternal",
      "VictronWarningCellChargeLowTemp", "VictronWarningShortCircuit", "VictronWarningCellHighVoltage",
      "VictronWarningCellImbalance", "VictronWarningCellChargeHighTemp"
    ];

    const currentAlarms = [];
    alarmKeys.forEach(key => {
      const value = parseInt(getValue(key));
      if (value > 0) {
        const alarmInfo = getAlarmInfo(key);
        currentAlarms.push({
          key,
          value,
          severity: key.includes("Protection") ? "critical" : 
                   key.includes("Alarm") ? "high" : "medium",
          ...alarmInfo,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });

    // Sort by severity (critical first)
    return currentAlarms.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  const currentAlarms = getCurrentAlarms();

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return colors.error || "#F44336";
      case "high": return colors.error || "#F44336";
      case "medium": return colors.warning || "#FF9800";
      default: return colors.warning || "#FF9800";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical": return "🚨";
      case "high": return "⚠️";
      case "medium": return "⚠️";
      default: return "ℹ️";
    }
  };

  return (
    <div
      style={{
        padding: isMobile ? "8px 12px" : "12px 16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${colors.lightGrey}`,
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "600",
            color: colors.textDark,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🚨</span>
          Active Alarms
        </h3>
        <div
          style={{
            backgroundColor: currentAlarms.length > 0 ? 
              (currentAlarms.some(a => a.severity === "critical") ? colors.error : colors.warning) + "20" :
              colors.success + "20",
            color: currentAlarms.length > 0 ? 
              (currentAlarms.some(a => a.severity === "critical") ? colors.error : colors.warning) :
              colors.success,
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: isMobile ? "10px" : "12px",
            fontWeight: "600",
          }}
        >
          {currentAlarms.length} Active
        </div>
      </div>

      {/* Alarms List */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {currentAlarms.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
              color: colors.textLight,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h4 style={{ margin: "0 0 8px 0", color: colors.success }}>
              All Systems Normal
            </h4>
            <p style={{ margin: 0, fontSize: "14px" }}>
              No active alarms detected
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentAlarms.map((alarm, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: isMobile ? "8px" : "12px",
                  backgroundColor: `${getSeverityColor(alarm.severity)}10`,
                  border: `1px solid ${getSeverityColor(alarm.severity)}30`,
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${getSeverityColor(alarm.severity)}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${getSeverityColor(alarm.severity)}10`;
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? "18px" : "20px",
                    marginRight: "12px",
                    flexShrink: 0,
                  }}
                >
                  {getSeverityIcon(alarm.severity)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? "12px" : "14px",
                      fontWeight: "600",
                      color: colors.textDark,
                      marginBottom: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {alarm.description}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? "10px" : "11px",
                      color: colors.textLight,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Severity: {alarm.severity.toUpperCase()}</span>
                    <span>{alarm.timestamp}</span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: isMobile ? "16px" : "18px",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {alarm.icon}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {currentAlarms.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: colors.background,
            borderRadius: "6px",
            fontSize: isMobile ? "10px" : "12px",
            color: colors.textLight,
            flexShrink: 0,
          }}
        >
          Critical: {currentAlarms.filter(a => a.severity === "critical").length} | 
          High: {currentAlarms.filter(a => a.severity === "high").length} | 
          Medium: {currentAlarms.filter(a => a.severity === "medium").length}
        </div>
      )}
    </div>
  );
};

export default PackControllerAlarms;