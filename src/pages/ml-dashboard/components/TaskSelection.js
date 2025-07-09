import React from "react";
import { collectMLData } from "../services/dataCollector.js";
import { ProgressBar } from "./ProgressComponents.js";

// Component for displaying parameters
const ParameterCard = ({ title, parameters }) => (
  <div
    style={{
      backgroundColor: "#f9f9f9",
      padding: "10px",
      borderRadius: "8px",
      margin: "10px 0",
    }}
  >
    <h4 style={{ margin: "0 0 10px 0", fontWeight: "500" }}>{title}</h4>
    <ul style={{ margin: 0, paddingLeft: "20px" }}>
      {parameters.map((param, index) => (
        <li key={index}>{param}</li>
      ))}
    </ul>
  </div>
);

// Status indicator component with progress
const StatusIndicator = ({
  taskType,
  dataCollectionStatus,
  progressInfo,
  getProgressPercentage,
  hasCachedData,
}) => {
  const status = dataCollectionStatus[taskType];
  const progress = progressInfo[taskType];

  const getStatusColor = () => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "In Progress":
        return "#FFC107";
      case "Failed":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: getStatusColor(),
            marginRight: "8px",
          }}
        ></div>
        <span>{status}</span>
        {hasCachedData() &&
          status !== "In Progress" &&
          status !== "Completed" && (
            <span
              style={{
                marginLeft: "10px",
                fontSize: "12px",
                backgroundColor: "#E1F5FE",
                color: "#0288D1",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Cached data available
            </span>
          )}
      </div>

      {/* Show progress bar for in-progress tasks */}
      {status === "In Progress" && (
        <>
          <ProgressBar
            percentage={getProgressPercentage(taskType)}
            status={progress?.status || "in_progress"}
          />
          <div style={{ fontSize: "12px", color: "#666" }}>
            {progress?.message || "Processing..."}
          </div>
        </>
      )}
    </div>
  );
};

// Process data for a specific task type
const processDataForTask = (taskType, data) => {
  // Process data based on taskType using the same processing functions as in MLDataCollector
  switch (taskType) {
    case "batteryHealth":
      return { processBatteryHealthData: true, data }; // This would call processBatteryHealthData(data)
    case "anomalyDetection":
      return { processAnomalyData: true, data }; // This would call processAnomalyData(data)
    case "energyOptimization":
      return { processEnergyData: true, data }; // This would call processEnergyData(data)
    case "predictiveMaintenance":
      return { processMaintenanceData: true, data }; // This would call processMaintenanceData(data)
    default:
      return { error: "Unknown task type" };
  }
};

const TaskSelection = ({
  dataCollectionStatus,
  progressInfo,
  getProgressPercentage,
  hasCachedData,
  selectedTagId,
  selectedTimeRange,
  customChunkCount,
  setMlData,
  setRawData,
  setActiveTask,
  getCacheKey,
  rawData,
  handleProgressUpdate,
}) => {
  // Function to collect data for ML tasks
  const handleCollectData = async (taskType) => {
    const cacheKey = getCacheKey(selectedTagId, selectedTimeRange);

    // Check if we already have this data in cache
    if (rawData[cacheKey]) {
      console.log(
        `Using cached data for ${selectedTagId} with time range ${selectedTimeRange}`
      );

      // Update UI to show we're processing the cached data
      handleProgressUpdate(taskType, {
        stage: "processing",
        status: "in_progress",
        message: "Processing cached data...",
      });

      try {
        // Process the cached data for this specific task
        // Note: In a real implementation, you'd call the actual processing functions
        // For this example, we're simulating the processing with a timeout
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulate processed data result
        const processedResult = {
          meta: {
            tagId: selectedTagId,
            timeRange: selectedTimeRange,
            dataPoints: rawData[cacheKey].length,
            isFromCache: true,
          },
          rawSampleData: rawData[cacheKey].slice(0, 5),
          processedData: processDataForTask(taskType, rawData[cacheKey]),
        };

        // Update ML data with the processed result
        setMlData((prevData) => ({
          ...prevData,
          [taskType]: processedResult,
        }));

        // Set active task to the one just processed
        setActiveTask(taskType);

        // Update progress info to completed
        handleProgressUpdate(taskType, {
          stage: "completed",
          status: "complete",
          message: "Successfully processed cached data",
        });

        console.log(`Successfully processed cached data for ${taskType}`);
      } catch (error) {
        console.error(`Error processing cached data for ${taskType}:`, error);

        // Final error state update
        handleProgressUpdate(taskType, {
          stage: "error",
          status: "error",
          message: `Error: ${error.message}`,
        });
      }

      return;
    }

    // No cached data, need to fetch from server
    // Reset progress info for this task
    handleProgressUpdate(taskType, {
      stage: "starting",
      status: "in_progress",
      message: "Starting data collection...",
    });

    try {
      // Call the specialized ML data collection function with progress callback
      // Pass the custom chunk count to the collector
      const collectedData = await collectMLData(
        selectedTagId,
        selectedTimeRange,
        taskType,
        (progress) => handleProgressUpdate(taskType, progress),
        customChunkCount // Pass the custom chunk count to the collector
      );

      // Cache the raw data for future use
      if (collectedData.rawData) {
        setRawData((prev) => ({
          ...prev,
          [cacheKey]: collectedData.rawData,
        }));
      }

      // Set the ML data for this specific task
      setMlData((prevData) => ({
        ...prevData,
        [taskType]: collectedData,
      }));

      // Set active task to the one just collected
      setActiveTask(taskType);

      console.log(`Successfully collected ${taskType} data:`, collectedData);
    } catch (error) {
      console.error(`Error collecting data for ${taskType}:`, error);

      // Final error state update
      handleProgressUpdate(taskType, {
        stage: "error",
        status: "error",
        message: `Error: ${error.message}`,
      });
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "20px",
        marginTop: "30px",
      }}
    >
      {/* 1. Battery Health Prediction Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#1259c3",
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "1px solid #e6e6e6",
          }}
        >
          Battery Health Prediction
        </h2>

        <p style={{ marginBottom: "15px", color: "#666666" }}>
          Predicts remaining useful life and capacity degradation based on
          historical patterns.
        </p>

        <ParameterCard
          title="Required Parameters"
          parameters={[
            "Voltage patterns over time (min, max, avg)",
            "Current draw patterns",
            "Temperature fluctuations",
            "Charge-discharge cycle count",
            "State of Charge (SOC) history",
            "Battery age",
          ]}
        />

        <button
          onClick={() => handleCollectData("batteryHealth")}
          disabled={dataCollectionStatus.batteryHealth === "In Progress"}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1259c3",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor:
              dataCollectionStatus.batteryHealth === "In Progress"
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            opacity:
              dataCollectionStatus.batteryHealth === "In Progress" ? 0.7 : 1,
            marginTop: "15px",
          }}
        >
          {dataCollectionStatus.batteryHealth === "In Progress"
            ? "Collecting..."
            : hasCachedData()
            ? "Use Cached Data"
            : "Collect Data"}
        </button>

        <StatusIndicator
          taskType="batteryHealth"
          dataCollectionStatus={dataCollectionStatus}
          progressInfo={progressInfo}
          getProgressPercentage={getProgressPercentage}
          hasCachedData={hasCachedData}
        />
      </div>

      {/* 2. Anomaly Detection Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#1259c3",
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "1px solid #e6e6e6",
          }}
        >
          Anomaly Detection
        </h2>

        <p style={{ marginBottom: "15px", color: "#666666" }}>
          Identifies unusual battery behavior that may indicate faults or safety
          issues.
        </p>

        <ParameterCard
          title="Required Parameters"
          parameters={[
            "Real-time voltage, current, temperature",
            "Internal resistance calculations",
            "Rate of change in key parameters",
            "Normal operation baseline data",
          ]}
        />

        <button
          onClick={() => handleCollectData("anomalyDetection")}
          disabled={dataCollectionStatus.anomalyDetection === "In Progress"}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1259c3",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor:
              dataCollectionStatus.anomalyDetection === "In Progress"
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            opacity:
              dataCollectionStatus.anomalyDetection === "In Progress" ? 0.7 : 1,
            marginTop: "15px",
          }}
        >
          {dataCollectionStatus.anomalyDetection === "In Progress"
            ? "Collecting..."
            : hasCachedData()
            ? "Use Cached Data"
            : "Collect Data"}
        </button>

        <StatusIndicator
          taskType="anomalyDetection"
          dataCollectionStatus={dataCollectionStatus}
          progressInfo={progressInfo}
          getProgressPercentage={getProgressPercentage}
          hasCachedData={hasCachedData}
        />
      </div>

      {/* 3. Energy Optimization Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#1259c3",
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "1px solid #e6e6e6",
          }}
        >
          Energy Optimization
        </h2>

        <p style={{ marginBottom: "15px", color: "#666666" }}>
          Predicts optimal charging/discharging cycles and forecasts energy
          demands.
        </p>

        <ParameterCard
          title="Required Parameters"
          parameters={[
            "Time series of energy usage",
            "Time of day, day of week patterns",
            "Environmental factors (temperature)",
            "Previous charging patterns",
            "1+ year of historical usage data",
          ]}
        />

        <button
          onClick={() => handleCollectData("energyOptimization")}
          disabled={dataCollectionStatus.energyOptimization === "In Progress"}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1259c3",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor:
              dataCollectionStatus.energyOptimization === "In Progress"
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            opacity:
              dataCollectionStatus.energyOptimization === "In Progress"
                ? 0.7
                : 1,
            marginTop: "15px",
          }}
        >
          {dataCollectionStatus.energyOptimization === "In Progress"
            ? "Collecting..."
            : hasCachedData()
            ? "Use Cached Data"
            : "Collect Data"}
        </button>

        <StatusIndicator
          taskType="energyOptimization"
          dataCollectionStatus={dataCollectionStatus}
          progressInfo={progressInfo}
          getProgressPercentage={getProgressPercentage}
          hasCachedData={hasCachedData}
        />
      </div>

      {/* 4. Predictive Maintenance Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#1259c3",
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "1px solid #e6e6e6",
          }}
        >
          Predictive Maintenance
        </h2>

        <p style={{ marginBottom: "15px", color: "#666666" }}>
          Schedules maintenance based on predicted failure patterns to reduce
          downtime.
        </p>

        <ParameterCard
          title="Required Parameters"
          parameters={[
            "Statistical patterns in voltage/current",
            "Cycle information",
            "Temperature extremes and fluctuations",
            "Charging efficiency metrics",
            "Historical maintenance records",
          ]}
        />

        <button
          onClick={() => handleCollectData("predictiveMaintenance")}
          disabled={
            dataCollectionStatus.predictiveMaintenance === "In Progress"
          }
          style={{
            padding: "10px 20px",
            backgroundColor: "#1259c3",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor:
              dataCollectionStatus.predictiveMaintenance === "In Progress"
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            opacity:
              dataCollectionStatus.predictiveMaintenance === "In Progress"
                ? 0.7
                : 1,
            marginTop: "15px",
          }}
        >
          {dataCollectionStatus.predictiveMaintenance === "In Progress"
            ? "Collecting..."
            : hasCachedData()
            ? "Use Cached Data"
            : "Collect Data"}
        </button>

        <StatusIndicator
          taskType="predictiveMaintenance"
          dataCollectionStatus={dataCollectionStatus}
          progressInfo={progressInfo}
          getProgressPercentage={getProgressPercentage}
          hasCachedData={hasCachedData}
        />
      </div>
    </div>
  );
};

export default TaskSelection;
