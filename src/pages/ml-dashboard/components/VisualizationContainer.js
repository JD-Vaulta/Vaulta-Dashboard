import React from "react";
import DataVisualization from "./DataVisualization.js";

const VisualizationContainer = ({
  mlData,
  activeTask,
  setActiveTask,
  showRawData,
  setShowRawData,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        marginTop: "30px",
      }}
    >
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          color: "#1259c3",
          marginBottom: "15px",
        }}
      >
        Data Analysis Results
      </h2>

      {/* Tabs for different task visualizations */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {Object.keys(mlData).map((taskKey) => (
          <button
            key={taskKey}
            onClick={() => setActiveTask(taskKey)}
            style={{
              padding: "8px 15px",
              backgroundColor: activeTask === taskKey ? "#1259c3" : "#f0f0f0",
              color: activeTask === taskKey ? "white" : "#333",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {taskKey === "batteryHealth"
              ? "Battery Health"
              : taskKey === "anomalyDetection"
              ? "Anomaly Detection"
              : taskKey === "energyOptimization"
              ? "Energy Optimization"
              : taskKey === "predictiveMaintenance"
              ? "Predictive Maintenance"
              : taskKey}
          </button>
        ))}
      </div>

      {/* Visualization panel */}
      <div
        style={{
          backgroundColor: "#f9f9f9",
          borderRadius: "10px",
          minHeight: "400px",
        }}
      >
        <DataVisualization data={mlData[activeTask]} taskType={activeTask} />
      </div>

      {/* Raw data preview toggle */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setShowRawData(!showRawData)}
          style={{
            padding: "8px 15px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {showRawData ? "Hide Raw Data" : "Show Raw Data"}
        </button>

        {showRawData && (
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              padding: "15px",
              marginTop: "15px",
              backgroundColor: "#f0f0f0",
              borderRadius: "10px",
              fontFamily: "monospace",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
            }}
          >
            {/* Show only the processed data for the active task rather than the full object */}
            {JSON.stringify(
              {
                meta: mlData[activeTask]?.meta || {},
                processedData: mlData[activeTask]?.processedData || {},
                isFromCache: mlData[activeTask]?.meta?.isFromCache || false,
              },
              null,
              2
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationContainer;
