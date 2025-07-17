import React, { useState, useEffect } from "react";
import { getPackControllerAlarmHistory, initDynamoDB } from "../../../../queries.js";

const PackControllerAlarmHistory = ({ 
  packControllerState, 
  colors = {}, 
  isMobile = false,
  RefreshButton 
}) => {
  const [alarmHistory, setAlarmHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("1day");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  // Helper function to safely get values
  const getValue = (key, defaultValue = 0) => {
    return packControllerState?.[key]?.N || packControllerState?.[key] || defaultValue;
  };

  // Get device ID for queries
  const deviceId = packControllerState?.TagID || "PACK-CONTROLLER";

  // Fetch alarm history
  const fetchAlarmHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const docClient = await initDynamoDB();
      const history = await getPackControllerAlarmHistory(docClient, deviceId, timeRange);
      
      setAlarmHistory(history);
    } catch (err) {
      console.error("Error fetching alarm history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load alarm history on component mount and when timeRange changes
  useEffect(() => {
    fetchAlarmHistory();
  }, [timeRange, deviceId]);

  // Filter alarms by severity
  const filteredAlarms = selectedSeverity === "all" 
    ? alarmHistory 
    : alarmHistory.filter(alarm => alarm.severity === selectedSeverity);

  // Get alarm icon and color
  const getAlarmDisplay = (alarmType, severity) => {
    const alarmMap = {
      VictronAlarmContactor: { icon: "⚡", label: "Contactor Alarm" },
      VictronAlarmShortCircuit: { icon: "⚠️", label: "Short Circuit" },
      VictronAlarmCellHighTempCharge: { icon: "🔥", label: "High Temp Charge" },
      VictronAlarmHighCurrent: { icon: "⚡", label: "High Current" },
      VictronAlarmCellLowTemp: { icon: "❄️", label: "Cell Low Temp" },
      VictronAlarmBmsInternal: { icon: "⚙️", label: "BMS Internal" },
      VictronAlarmCellHighTemp: { icon: "🔥", label: "Cell High Temp" },
      VictronAlarmCellHighVoltage: { icon: "⬆️", label: "High Voltage" },
      VictronAlarmCellLowVoltage: { icon: "⬇️", label: "Low Voltage" },
      VictronAlarmCellImbalance: { icon: "⚖️", label: "Cell Imbalance" },
      VictronAlarmChargeHighCurrent: { icon: "🔋", label: "Charge High Current" },
      VictronAlarmGeneral: { icon: "🚨", label: "General Alarm" },
      ProtectionChargeOverCurrent: { icon: "🛡️", label: "Charge Over-Current Protection" },
      ProtectionDischargeOverCurrent: { icon: "🛡️", label: "Discharge Over-Current Protection" },
      ProtectionSystemError: { icon: "🛡️", label: "System Error Protection" },
      ProtectionCellUnderVoltage: { icon: "🛡️", label: "Cell Under-Voltage Protection" },
      ProtectionCellOverVoltage: { icon: "🛡️", label: "Cell Over-Voltage Protection" },
      ProtectionCellUnderTemperature: { icon: "🛡️", label: "Cell Under-Temperature Protection" },
      ProtectionCellOverTemperature: { icon: "🛡️", label: "Cell Over-Temperature Protection" },
      AlarmCellLowVoltage: { icon: "⬇️", label: "Cell Low Voltage" },
      AlarmCellHighVoltage: { icon: "⬆️", label: "Cell High Voltage" },
      AlarmCellLowTemperature: { icon: "❄️", label: "Cell Low Temperature" },
      AlarmInternalCommunicationFail: { icon: "📡", label: "Communication Failure" },
      AlarmDischargeHighCurrent: { icon: "⚡", label: "Discharge High Current" },
      AlarmChargeHighCurrent: { icon: "🔋", label: "Charge High Current" },
      AlarmCellHighTemperature: { icon: "🔥", label: "Cell High Temperature" },
    };

    const display = alarmMap[alarmType] || { 
      icon: "⚠️", 
      label: alarmType.replace(/([A-Z])/g, ' $1').trim() 
    };

    const severityColors = {
      critical: colors.error || "#F44336",
      high: colors.error || "#F44336", 
      medium: colors.warning || "#FF9800",
      low: colors.warning || "#FF9800"
    };

    return {
      ...display,
      color: severityColors[severity] || colors.warning
    };
  };

  // Get severity badge
  const SeverityBadge = ({ severity }) => {
    const severityConfig = {
      critical: { color: colors.error || "#F44336", icon: "🚨", label: "CRITICAL" },
      high: { color: colors.error || "#F44336", icon: "⚠️", label: "HIGH" },
      medium: { color: colors.warning || "#FF9800", icon: "⚠️", label: "MEDIUM" },
      low: { color: colors.warning || "#FF9800", icon: "ℹ️", label: "LOW" }
    };

    const config = severityConfig[severity] || severityConfig.medium;

    return (
      <div
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: isMobile ? "9px" : "10px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          whiteSpace: "nowrap",
        }}
      >
        <span>{config.icon}</span>
        {!isMobile && config.label}
      </div>
    );
  };

  // Get alarm statistics
  const getAlarmStats = () => {
    const stats = {
      total: filteredAlarms.length,
      critical: filteredAlarms.filter(a => a.severity === "critical").length,
      high: filteredAlarms.filter(a => a.severity === "high").length,
      medium: filteredAlarms.filter(a => a.severity === "medium").length,
      low: filteredAlarms.filter(a => a.severity === "low").length,
    };
    return stats;
  };

  const stats = getAlarmStats();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.white,
        borderRadius: "6px",
        padding: isMobile ? "12px" : "16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${colors.lightGrey}`,
          flexShrink: 0,
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "600",
            color: colors.textDark,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "20px" }}>📋</span>
          Alarm History
        </h2>
        <RefreshButton />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* Time Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            style={{
              fontSize: isMobile ? "11px" : "12px",
              color: colors.textDark,
              fontWeight: "500",
            }}
          >
            Time:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: `1px solid ${colors.lightGrey}`,
              fontSize: isMobile ? "11px" : "12px",
              backgroundColor: colors.white,
            }}
          >
            <option value="1day">Last Day</option>
            <option value="1week">Last Week</option>
            <option value="1month">Last Month</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            style={{
              fontSize: isMobile ? "11px" : "12px",
              color: colors.textDark,
              fontWeight: "500",
            }}
          >
            Severity:
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: `1px solid ${colors.lightGrey}`,
              fontSize: isMobile ? "11px" : "12px",
              backgroundColor: colors.white,
            }}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
          gap: "8px",
          marginBottom: "16px",
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: colors.background, borderRadius: "4px" }}>
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: colors.textDark }}>{stats.total}</div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: colors.textLight }}>Total</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: colors.error + "10", borderRadius: "4px" }}>
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: colors.error }}>{stats.critical}</div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: colors.textLight }}>Critical</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: colors.error + "10", borderRadius: "4px" }}>
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: colors.error }}>{stats.high}</div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: colors.textLight }}>High</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: colors.warning + "10", borderRadius: "4px" }}>
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: colors.warning }}>{stats.medium}</div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: colors.textLight }}>Medium</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: colors.warning + "10", borderRadius: "4px" }}>
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: colors.warning }}>{stats.low}</div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: colors.textLight }}>Low</div>
        </div>
      </div>

      {/* Alarm List */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ color: colors.textLight }}>Loading alarm history...</div>
          </div>
        ) : error ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ color: colors.error, textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <div>Error loading alarm history</div>
              <div style={{ fontSize: "12px", marginTop: "8px" }}>{error}</div>
            </div>
          </div>
        ) : filteredAlarms.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", textAlign: "center" }}>
            <div style={{ color: colors.textLight }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <div>No alarms found</div>
              <div style={{ fontSize: "12px", marginTop: "8px" }}>
                {selectedSeverity === "all" ? "No alarms in the selected time range" : `No ${selectedSeverity} severity alarms found`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredAlarms.map((alarm, index) => {
              const display = getAlarmDisplay(alarm.alarmType, alarm.severity);
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: isMobile ? "10px" : "12px",
                    backgroundColor: `${display.color}08`,
                    border: `1px solid ${display.color}30`,
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${display.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${display.color}08`;
                  }}
                >
                  <div style={{ fontSize: "20px", marginRight: "12px", flexShrink: 0 }}>
                    {display.icon}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: isMobile ? "12px" : "14px",
                        fontWeight: "600",
                        color: colors.textDark,
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {display.label}
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
                      <span>
                        {new Date(alarm.timestamp).toLocaleDateString()} {new Date(alarm.timestamp).toLocaleTimeString()}
                      </span>
                      <span>Value: {alarm.value}</span>
                    </div>
                  </div>

                  <div style={{ marginLeft: "8px", flexShrink: 0 }}>
                    <SeverityBadge severity={alarm.severity} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackControllerAlarmHistory;