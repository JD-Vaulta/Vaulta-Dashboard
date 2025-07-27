export const processEnergyData = (lambdaResponse) => {
  const getLatestHourData = () => {
    if (!lambdaResponse?.hourlyPower) return null;
    const hourlyEntries = Object.entries(lambdaResponse.hourlyPower);
    return hourlyEntries.length > 0
      ? {
          timestamp: hourlyEntries[hourlyEntries.length - 1][0],
          ...hourlyEntries[hourlyEntries.length - 1][1],
        }
      : null;
  };

  const getLast24Hours = () => {
    if (!lambdaResponse?.hourlyAverages) return [];

    return Object.entries(lambdaResponse.hourlyAverages)
      .map(([timestamp, data]) => ({
        timestamp,
        TotalCurrent: data.TotalCurrent || 0,
        Power: data.Power || 0,
        TotalBattVoltage: data.TotalBattVoltage || 0,
        TotalLoadVoltage: data.TotalLoadVoltage || 0,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-24);
  };

  const getAllDailySummaries = () => {
    if (
      !lambdaResponse?.dailyPowerSummary ||
      Object.keys(lambdaResponse.dailyPowerSummary).length === 0
    ) {
      return [];
    }

    return Object.entries(lambdaResponse.dailyPowerSummary)
      .map(([date, summary]) => ({
        date,
        TotalPower: summary.TotalPower || 0,
        AveragePower: summary.AveragePower || 0,
        PositiveHours: summary.PositiveHours || 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return {
    latestHour: getLatestHourData(),
    last24Hours: getLast24Hours(),
    dailySummaries: getAllDailySummaries(),
  };
};

export const getKeyInsightMetrics = (data, bmsData, lambdaResponse) => {
  const { latestHour, last24Hours, dailySummaries } = data;
  const latestDailySummary =
    dailySummaries.length > 0
      ? dailySummaries[dailySummaries.length - 1]
      : null;

  // Get SOC from current BMS data
  const currentSOC = parseFloat(
    bmsData?.lastMinuteData?.[0]?.SOCPercent?.N || 0
  );

  // Calculate metrics with fallbacks for no data
  const totalPowerConsumed = latestDailySummary?.TotalPower
    ? `${latestDailySummary.TotalPower.toFixed(2)} Wh`
    : "No data";

  const avgPowerConsumption = latestDailySummary?.AveragePower
    ? `${latestDailySummary.AveragePower.toFixed(2)} W`
    : "No data";

  const positiveHours = latestDailySummary
    ? `${latestDailySummary.PositiveHours} hrs`
    : "No data";

  // Calculate peak consumption and charging from last 24 hours
  const currentValues = last24Hours
    .map((h) => h.TotalCurrent)
    .filter((val) => val !== 0 && !isNaN(val));

  const peakPowerConsumption =
    currentValues.length > 0
      ? `${Math.max(...currentValues).toFixed(2)} A`
      : "No data";

  const peakChargingPower =
    currentValues.length > 0
      ? `${Math.min(...currentValues).toFixed(2)} A`
      : "No data";

  // Determine current status
  let currentPowerStatus = "Unknown";
  if (latestHour?.Power !== undefined) {
    currentPowerStatus = latestHour.Power > 0 ? "Consuming" : "Charging";
  } else if (currentValues.length > 0) {
    const latestCurrent = currentValues[currentValues.length - 1];
    currentPowerStatus = latestCurrent > 0 ? "Consuming" : "Charging";
  }

  return {
    totalPowerConsumed,
    avgPowerConsumption,
    positiveHours,
    peakPowerConsumption,
    peakChargingPower,
    currentPowerStatus,
    systemHealth: `${currentSOC.toFixed(1)}%`,
  };
};
