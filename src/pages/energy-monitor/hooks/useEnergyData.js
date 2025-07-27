import { useState, useEffect } from "react";
import { processEnergyData } from "../utils/energyHelpers.js";

export const useEnergyData = (bmsData, lambdaResponse, selectedBatteryId) => {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState({});

  useEffect(() => {
    const hasBmsData = bmsData?.lastMinuteData?.length > 0;
    const hasLambdaData =
      lambdaResponse && Object.keys(lambdaResponse).length > 0;
    const hasSelectedBattery =
      selectedBatteryId && selectedBatteryId !== "0700";

    if (hasBmsData && hasLambdaData && hasSelectedBattery) {
      // Extract data for the selected battery
      let batteryData = null;

      // Check if lambdaResponse has data for multiple batteries
      if (
        lambdaResponse.batteries &&
        lambdaResponse.batteries[`BAT-${selectedBatteryId}`]
      ) {
        // Multi-battery response format
        batteryData = lambdaResponse.batteries[`BAT-${selectedBatteryId}`];
      } else if (
        lambdaResponse.metadata?.tagId === `BAT-${selectedBatteryId}`
      ) {
        // Single battery response format
        batteryData = lambdaResponse;
      } else if (lambdaResponse.hourlyAverages || lambdaResponse.hourlyPower) {
        // Fallback: assume the response is for the current battery
        batteryData = lambdaResponse;
      }

      if (batteryData) {
        const processed = processEnergyData(batteryData);
        setProcessedData(processed);
        setLoading(false);
      } else {
        // No data for selected battery
        setProcessedData({
          latestHour: null,
          last24Hours: [],
          dailySummaries: [],
        });
        setLoading(false);
      }
    } else {
      setLoading(true);
    }
  }, [bmsData, lambdaResponse, selectedBatteryId]);

  return { loading, processedData };
};
