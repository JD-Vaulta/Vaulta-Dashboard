export const processEnergyData = (lambdaResponse) => {
  console.log("processEnergyData: Starting with data:", {
    hasHourlyPower: !!lambdaResponse?.hourlyPower,
    hasHourlyAverages: !!lambdaResponse?.hourlyAverages,
    hasDailyPowerSummary: !!lambdaResponse?.dailyPowerSummary,
    hourlyPowerKeys: lambdaResponse?.hourlyPower
      ? Object.keys(lambdaResponse.hourlyPower).length
      : 0,
    hourlyAveragesKeys: lambdaResponse?.hourlyAverages
      ? Object.keys(lambdaResponse.hourlyAverages).length
      : 0,
    dailySummaryKeys: lambdaResponse?.dailyPowerSummary
      ? Object.keys(lambdaResponse.dailyPowerSummary).length
      : 0,
    rawData: lambdaResponse,
  });

  const getLatestHourData = () => {
    if (!lambdaResponse?.hourlyPower) {
      console.log("processEnergyData: No hourlyPower data");
      return null;
    }

    const hourlyEntries = Object.entries(lambdaResponse.hourlyPower);
    if (hourlyEntries.length === 0) {
      console.log("processEnergyData: hourlyPower is empty");
      return null;
    }

    const latest = {
      timestamp: hourlyEntries[hourlyEntries.length - 1][0],
      ...hourlyEntries[hourlyEntries.length - 1][1],
    };

    console.log("processEnergyData: Latest hour data:", latest);
    return latest;
  };

  const getLast24Hours = () => {
    if (!lambdaResponse?.hourlyAverages) {
      console.log("processEnergyData: No hourlyAverages data");
      return [];
    }

    const hourlyData = Object.entries(lambdaResponse.hourlyAverages)
      .map(([timestamp, data]) => {
        // Ensure we have valid data
        const processedData = {
          timestamp,
          TotalCurrent: parseFloat(data.TotalCurrent) || 0,
          Power: parseFloat(data.Power) || 0,
          TotalBattVoltage: parseFloat(data.TotalBattVoltage) || 0,
          TotalLoadVoltage: parseFloat(data.TotalLoadVoltage) || 0,
        };

        return processedData;
      })
      .filter((item) => {
        // Filter out invalid timestamps
        const date = new Date(item.timestamp);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-24); // Keep only last 24 hours

    console.log("processEnergyData: Last 24 hours data:", {
      count: hourlyData.length,
      firstTimestamp: hourlyData[0]?.timestamp,
      lastTimestamp: hourlyData[hourlyData.length - 1]?.timestamp,
      sampleData: hourlyData.slice(0, 3),
      totalCurrentValues: hourlyData.map((h) => h.TotalCurrent),
    });

    return hourlyData;
  };

  const getAllDailySummaries = () => {
    if (
      !lambdaResponse?.dailyPowerSummary ||
      Object.keys(lambdaResponse.dailyPowerSummary).length === 0
    ) {
      console.log("processEnergyData: No dailyPowerSummary data");
      return [];
    }

    const dailyData = Object.entries(lambdaResponse.dailyPowerSummary)
      .map(([date, summary]) => {
        const processedSummary = {
          date,
          TotalPower: parseFloat(summary.TotalPower) || 0,
          AveragePower: parseFloat(summary.AveragePower) || 0,
          PositiveHours: parseInt(summary.PositiveHours) || 0,
        };

        return processedSummary;
      })
      .filter((item) => {
        // Filter out invalid dates
        const date = new Date(item.date);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log("processEnergyData: Daily summaries:", {
      count: dailyData.length,
      firstDate: dailyData[0]?.date,
      lastDate: dailyData[dailyData.length - 1]?.date,
      sampleData: dailyData.slice(0, 3),
      totalPowerValues: dailyData.map((d) => d.TotalPower),
      averagePowerValues: dailyData.map((d) => d.AveragePower),
    });

    return dailyData;
  };

  const result = {
    latestHour: getLatestHourData(),
    last24Hours: getLast24Hours(),
    dailySummaries: getAllDailySummaries(),
  };

  console.log("processEnergyData: Final result:", {
    hasLatestHour: !!result.latestHour,
    last24HoursCount: result.last24Hours.length,
    dailySummariesCount: result.dailySummaries.length,
    // Log actual values to see if they're different
    sampleHourlyValues: result.last24Hours
      .slice(0, 3)
      .map((h) => h.TotalCurrent),
    sampleDailyValues: result.dailySummaries
      .slice(0, 2)
      .map((d) => ({ power: d.TotalPower, avg: d.AveragePower })),
  });

  return result;
};

export const getKeyInsightMetrics = (data, bmsData, lambdaResponse) => {
  const { latestHour, last24Hours, dailySummaries } = data;
  const latestDailySummary =
    dailySummaries.length > 0
      ? dailySummaries[dailySummaries.length - 1]
      : null;

  console.log("getKeyInsightMetrics: Processing with:", {
    hasLatestHour: !!latestHour,
    last24HoursCount: last24Hours.length,
    dailySummariesCount: dailySummaries.length,
    hasLatestDailySummary: !!latestDailySummary,
    latestDailySummary: latestDailySummary,
    sampleLast24Hours: last24Hours.slice(0, 3),
  });

  // Get SOC from current BMS data
  const currentSOC = parseFloat(
    bmsData?.lastMinuteData?.[0]?.SOCPercent?.N ||
      bmsData?.lastMinuteData?.[0]?.SOCPercent ||
      0
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
    .filter((val) => val !== 0 && !isNaN(val) && isFinite(val));

  console.log("getKeyInsightMetrics: Current values extracted:", currentValues);

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
  if (latestHour?.Power !== undefined && isFinite(latestHour.Power)) {
    currentPowerStatus = latestHour.Power > 0 ? "Consuming" : "Charging";
  } else if (currentValues.length > 0) {
    const latestCurrent = currentValues[currentValues.length - 1];
    currentPowerStatus = latestCurrent > 0 ? "Consuming" : "Charging";
  }

  const metrics = {
    totalPowerConsumed,
    avgPowerConsumption,
    positiveHours,
    peakPowerConsumption,
    peakChargingPower,
    currentPowerStatus,
    systemHealth: `${currentSOC.toFixed(1)}%`,
  };

  console.log("getKeyInsightMetrics: Generated metrics:", metrics);
  return metrics;
};
