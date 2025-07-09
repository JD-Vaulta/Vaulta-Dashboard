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
        TotalCurrent: data.TotalCurrent || "N/A",
        Power: data.Power || 0,
        TotalBattVoltage: data.TotalBattVoltage || "N/A",
        TotalLoadVoltage: data.TotalLoadVoltage || "N/A",
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

  return {
    totalPowerConsumed: latestDailySummary
      ? `${latestDailySummary.TotalPower?.toFixed(2)} Wh`
      : "N/A",
    avgPowerConsumption: latestDailySummary
      ? `${latestDailySummary.AveragePower?.toFixed(2)} W`
      : "N/A",
    positiveHours: latestDailySummary
      ? `${latestDailySummary.PositiveHours} hrs`
      : "N/A",
    peakPowerConsumption:
      last24Hours.length > 0
        ? `${Math.max(...last24Hours.map((h) => h.TotalCurrent)).toFixed(2)} A`
        : "N/A",
    peakChargingPower:
      last24Hours.length > 0
        ? `${Math.min(...last24Hours.map((h) => h.TotalCurrent)).toFixed(2)} A`
        : "N/A",
    currentPowerStatus:
      latestHour && latestHour.Power > 0 ? "Consuming" : "Charging",
    systemHealth: `${parseFloat(
      bmsData?.lastMinuteData?.[0]?.SOCPercent?.N || 0
    ).toFixed(2)}%`,
  };
};
