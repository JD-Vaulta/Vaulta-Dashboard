export const colors = {
  primary: "#818181",
  secondary: "#c0c0c0",
  accentGreen: "#4CAF50",
  accentRed: "#F44336",
  accentBlue: "#2196F3",
  background: "rgba(192, 192, 192, 0.1)",
  textDark: "#333333",
  textLight: "#555555",
  highlight: "#FFC107",
};

export const formatValue = (value, decimals = 2) => {
  return parseFloat(value || 0).toFixed(decimals);
};

export const getHealthStatus = (currentData) => {
  const alerts = [];

  // Check voltage alerts
  if (
    parseFloat(currentData.MinimumCellVoltage?.N || 0) <=
    parseFloat(currentData.CellThresholdUnderVoltage?.N || 2.8)
  ) {
    alerts.push({ type: "warning", message: "Undervoltage" });
  }

  if (
    parseFloat(currentData.MaximumCellVoltage?.N || 0) >=
    parseFloat(currentData.CellThresholdOverVoltage?.N || 3.65)
  ) {
    alerts.push({ type: "warning", message: "Overvoltage" });
  }

  // Check temperature alerts
  if (
    parseFloat(currentData.MaxCellTemp?.N || 0) >=
    parseFloat(currentData.TempThresholdOverTemp?.N || 60)
  ) {
    alerts.push({ type: "critical", message: "Over temp" });
  }

  // Check current alerts
  if (
    Math.abs(parseFloat(currentData.TotalCurrent?.N || 0)) >=
    parseFloat(currentData.PackThresholdOverCurrent?.N || 80)
  ) {
    alerts.push({ type: "warning", message: "High current" });
  }

  // Check cell balance
  const voltageDelta =
    parseFloat(currentData.MaximumCellVoltage?.N || 0) -
    parseFloat(currentData.MinimumCellVoltage?.N || 0);
  if (voltageDelta > 0.1) {
    alerts.push({
      type: "info",
      message: `Imbalance: ${(voltageDelta * 1000).toFixed(0)}mV`,
    });
  }

  return alerts;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(parseInt(timestamp) * 1000).toLocaleTimeString();
};

export const getStatusColor = (status) => {
  switch (status) {
    case "BMS_STATE_ALL_ENABLED":
      return colors.accentGreen;
    case "critical":
      return colors.accentRed;
    case "warning":
      return colors.highlight;
    default:
      return colors.textLight;
  }
};
