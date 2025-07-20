import React, { useState, useEffect } from "react";

const PackControllerAlarms = ({ 
  packControllerState, 
  activeAlarms = [], 
  colors = {}, 
  isMobile = false,
  showHistory = false,
  onNewAlarm = null // Callback for new alarms
}) => {
  const [alarmHistory, setAlarmHistory] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationAlarm, setNotificationAlarm] = useState(null);
  const [lastActiveAlarms, setLastActiveAlarms] = useState([]);

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

  // Monitor for new alarms and update history
  useEffect(() => {
    if (!packControllerState) return;
    
    const currentAlarms = getCurrentAlarms();
    
    // Check for new alarms
    const newAlarms = currentAlarms.filter(current => 
      !lastActiveAlarms.some(last => last.key === current.key)
    );

    if (newAlarms.length > 0) {
      // Add to history
      const newHistoryEntries = newAlarms.map(alarm => ({
        ...alarm,
        timestamp: new Date(),
        id: Date.now() + Math.random()
      }));

      setAlarmHistory(prev => {
        const updated = [...newHistoryEntries, ...prev];
        return updated.slice(0, 5); // Keep only last 5
      });

      // Show notification for the first new alarm
      if (newAlarms[0]) {
        setNotificationAlarm(newAlarms[0]);
        setShowNotification(true);
        
        // Call callback if provided
        if (onNewAlarm) {
          onNewAlarm(newAlarms[0]);
        }
      }
    }

    setLastActiveAlarms(currentAlarms);
  }, [packControllerState, lastActiveAlarms, onNewAlarm]);

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

  // Notification Component
  const AlarmNotification = () => {
    if (!showNotification || !notificationAlarm) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: colors.white,
          border: `2px solid ${getSeverityColor(notificationAlarm.severity)}`,
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          maxWidth: "350px",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <span style={{ fontSize: "24px", marginRight: "12px" }}>
              {getSeverityIcon(notificationAlarm.severity)}
            </span>
            <div>
              <h4 style={{ 
                margin: "0 0 4px 0", 
                color: colors.textDark,
                fontSize: "14px",
                fontWeight: "600" 
              }}>
                New Alarm Detected
              </h4>
              <p style={{ 
                margin: "0 0 4px 0", 
                color: colors.textDark,
                fontSize: "13px" 
              }}>
                {notificationAlarm.description}
              </p>
              <p style={{ 
                margin: 0, 
                color: colors.textLight,
                fontSize: "11px" 
              }}>
                Severity: {notificationAlarm.severity.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: colors.textLight,
              marginLeft: "8px",
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <AlarmNotification />
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

        {/* Active Alarms List */}
        <div
          style={{
            flex: showHistory ? "0 0 60%" : 1,
            overflow: "auto",
            minHeight: 0,
            marginBottom: showHistory ? "12px" : 0,
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {currentAlarms.map((alarm, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: isMobile ? "8px" : "10px",
                    backgroundColor: `${getSeverityColor(alarm.severity)}10`,
                    border: `1px solid ${getSeverityColor(alarm.severity)}30`,
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: isMobile ? "16px" : "18px", marginRight: "10px" }}>
                    {getSeverityIcon(alarm.severity)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: isMobile ? "12px" : "13px",
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
                      }}
                    >
                      <span>Severity: {alarm.severity.toUpperCase()}</span>
                      <span>{alarm.timestamp}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: isMobile ? "14px" : "16px", marginLeft: "8px" }}>
                    {alarm.icon}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alarm History */}
        {showHistory && alarmHistory.length > 0 && (
          <div
            style={{
              flex: "0 0 35%",
              borderTop: `1px solid ${colors.lightGrey}`,
              paddingTop: "12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h4
              style={{
                fontSize: isMobile ? "12px" : "14px",
                fontWeight: "600",
                color: colors.textDark,
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "14px" }}>📋</span>
              Recent Alarms (Last 5)
            </h4>
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {alarmHistory.map((alarm, index) => (
                  <div
                    key={alarm.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: isMobile ? "6px" : "8px",
                      backgroundColor: colors.background,
                      borderRadius: "4px",
                      border: `1px solid ${colors.lightGrey}`,
                    }}
                  >
                    <div style={{ fontSize: "12px", marginRight: "8px", opacity: 0.7 }}>
                      {alarm.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: isMobile ? "10px" : "11px",
                          fontWeight: "500",
                          color: colors.textDark,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {alarm.description}
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? "9px" : "10px",
                          color: colors.textLight,
                        }}
                      >
                        {alarm.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {currentAlarms.length > 0 && (
          <div
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              backgroundColor: colors.background,
              borderRadius: "4px",
              fontSize: isMobile ? "10px" : "11px",
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

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default PackControllerAlarms;