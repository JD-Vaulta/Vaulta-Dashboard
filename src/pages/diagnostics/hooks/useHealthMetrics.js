import { useMemo } from "react";

export const useHealthMetrics = (bmsData) => {
  const currentData = useMemo(() => {
    return bmsData?.lastMinuteData?.[0] || {};
  }, [bmsData]);

  const batteryMetrics = useMemo(() => {
    return {
      soc: parseFloat(currentData.SOCPercent?.N || 0),
      state: currentData.State?.S || "Unknown",
      temperature: parseFloat(currentData.MaxCellTemp?.N || 0),
      voltage: parseFloat(currentData.TotalBattVoltage?.N || 0),
      current: parseFloat(currentData.TotalCurrent?.N || 0),
    };
  }, [currentData]);

  const cellMetrics = useMemo(() => {
    const minVoltage = parseFloat(currentData.MinimumCellVoltage?.N || 0);
    const maxVoltage = parseFloat(currentData.MaximumCellVoltage?.N || 0);
    const delta = (maxVoltage - minVoltage) * 1000; // Convert to mV

    return {
      minVoltage,
      maxVoltage,
      delta,
      minNode: currentData.MinimumCellVoltageNode?.N || "?",
      minCell: currentData.MinimumCellVoltageCellNo?.N || "?",
      maxNode: currentData.MaximumCellVoltageNode?.N || "?",
      maxCell: currentData.MaximumCellVoltageCellNo?.N || "?",
      isAboveThreshold:
        minVoltage >
        parseFloat(currentData.CellThresholdUnderVoltage?.N || 2.8),
    };
  }, [currentData]);

  const balanceMetrics = useMemo(() => {
    return {
      node00Status: currentData.Node00BalanceStatus?.N !== "0",
      node01Status: currentData.Node01BalanceStatus?.N !== "0",
      balanceSOC: parseFloat(currentData.BalanceSOCPercent?.N || 0),
      threshold: parseFloat(currentData.CellBalanceThresholdVoltage?.N || 0),
      events: parseInt(currentData.Events?.N || 0),
    };
  }, [currentData]);

  const lastUpdate = useMemo(() => {
    return currentData.Timestamp?.N
      ? new Date(parseInt(currentData.Timestamp.N) * 1000)
      : null;
  }, [currentData]);

  return {
    currentData,
    batteryMetrics,
    cellMetrics,
    balanceMetrics,
    lastUpdate,
  };
};
