/**
 * taskProcessing.js
 *
 * This module contains utility functions for processing battery data for
 * specific machine learning tasks. Each function handles a different
 * task type (battery health, anomaly detection, energy optimization, or
 * predictive maintenance).
 */

// ===== UPDATE FUNCTIONS =====
// These functions merge newly processed data with existing data

/**
 * Updates battery health data with a new batch of processed data
 * @param {Object} currentData - Current battery health data object
 * @param {Object} newData - New batch of raw data to process and merge
 */
export const updateBatteryHealthData = (currentData, newData) => {
  // Process the new data batch
  const newStats = processBatteryHealthData(newData);

  // Update voltage statistics
  currentData.voltageStats.min = Math.min(
    currentData.voltageStats.min,
    newStats.voltageStats.min
  );
  currentData.voltageStats.max = Math.max(
    currentData.voltageStats.max,
    newStats.voltageStats.max
  );

  // Update current statistics
  currentData.currentStats.min = Math.min(
    currentData.currentStats.min,
    newStats.currentStats.min
  );
  currentData.currentStats.max = Math.max(
    currentData.currentStats.max,
    newStats.currentStats.max
  );

  // Update temperature statistics
  currentData.temperatureStats.min = Math.min(
    currentData.temperatureStats.min,
    newStats.temperatureStats.min
  );
  currentData.temperatureStats.max = Math.max(
    currentData.temperatureStats.max,
    newStats.temperatureStats.max
  );

  // Merge and sort SOC history
  currentData.socHistory = [
    ...currentData.socHistory,
    ...newStats.socHistory,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Add cycle counts
  currentData.cycleCount += newStats.cycleCount;

  // Keep the earliest estimated age
  if (newStats.estimatedAge < currentData.estimatedAge) {
    currentData.estimatedAge = newStats.estimatedAge;
  }
};

/**
 * Updates anomaly detection data with a new batch of processed data
 * @param {Object} currentData - Current anomaly detection data object
 * @param {Object} newData - New batch of raw data to process and merge
 */
export const updateAnomalyData = (currentData, newData) => {
  const newStats = processAnomalyData(newData);

  // Keep only the most recent readings up to a limit
  currentData.recentReadings = [
    ...currentData.recentReadings,
    ...newStats.recentReadings,
  ]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-50); // Keep only the 50 most recent entries

  // Merge internal resistance values
  currentData.internalResistanceValues = [
    ...currentData.internalResistanceValues,
    ...newStats.internalResistanceValues,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Update rate of change data for all parameter types
  ["voltage", "current", "temperature"].forEach((param) => {
    currentData.rateOfChange[param] = [
      ...currentData.rateOfChange[param],
      ...newStats.rateOfChange[param],
    ].sort((a, b) => a.timestamp - b.timestamp);
  });

  // Recalculate normal operation bounds - this would typically happen after all processing
  // We'll just use the existing bounds here, but they should be updated at the end
};

/**
 * Updates energy optimization data with a new batch of processed data
 * @param {Object} currentData - Current energy optimization data object
 * @param {Object} newData - New batch of raw data to process and merge
 */
export const updateEnergyData = (currentData, newData) => {
  const newStats = processEnergyData(newData);

  // Merge time series data
  currentData.timeSeriesData = [
    ...currentData.timeSeriesData,
    ...newStats.timeSeriesData,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Merge environmental factors
  currentData.environmentalFactors = [
    ...currentData.environmentalFactors,
    ...newStats.environmentalFactors,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Merge charging patterns
  currentData.chargingPatterns = [
    ...currentData.chargingPatterns,
    ...newStats.chargingPatterns,
  ].sort((a, b) => a.startTime - b.startTime);

  // Note: Usage patterns need recalculation at the end of all processing
  // We keep the existing patterns here, but they would need to be recalculated
  // based on the complete dataset
};

/**
 * Updates predictive maintenance data with a new batch of processed data
 * @param {Object} currentData - Current predictive maintenance data object
 * @param {Object} newData - New batch of raw data to process and merge
 */
export const updateMaintenanceData = (currentData, newData) => {
  const newStats = processMaintenanceData(newData);

  // Update statistical patterns for voltage and current
  ["voltage", "current"].forEach((param) => {
    if (newStats.statisticalPatterns[param].trend.length > 0) {
      currentData.statisticalPatterns[param].trend = [
        ...currentData.statisticalPatterns[param].trend,
        ...newStats.statisticalPatterns[param].trend,
      ].sort((a, b) => a.timestamp - b.timestamp);
    }
  });

  // Update cycle information
  currentData.cycleInformation.count += newStats.cycleInformation.count;
  currentData.cycleInformation.depthOfDischarge = [
    ...currentData.cycleInformation.depthOfDischarge,
    ...newStats.cycleInformation.depthOfDischarge,
  ];
  currentData.cycleInformation.chargeDurations = [
    ...currentData.cycleInformation.chargeDurations,
    ...newStats.cycleInformation.chargeDurations,
  ];
  currentData.cycleInformation.dischargeDurations = [
    ...currentData.cycleInformation.dischargeDurations,
    ...newStats.cycleInformation.dischargeDurations,
  ];

  // Update temperature extremes
  currentData.temperatureExtremes.max = Math.max(
    currentData.temperatureExtremes.max,
    newStats.temperatureExtremes.max
  );
  currentData.temperatureExtremes.min = Math.min(
    currentData.temperatureExtremes.min,
    newStats.temperatureExtremes.min
  );
  currentData.temperatureExtremes.fluctuations = [
    ...currentData.temperatureExtremes.fluctuations,
    ...newStats.temperatureExtremes.fluctuations,
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Update charging efficiency metrics
  currentData.chargingEfficiency = [
    ...currentData.chargingEfficiency,
    ...newStats.chargingEfficiency,
  ];
};

// ===== PROCESSING FUNCTIONS =====
// These functions process raw data for specific ML tasks

/**
 * Processes battery data to extract health-related parameters
 * @param {Array} data - Array of battery data points
 * @returns {Object} Processed battery health parameters
 */
export const processBatteryHealthData = (data) => {
  // Initialize health parameters structure
  const healthParameters = {
    voltageStats: {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      avg: 0,
      stdDev: 0,
    },
    currentStats: {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      avg: 0,
      stdDev: 0,
    },
    temperatureStats: {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      avg: 0,
      stdDev: 0,
    },
    cycleCount: 0,
    socHistory: [],
    estimatedAge: Number.MAX_VALUE, // In days
  };

  // Accumulators for calculating statistics
  let voltageSum = 0;
  let currentSum = 0;
  let tempSum = 0;
  let voltageValues = [];
  let currentValues = [];
  let tempValues = [];
  let cycleEvents = 0;

  // Process each data point
  data.forEach((item) => {
    // Extract voltage data
    const voltage = item.TotalBattVoltage?.N
      ? parseFloat(item.TotalBattVoltage.N)
      : 0;
    voltageSum += voltage;
    voltageValues.push(voltage);
    healthParameters.voltageStats.min = Math.min(
      healthParameters.voltageStats.min,
      voltage
    );
    healthParameters.voltageStats.max = Math.max(
      healthParameters.voltageStats.max,
      voltage
    );

    // Extract current data
    const current = item.TotalCurrent?.N ? parseFloat(item.TotalCurrent.N) : 0;
    currentSum += current;
    currentValues.push(current);
    healthParameters.currentStats.min = Math.min(
      healthParameters.currentStats.min,
      current
    );
    healthParameters.currentStats.max = Math.max(
      healthParameters.currentStats.max,
      current
    );

    // Extract temperature data
    const temp = item.MaxCellTemp?.N ? parseFloat(item.MaxCellTemp.N) : 0;
    tempSum += temp;
    tempValues.push(temp);
    healthParameters.temperatureStats.min = Math.min(
      healthParameters.temperatureStats.min,
      temp
    );
    healthParameters.temperatureStats.max = Math.max(
      healthParameters.temperatureStats.max,
      temp
    );

    // Extract SOC history
    if (item.SOCPercent?.N) {
      healthParameters.socHistory.push({
        timestamp: parseInt(item.Timestamp.N),
        value: parseFloat(item.SOCPercent.N),
      });
    }

    // Detect charge cycles (when current changes from negative to positive)
    if (
      currentValues.length > 1 &&
      currentValues[currentValues.length - 2] < 0 &&
      current > 0
    ) {
      cycleEvents++;
    }
  });

  // Calculate averages
  const count = data.length || 1; // Avoid division by zero
  healthParameters.voltageStats.avg = voltageSum / count;
  healthParameters.currentStats.avg = currentSum / count;
  healthParameters.temperatureStats.avg = tempSum / count;

  // Calculate standard deviations
  let voltageVarianceSum = 0;
  let currentVarianceSum = 0;
  let tempVarianceSum = 0;

  voltageValues.forEach((v) => {
    voltageVarianceSum += Math.pow(v - healthParameters.voltageStats.avg, 2);
  });

  currentValues.forEach((c) => {
    currentVarianceSum += Math.pow(c - healthParameters.currentStats.avg, 2);
  });

  tempValues.forEach((t) => {
    tempVarianceSum += Math.pow(t - healthParameters.temperatureStats.avg, 2);
  });

  healthParameters.voltageStats.stdDev = Math.sqrt(voltageVarianceSum / count);
  healthParameters.currentStats.stdDev = Math.sqrt(currentVarianceSum / count);
  healthParameters.temperatureStats.stdDev = Math.sqrt(tempVarianceSum / count);

  // Estimate cycle count
  healthParameters.cycleCount = cycleEvents;

  // Estimate battery age from the earliest timestamp
  if (data.length > 0) {
    const timestamps = data.map((item) => parseInt(item.Timestamp.N));
    const earliestTimestamp = Math.min(...timestamps);
    const currentTime = Math.floor(Date.now() / 1000);
    healthParameters.estimatedAge = Math.floor(
      (currentTime - earliestTimestamp) / 86400
    ); // Convert to days
  }

  return healthParameters;
};

/**
 * Processes battery data to extract anomaly detection parameters
 * @param {Array} data - Array of battery data points
 * @returns {Object} Processed anomaly detection parameters
 */
export const processAnomalyData = (data) => {
  // Initialize anomaly parameters structure
  const anomalyParameters = {
    recentReadings: [],
    internalResistanceValues: [],
    rateOfChange: {
      voltage: [],
      current: [],
      temperature: [],
    },
    normalOperationBounds: {
      voltage: { min: 0, max: 0 },
      current: { min: 0, max: 0 },
      temperature: { min: 0, max: 0 },
    },
  };

  // Get recent readings (last 24 hours)
  const now = Math.floor(Date.now() / 1000);
  const last24Hours = now - 86400;

  anomalyParameters.recentReadings = data
    .filter((item) => parseInt(item.Timestamp.N) > last24Hours)
    .map((item) => ({
      timestamp: parseInt(item.Timestamp.N),
      voltage: item.TotalBattVoltage?.N
        ? parseFloat(item.TotalBattVoltage.N)
        : null,
      current: item.TotalCurrent?.N ? parseFloat(item.TotalCurrent.N) : null,
      temperature: item.MaxCellTemp?.N ? parseFloat(item.MaxCellTemp.N) : null,
    }));

  // Calculate internal resistance values (V/I when |I| > 0.1)
  data.forEach((item) => {
    const voltage = item.TotalBattVoltage?.N
      ? parseFloat(item.TotalBattVoltage.N)
      : 0;
    const current = item.TotalCurrent?.N ? parseFloat(item.TotalCurrent.N) : 0;

    if (Math.abs(current) > 0.1) {
      const resistance = voltage / current;
      anomalyParameters.internalResistanceValues.push({
        timestamp: parseInt(item.Timestamp.N),
        value: resistance,
      });
    }
  });

  // Calculate rate of change for voltage, current, and temperature
  for (let i = 1; i < data.length; i++) {
    const currentItem = data[i];
    const prevItem = data[i - 1];

    const currentTime = parseInt(currentItem.Timestamp.N);
    const prevTime = parseInt(prevItem.Timestamp.N);
    const timeDiff = currentTime - prevTime;

    if (timeDiff > 0) {
      // Avoid division by zero
      // Voltage rate of change
      if (currentItem.TotalBattVoltage?.N && prevItem.TotalBattVoltage?.N) {
        const voltChange =
          (parseFloat(currentItem.TotalBattVoltage.N) -
            parseFloat(prevItem.TotalBattVoltage.N)) /
          timeDiff;
        anomalyParameters.rateOfChange.voltage.push({
          timestamp: currentTime,
          value: voltChange,
        });
      }

      // Current rate of change
      if (currentItem.TotalCurrent?.N && prevItem.TotalCurrent?.N) {
        const currChange =
          (parseFloat(currentItem.TotalCurrent.N) -
            parseFloat(prevItem.TotalCurrent.N)) /
          timeDiff;
        anomalyParameters.rateOfChange.current.push({
          timestamp: currentTime,
          value: currChange,
        });
      }

      // Temperature rate of change
      if (currentItem.MaxCellTemp?.N && prevItem.MaxCellTemp?.N) {
        const tempChange =
          (parseFloat(currentItem.MaxCellTemp.N) -
            parseFloat(prevItem.MaxCellTemp.N)) /
          timeDiff;
        anomalyParameters.rateOfChange.temperature.push({
          timestamp: currentTime,
          value: tempChange,
        });
      }
    }
  }

  // Extract arrays of values for statistics
  const voltages = data
    .filter((item) => item.TotalBattVoltage?.N)
    .map((item) => parseFloat(item.TotalBattVoltage.N));

  const currents = data
    .filter((item) => item.TotalCurrent?.N)
    .map((item) => parseFloat(item.TotalCurrent.N));

  const temperatures = data
    .filter((item) => item.MaxCellTemp?.N)
    .map((item) => parseFloat(item.MaxCellTemp.N));

  // Calculate normal operation bounds using mean ± 2*stdDev
  if (voltages.length > 0) {
    const vMean = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
    const vStdDev = Math.sqrt(
      voltages.reduce((sum, v) => sum + Math.pow(v - vMean, 2), 0) /
        voltages.length
    );

    anomalyParameters.normalOperationBounds.voltage = {
      min: vMean - 2 * vStdDev, // 2 standard deviations below mean
      max: vMean + 2 * vStdDev, // 2 standard deviations above mean
    };
  }

  if (currents.length > 0) {
    const cMean = currents.reduce((sum, c) => sum + c, 0) / currents.length;
    const cStdDev = Math.sqrt(
      currents.reduce((sum, c) => sum + Math.pow(c - cMean, 2), 0) /
        currents.length
    );

    anomalyParameters.normalOperationBounds.current = {
      min: cMean - 2 * cStdDev,
      max: cMean + 2 * cStdDev,
    };
  }

  if (temperatures.length > 0) {
    const tMean =
      temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
    const tStdDev = Math.sqrt(
      temperatures.reduce((sum, t) => sum + Math.pow(t - tMean, 2), 0) /
        temperatures.length
    );

    anomalyParameters.normalOperationBounds.temperature = {
      min: tMean - 2 * tStdDev,
      max: tMean + 2 * tStdDev,
    };
  }

  return anomalyParameters;
};

/**
 * Processes battery data to extract energy optimization parameters
 * @param {Array} data - Array of battery data points
 * @returns {Object} Processed energy optimization parameters
 */
export const processEnergyData = (data) => {
  // Initialize energy parameters structure
  const energyParameters = {
    usagePatterns: {
      hourly: Array(24).fill(0), // Usage by hour of day
      daily: Array(7).fill(0), // Usage by day of week
    },
    environmentalFactors: [],
    chargingPatterns: [],
    timeSeriesData: [],
  };

  // Extract time series of power data (P = V*I)
  const timeSeriesPoints = data
    .filter((item) => item.TotalBattVoltage?.N && item.TotalCurrent?.N)
    .map((item) => {
      const timestamp = parseInt(item.Timestamp.N);
      const voltage = parseFloat(item.TotalBattVoltage.N);
      const current = parseFloat(item.TotalCurrent.N);
      const power = voltage * current; // Power in watts

      return {
        timestamp,
        power,
        date: new Date(timestamp * 1000),
      };
    });

  // Add time series data to the output
  energyParameters.timeSeriesData = timeSeriesPoints.map((point) => ({
    timestamp: point.timestamp,
    power: point.power,
  }));

  // Analyze usage patterns by hour of day
  timeSeriesPoints.forEach((point) => {
    const hour = point.date.getHours();
    energyParameters.usagePatterns.hourly[hour] += Math.abs(point.power);
  });

  // Normalize hourly data to create a distribution
  const hourlySum = energyParameters.usagePatterns.hourly.reduce(
    (sum, val) => sum + val,
    0
  );
  if (hourlySum > 0) {
    energyParameters.usagePatterns.hourly =
      energyParameters.usagePatterns.hourly.map((val) => val / hourlySum);
  }

  // Analyze usage patterns by day of week
  timeSeriesPoints.forEach((point) => {
    const dayOfWeek = point.date.getDay(); // 0 = Sunday, 6 = Saturday
    energyParameters.usagePatterns.daily[dayOfWeek] += Math.abs(point.power);
  });

  // Normalize daily data to create a distribution
  const dailySum = energyParameters.usagePatterns.daily.reduce(
    (sum, val) => sum + val,
    0
  );
  if (dailySum > 0) {
    energyParameters.usagePatterns.daily =
      energyParameters.usagePatterns.daily.map((val) => val / dailySum);
  }

  // Extract environmental factors (using temperature as proxy)
  energyParameters.environmentalFactors = data
    .filter((item) => item.MaxCellTemp?.N && item.Timestamp?.N)
    .map((item) => ({
      timestamp: parseInt(item.Timestamp.N),
      temperature: parseFloat(item.MaxCellTemp.N),
    }));

  // Extract charging patterns (when current is negative)
  let isCharging = false;
  let chargeStartTime = null;

  data.forEach((item) => {
    if (!item.TotalCurrent?.N || !item.Timestamp?.N) return;

    const current = parseFloat(item.TotalCurrent.N);
    const timestamp = parseInt(item.Timestamp.N);

    if (current < 0 && !isCharging) {
      // Charging started
      isCharging = true;
      chargeStartTime = timestamp;
    } else if (current >= 0 && isCharging) {
      // Charging ended
      isCharging = false;

      if (chargeStartTime) {
        const chargeDuration = timestamp - chargeStartTime;

        energyParameters.chargingPatterns.push({
          startTime: chargeStartTime,
          endTime: timestamp,
          duration: chargeDuration, // in seconds
          startDate: new Date(chargeStartTime * 1000),
          endDate: new Date(timestamp * 1000),
        });

        chargeStartTime = null;
      }
    }
  });

  return energyParameters;
};

/**
 * Processes battery data to extract predictive maintenance parameters
 * @param {Array} data - Array of battery data points
 * @returns {Object} Processed predictive maintenance parameters
 */
export const processMaintenanceData = (data) => {
  // Initialize maintenance parameters structure
  const maintenanceParameters = {
    statisticalPatterns: {
      voltage: {
        mean: 0,
        stdDev: 0,
        trend: [],
      },
      current: {
        mean: 0,
        stdDev: 0,
        trend: [],
      },
    },
    cycleInformation: {
      count: 0,
      depthOfDischarge: [],
      chargeDurations: [],
      dischargeDurations: [],
    },
    temperatureExtremes: {
      max: 0,
      min: 100, // Start high to find minimum
      fluctuations: [],
    },
    chargingEfficiency: [],
  };

  // Extract arrays of values for statistics
  const voltages = data
    .filter((item) => item.TotalBattVoltage?.N)
    .map((item) => parseFloat(item.TotalBattVoltage.N));

  const currents = data
    .filter((item) => item.TotalCurrent?.N)
    .map((item) => parseFloat(item.TotalCurrent.N));

  const temperatures = data
    .filter((item) => item.MaxCellTemp?.N)
    .map((item) => parseFloat(item.MaxCellTemp.N));

  // Calculate voltage statistics
  if (voltages.length > 0) {
    maintenanceParameters.statisticalPatterns.voltage.mean =
      voltages.reduce((sum, v) => sum + v, 0) / voltages.length;

    maintenanceParameters.statisticalPatterns.voltage.stdDev = Math.sqrt(
      voltages.reduce(
        (sum, v) =>
          sum +
          Math.pow(
            v - maintenanceParameters.statisticalPatterns.voltage.mean,
            2
          ),
        0
      ) / voltages.length
    );
  }

  // Calculate current statistics
  if (currents.length > 0) {
    maintenanceParameters.statisticalPatterns.current.mean =
      currents.reduce((sum, c) => sum + c, 0) / currents.length;

    maintenanceParameters.statisticalPatterns.current.stdDev = Math.sqrt(
      currents.reduce(
        (sum, c) =>
          sum +
          Math.pow(
            c - maintenanceParameters.statisticalPatterns.current.mean,
            2
          ),
        0
      ) / currents.length
    );
  }

  // Create voltage and current trends using moving averages
  const windowSize = Math.min(24, Math.floor(data.length / 10)); // Use 10% of data or 24 points, whichever is smaller

  if (windowSize > 0) {
    // Calculate voltage moving average
    for (let i = windowSize; i < data.length; i++) {
      if (data[i].TotalBattVoltage?.N && data[i].Timestamp?.N) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          if (data[i - j].TotalBattVoltage?.N) {
            sum += parseFloat(data[i - j].TotalBattVoltage.N);
          }
        }

        maintenanceParameters.statisticalPatterns.voltage.trend.push({
          timestamp: parseInt(data[i].Timestamp.N),
          value: sum / windowSize,
        });
      }

      // Calculate current moving average
      if (data[i].TotalCurrent?.N && data[i].Timestamp?.N) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          if (data[i - j].TotalCurrent?.N) {
            sum += parseFloat(data[i - j].TotalCurrent.N);
          }
        }

        maintenanceParameters.statisticalPatterns.current.trend.push({
          timestamp: parseInt(data[i].Timestamp.N),
          value: sum / windowSize,
        });
      }
    }
  }

  // Calculate temperature extremes
  if (temperatures.length > 0) {
    maintenanceParameters.temperatureExtremes.max = Math.max(...temperatures);
    maintenanceParameters.temperatureExtremes.min = Math.min(...temperatures);
  }

  // Calculate significant temperature fluctuations
  for (let i = 1; i < data.length; i++) {
    if (
      data[i].MaxCellTemp?.N &&
      data[i - 1].MaxCellTemp?.N &&
      data[i].Timestamp?.N
    ) {
      const currentTemp = parseFloat(data[i].MaxCellTemp.N);
      const prevTemp = parseFloat(data[i - 1].MaxCellTemp.N);
      const tempChange = Math.abs(currentTemp - prevTemp);

      if (tempChange > 1) {
        // Only record significant changes (> 1°C)
        maintenanceParameters.temperatureExtremes.fluctuations.push({
          timestamp: parseInt(data[i].Timestamp.N),
          change: tempChange,
        });
      }
    }
  }

  // Track charge/discharge cycles and calculate efficiency
  let isCharging = false;
  let chargeStartTime = null;
  let dischargeStartTime = null;
  let chargeStartSOC = null;
  let dischargeStartSOC = null;
  let chargeEnergy = 0;

  data.forEach((item) => {
    if (!item.TotalCurrent?.N || !item.Timestamp?.N) return;

    const current = parseFloat(item.TotalCurrent.N);
    const timestamp = parseInt(item.Timestamp.N);
    const soc = item.SOCPercent?.N ? parseFloat(item.SOCPercent.N) : null;
    const voltage = item.TotalBattVoltage?.N
      ? parseFloat(item.TotalBattVoltage.N)
      : 0;

    // Calculate instantaneous power
    const power = voltage * current; // W
    const energy = Math.abs(power); // Absolute energy

    if (current < 0 && !isCharging) {
      // Charging started
      isCharging = true;
      chargeStartTime = timestamp;
      chargeStartSOC = soc;
      chargeEnergy = 0;

      // End discharge cycle if active
      if (dischargeStartTime !== null) {
        const dischargeDuration = timestamp - dischargeStartTime;

        maintenanceParameters.cycleInformation.dischargeDurations.push({
          startTime: dischargeStartTime,
          endTime: timestamp,
          duration: dischargeDuration, // in seconds
        });

        // Calculate depth of discharge if SOC is available
        if (dischargeStartSOC !== null && soc !== null) {
          maintenanceParameters.cycleInformation.depthOfDischarge.push({
            startSOC: dischargeStartSOC,
            endSOC: soc,
            depth: dischargeStartSOC - soc,
          });
        }

        dischargeStartTime = null;
        dischargeStartSOC = null;

        // Increment cycle count
        maintenanceParameters.cycleInformation.count++;
      }
    } else if (current >= 0 && isCharging) {
      // Charging ended
      isCharging = false;

      if (chargeStartTime) {
        const chargeDuration = timestamp - chargeStartTime;

        maintenanceParameters.cycleInformation.chargeDurations.push({
          startTime: chargeStartTime,
          endTime: timestamp,
          duration: chargeDuration, // in seconds
        });

        // Start discharge cycle
        dischargeStartTime = timestamp;
        dischargeStartSOC = soc;

        // Calculate charging efficiency if SOC data is available
        if (chargeStartSOC !== null && soc !== null && chargeEnergy > 0) {
          const socGain = soc - chargeStartSOC;

          if (socGain > 0) {
            maintenanceParameters.chargingEfficiency.push({
              cycle: maintenanceParameters.cycleInformation.count,
              startSOC: chargeStartSOC,
              endSOC: soc,
              duration: chargeDuration,
              energyIn: chargeEnergy / 3600, // Convert to Wh
              efficiency: socGain / (chargeEnergy / 3600), // Efficiency in % per Wh
            });
          }
        }

        chargeStartTime = null;
        chargeStartSOC = null;
      }
    } else if (isCharging) {
      // During charging - accumulate energy
      chargeEnergy += energy;
    }
  });

  return maintenanceParameters;
};

/**
 * Module exports
 */
export default {
  // Update functions
  updateBatteryHealthData,
  updateAnomalyData,
  updateEnergyData,
  updateMaintenanceData,

  // Processing functions
  processBatteryHealthData,
  processAnomalyData,
  processEnergyData,
  processMaintenanceData,
};
