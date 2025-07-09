import { useState, useEffect } from "react";
import { processEnergyData } from "../utils/energyHelpers.js";

export const useEnergyData = (bmsData, lambdaResponse) => {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState({});

  useEffect(() => {
    const hasBmsData = bmsData?.lastMinuteData?.length > 0;
    const hasLambdaData =
      lambdaResponse && Object.keys(lambdaResponse).length > 0;

    if (hasBmsData && hasLambdaData) {
      const processed = processEnergyData(lambdaResponse);
      setProcessedData(processed);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [bmsData, lambdaResponse]);

  return { loading, processedData };
};
