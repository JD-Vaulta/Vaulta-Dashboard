import { useState, useEffect, useRef } from "react";
import { processEnergyData } from "../utils/energyHelpers.js";

export const useEnergyData = (bmsData, lambdaResponse, selectedBatteryId) => {
  const [loading, setLoading] = useState(false);
  const [processedData, setProcessedData] = useState({
    latestHour: null,
    last24Hours: [],
    dailySummaries: [],
  });

  const isInitialized = useRef(false);
  const lastProcessedBatteryId = useRef(null);
  const lastLambdaResponseString = useRef(null);

  useEffect(() => {
    console.log("useEnergyData: Effect triggered with:", {
      hasBmsData: !!bmsData?.lastMinuteData?.length,
      hasLambdaData: !!lambdaResponse,
      selectedBatteryId: selectedBatteryId,
      isInitialized: isInitialized.current,
      lastProcessedBatteryId: lastProcessedBatteryId.current,
    });

    // If no battery is selected or it's Pack Controller, set empty data quickly
    if (!selectedBatteryId || selectedBatteryId === "0700") {
      console.log("useEnergyData: No valid battery selected for energy data");
      setProcessedData({
        latestHour: null,
        last24Hours: [],
        dailySummaries: [],
      });
      setLoading(false);
      isInitialized.current = true;
      return;
    }

    // Show loading but KEEP old data visible when battery changes
    if (
      isInitialized.current &&
      lastProcessedBatteryId.current !== selectedBatteryId
    ) {
      console.log("useEnergyData: Battery changed, showing loading state");
      setLoading(true);
      // DON'T clear processedData here - keep old data visible
      // But DO reset lambda cache so new data will be processed
      lastLambdaResponseString.current = null;
    }

    // If we have lambda data, process it
    if (lambdaResponse && Object.keys(lambdaResponse).length > 0) {
      try {
        // Include selectedBatteryId in signature so cache invalidates on battery change
        const lambdaSignature = JSON.stringify({
          selectedBatteryId: selectedBatteryId, // KEY ADDITION - cache invalidates on battery change
          hourlyAveragesKeys: lambdaResponse.hourlyAverages
            ? Object.keys(lambdaResponse.hourlyAverages).sort()
            : [],
          dailySummaryKeys: lambdaResponse.dailyPowerSummary
            ? Object.keys(lambdaResponse.dailyPowerSummary).sort()
            : [],
          hourlyPowerKeys: lambdaResponse.hourlyPower
            ? Object.keys(lambdaResponse.hourlyPower).sort()
            : [],
          // Include timestamp if available to detect truly new data
          timestamp:
            lambdaResponse.timestamp || lambdaResponse.metadata?.timestamp,
          // Sample some actual values to detect content changes
          firstHourlyValue: lambdaResponse.hourlyAverages
            ? Object.values(lambdaResponse.hourlyAverages)[0]
            : null,
          firstDailyValue: lambdaResponse.dailyPowerSummary
            ? Object.values(lambdaResponse.dailyPowerSummary)[0]
            : null,
        });

        // Now cache will invalidate when battery changes OR when new data arrives
        if (lambdaSignature === lastLambdaResponseString.current) {
          console.log("useEnergyData: Same lambda data, skipping processing");
          setLoading(false);
          return;
        }

        console.log("useEnergyData: New lambda data detected, processing...");
        lastLambdaResponseString.current = lambdaSignature;

        let batteryData = null;

        // Check different lambda response formats
        if (
          lambdaResponse.batteries &&
          lambdaResponse.batteries[`BAT-${selectedBatteryId}`]
        ) {
          // Multi-battery response format
          batteryData = lambdaResponse.batteries[`BAT-${selectedBatteryId}`];
          console.log("useEnergyData: Using multi-battery format data");
        } else if (
          lambdaResponse.metadata?.tagId === `BAT-${selectedBatteryId}`
        ) {
          // Single battery response format with metadata
          batteryData = lambdaResponse;
          console.log(
            "useEnergyData: Using single battery with metadata format"
          );
        } else if (
          lambdaResponse.hourlyAverages ||
          lambdaResponse.hourlyPower ||
          lambdaResponse.dailyPowerSummary
        ) {
          // Direct lambda response format (assume it's for the current battery)
          batteryData = lambdaResponse;
          console.log("useEnergyData: Using direct lambda response format");
        }

        if (batteryData) {
          console.log(
            "useEnergyData: Processing battery data for:",
            selectedBatteryId
          );
          const processed = processEnergyData(batteryData);

          // Create content-based signature for the processed data
          const contentSignature = {
            hourlyCount: processed.last24Hours.length,
            dailyCount: processed.dailySummaries.length,
            // Use actual data values for signature
            hourlyValues: processed.last24Hours
              .map((h) => h.TotalCurrent)
              .join(","),
            dailyValues: processed.dailySummaries
              .map((d) => `${d.TotalPower}-${d.AveragePower}`)
              .join(","),
            latestHour: processed.latestHour
              ? JSON.stringify(processed.latestHour)
              : null,
          };

          // Add content signature to processed data for component keys
          const newProcessedData = {
            latestHour: processed.latestHour,
            last24Hours: processed.last24Hours,
            dailySummaries: processed.dailySummaries,
            _contentSignature: JSON.stringify(contentSignature),
          };

          console.log("useEnergyData: Setting new processed data:", {
            last24HoursCount: newProcessedData.last24Hours.length,
            dailySummariesCount: newProcessedData.dailySummaries.length,
            hasLatestHour: !!newProcessedData.latestHour,
            contentSignature:
              newProcessedData._contentSignature.substring(0, 100) + "...",
          });

          setProcessedData(newProcessedData);
          lastProcessedBatteryId.current = selectedBatteryId;
          setLoading(false); // Turn off loading when NEW data arrives
        } else {
          // No data for selected battery - keep old data but show not loading
          console.log("useEnergyData: No data found for selected battery");
          setLoading(false);
          // Don't clear processedData - let user see old data structure
        }

        isInitialized.current = true;
      } catch (error) {
        console.error("useEnergyData: Error processing lambda data:", error);
        setProcessedData({
          latestHour: null,
          last24Hours: [],
          dailySummaries: [],
          _contentSignature: "error",
        });
        setLoading(false);
        isInitialized.current = true;
      }
    } else {
      // No lambda data available
      console.log("useEnergyData: No lambda data available");

      // Only set loading to true if we haven't initialized yet and have a valid battery
      if (
        !isInitialized.current &&
        selectedBatteryId &&
        selectedBatteryId !== "0700"
      ) {
        console.log("useEnergyData: Initial load, waiting for lambda data");
        setLoading(true);
      } else {
        setLoading(false);
      }

      isInitialized.current = true;
    }
  }, [lambdaResponse, selectedBatteryId]);

  // Calculate hasData - simple calculation
  const hasData =
    processedData.last24Hours.length > 0 ||
    processedData.dailySummaries.length > 0;

  console.log("useEnergyData: Returning:", {
    loading,
    hasData,
    contentSignature: processedData._contentSignature,
    last24HoursCount: processedData.last24Hours.length,
    dailySummariesCount: processedData.dailySummaries.length,
  });

  return {
    loading,
    processedData,
    hasData,
  };
};
