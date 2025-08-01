import React from "react";
import { useBatteryContext } from "../../contexts/BatteryContext.js";
import { useNavigate } from "react-router-dom";

const BatterySelector = ({
  style = {},
  className = "",
  showAddButton = true,
  compact = false,
}) => {
  const navigate = useNavigate();
  const {
    userBatteries,
    selectedBattery,
    selectBattery,
    loading,
    getBatteryOptions,
    getBatteryDisplayInfo,
  } = useBatteryContext();

  const handleBatteryChange = (event) => {
    const batteryId = event.target.value;
    selectBattery(batteryId);
  };

  const handleAddBattery = () => {
    navigate("/battery-management");
  };

  // Enhanced compact styles
  const getSelectStyle = () => {
    const baseStyle = {
      padding: compact ? "6px 10px" : "8px 12px",
      border: "1px solid #ddd",
      borderRadius: compact ? "4px" : "5px",
      backgroundColor: "white",
      fontSize: compact ? "12px" : "14px",
      fontWeight: "500",
      color: "#333",
      cursor: "pointer",
      outline: "none",
      boxShadow: compact
        ? "0 1px 2px rgba(0,0,0,0.05)"
        : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "border-color 0.2s ease",
      ...style,
    };

    return baseStyle;
  };

  const getButtonStyle = () => {
    return {
      marginLeft: compact ? "6px" : "8px",
      padding: compact ? "6px 10px" : "8px 16px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: compact ? "4px" : "5px",
      fontSize: compact ? "11px" : "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: compact
        ? "0 1px 2px rgba(0,0,0,0.1)"
        : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "background-color 0.2s ease",
    };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <select
          disabled
          style={{ ...getSelectStyle(), opacity: 0.6 }}
          className={className}
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (userBatteries.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <select
          disabled
          style={{ ...getSelectStyle(), borderColor: "#f44336" }}
          className={className}
        >
          <option>No batteries</option>
        </select>
        {showAddButton && !compact && (
          <button
            onClick={handleAddBattery}
            style={getButtonStyle()}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
          >
            + Add Battery
          </button>
        )}
      </div>
    );
  }

  const batteryOptions = getBatteryOptions();
  const batteryDisplayInfo = getBatteryDisplayInfo();

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <select
        value={selectedBattery?.batteryId || selectedBattery?.id || ""}
        onChange={handleBatteryChange}
        style={getSelectStyle()}
        className={className}
        onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
      >
        {batteryOptions.map((battery) => (
          <option key={battery.value} value={battery.value}>
            {compact && battery.label.length > 20
              ? `${battery.label.substring(0, 17)}...`
              : battery.label}
          </option>
        ))}
      </select>

      {showAddButton && !compact && (
        <button
          onClick={handleAddBattery}
          style={getButtonStyle()}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
          title="Manage batteries"
        >
          + Manage
        </button>
      )}

      {!compact && selectedBattery && (
        <span
          style={{
            marginLeft: "12px",
            fontSize: "12px",
            color: "#666",
            fontWeight: "500",
          }}
        >
          {userBatteries.length} registered
        </span>
      )}

      {/* Compact mode status indicator */}
      {compact && batteryDisplayInfo?.isActive && (
        <span
          style={{
            marginLeft: "6px",
            color: "#4CAF50",
            fontSize: "10px",
            title: "Battery is active",
          }}
        >
          ●
        </span>
      )}
    </div>
  );
};

export default BatterySelector;
