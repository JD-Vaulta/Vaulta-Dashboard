import React from "react";

const DataVisualization = ({ data, taskType }) => {
  // If no data is available, show a message
  if (!data) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          color: "#666",
        }}
      >
        No data available for visualization. Please collect data first.
      </div>
    );
  }

  // For now, use the same visualization for all task types
  return (
    <div style={{ padding: "15px" }}>
      <h3 style={{ marginBottom: "15px", fontWeight: "500" }}>
        {taskType === "batteryHealth"
          ? "Battery Health Analysis"
          : taskType === "anomalyDetection"
          ? "Anomaly Detection Analysis"
          : taskType === "energyOptimization"
          ? "Energy Optimization Analysis"
          : taskType === "predictiveMaintenance"
          ? "Predictive Maintenance Analysis"
          : "Data Analysis"}
      </h3>

      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "500" }}>
          Data Overview
        </h4>
        <div
          style={{
            backgroundColor: "#f0f4ff",
            padding: "15px",
            borderRadius: "8px",
            minWidth: "200px",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>Data Points</div>
          <div
            style={{ fontSize: "18px", fontWeight: "600", marginTop: "5px" }}
          >
            {data.meta?.dataPoints || "N/A"}
          </div>

          {data.meta?.tagId && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>Tag ID</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginTop: "5px",
                }}
              >
                {data.meta.tagId}
              </div>
            </div>
          )}

          {data.meta?.timeRange && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>Time Range</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginTop: "5px",
                }}
              >
                {data.meta.timeRange}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "500" }}>
          Processing Information
        </h4>
        <div
          style={{
            backgroundColor: "#f0fff4",
            padding: "15px",
            borderRadius: "8px",
            minWidth: "200px",
          }}
        >
          {data.meta?.isFromCache ? (
            <div
              style={{
                backgroundColor: "#E1F5FE",
                color: "#0288D1",
                padding: "5px 10px",
                borderRadius: "4px",
                display: "inline-block",
                marginBottom: "10px",
                fontSize: "14px",
              }}
            >
              Using cached data
            </div>
          ) : null}

          {data.meta?.timing && (
            <div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Processing Time
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginTop: "5px",
                }}
              >
                {data.meta.timing.totalDuration
                  ? `${(data.meta.timing.totalDuration / 1000).toFixed(
                      2
                    )} seconds`
                  : "N/A"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: "10px", fontWeight: "500" }}>
          Sample Data Preview
        </h4>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          <pre>{JSON.stringify(data.rawSampleData || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
