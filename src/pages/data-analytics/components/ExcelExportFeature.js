// ExcelExportFeature.js
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { fetchLastWeekData } from "../../calc/lastweekdata.js";

const ExcelExportFeature = ({ selectedTagId, selectedTimeRange, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exportReady, setExportReady] = useState(false);
  const [exportData, setExportData] = useState(null);

  // Function to generate Excel file
  const generateExcel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);
    setExportReady(false);

    try {
      // Create listener for progress updates
      const originalConsoleLog = console.log;
      let itemsFetched = 0;
      let totalItems = 0;

      // Override console.log to capture progress data
      console.log = function (message) {
        originalConsoleLog.apply(console, arguments);
        if (message.includes("Fetched")) {
          const match = message.match(/Fetched (\d+) items/);
          if (match && match[1]) {
            itemsFetched += parseInt(match[1]);
            setProgress(itemsFetched);
          }
        } else if (message.includes("Total items fetched:")) {
          const match = message.match(/Total items fetched: (\d+)/);
          if (match && match[1]) {
            totalItems = parseInt(match[1]);
            setProgress(100);
          }
        }
      };

      // Fetch data
      const data = await fetchLastWeekData(selectedTagId, selectedTimeRange);

      // Restore original console.log
      console.log = originalConsoleLog;

      // Process data for export
      const processedData = prepareDataForExcel(data);
      setExportData(processedData);
      setExportReady(true);
      setSuccess("Data processed successfully! Ready for download.");
    } catch (error) {
      console.error("Error generating Excel file:", error);
      setError("Failed to generate Excel file. Please try again.");
      setExportReady(false);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for Excel export
  const prepareDataForExcel = (data) => {
    // Create separate worksheets for different data types
    const worksheets = {
      summary: [],
      nodeData: [],
      cellVoltages: [],
      temperatures: [],
      peakUsage: [],
    };

    // Summary worksheet
    worksheets.summary.push({
      "Report Type": "Battery Data Export",
      "Tag ID": selectedTagId,
      "Time Range": selectedTimeRange,
      "Generated Date": new Date().toLocaleString(),
      "Total Records": Object.keys(data.DataByHour || {}).reduce(
        (sum, date) => sum + Object.keys(data.DataByHour[date] || {}).length,
        0
      ),
    });

    // Node data worksheets
    if (data.Node0 && data.Node1) {
      // Cell voltages for Node0
      const node0Voltages = data.Node0.voltage?.cellVoltages || [];
      for (let cellIndex = 0; cellIndex < node0Voltages.length; cellIndex++) {
        const cellValues = node0Voltages[cellIndex];
        for (let timeIndex = 0; timeIndex < cellValues.length; timeIndex++) {
          if (!worksheets.cellVoltages[timeIndex]) {
            worksheets.cellVoltages[timeIndex] = {};
          }
          worksheets.cellVoltages[timeIndex][`Node0_Cell${cellIndex}`] =
            cellValues[timeIndex];
        }
      }

      // Cell voltages for Node1
      const node1Voltages = data.Node1.voltage?.cellVoltages || [];
      for (let cellIndex = 0; cellIndex < node1Voltages.length; cellIndex++) {
        const cellValues = node1Voltages[cellIndex];
        for (let timeIndex = 0; timeIndex < cellValues.length; timeIndex++) {
          if (!worksheets.cellVoltages[timeIndex]) {
            worksheets.cellVoltages[timeIndex] = {};
          }
          worksheets.cellVoltages[timeIndex][`Node1_Cell${cellIndex}`] =
            cellValues[timeIndex];
        }
      }

      // Temperature data
      if (data.Node0.temperature) {
        Object.entries(data.Node0.temperature).forEach(([sensor, values]) => {
          values.forEach((value, timeIndex) => {
            if (!worksheets.temperatures[timeIndex]) {
              worksheets.temperatures[timeIndex] = {};
            }
            worksheets.temperatures[timeIndex][sensor] = value;
          });
        });
      }

      if (data.Node1.temperature) {
        Object.entries(data.Node1.temperature).forEach(([sensor, values]) => {
          values.forEach((value, timeIndex) => {
            if (!worksheets.temperatures[timeIndex]) {
              worksheets.temperatures[timeIndex] = {};
            }
            worksheets.temperatures[timeIndex][sensor] = value;
          });
        });
      }
    }

    // Peak usage data
    if (data.PeakUsageHours) {
      Object.entries(data.PeakUsageHours).forEach(([date, peakData]) => {
        worksheets.peakUsage.push({
          Date: date,
          "Peak Current (A)": peakData.peakCurrent,
          "Peak Hour": peakData.peakHour,
        });
      });
    }

    // Hourly data
    if (data.DataByHour) {
      const hourlyData = [];
      Object.entries(data.DataByHour).forEach(([date, hours]) => {
        Object.entries(hours).forEach(([hour, hourData]) => {
          hourlyData.push({
            Date: date,
            Hour: hour,
            ...hourData.reduce((obj, item) => {
              if (item.TotalCurrent !== undefined)
                obj["TotalCurrent"] = item.TotalCurrent;
              return obj;
            }, {}),
          });
        });
      });
      worksheets.nodeData = hourlyData;
    }

    return worksheets;
  };

  // Function to download Excel file
  const downloadExcel = () => {
    if (!exportData) return;

    const workbook = XLSX.utils.book_new();

    // Add summary worksheet
    const summarySheet = XLSX.utils.json_to_sheet(exportData.summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Add node data worksheet
    if (exportData.nodeData.length > 0) {
      const nodeDataSheet = XLSX.utils.json_to_sheet(exportData.nodeData);
      XLSX.utils.book_append_sheet(workbook, nodeDataSheet, "Hourly Data");
    }

    // Add cell voltages worksheet
    if (exportData.cellVoltages.length > 0) {
      const cellVoltagesSheet = XLSX.utils.json_to_sheet(
        exportData.cellVoltages
      );
      XLSX.utils.book_append_sheet(
        workbook,
        cellVoltagesSheet,
        "Cell Voltages"
      );
    }

    // Add temperatures worksheet
    if (exportData.temperatures.length > 0) {
      const temperaturesSheet = XLSX.utils.json_to_sheet(
        exportData.temperatures
      );
      XLSX.utils.book_append_sheet(workbook, temperaturesSheet, "Temperatures");
    }

    // Add peak usage worksheet
    if (exportData.peakUsage.length > 0) {
      const peakUsageSheet = XLSX.utils.json_to_sheet(exportData.peakUsage);
      XLSX.utils.book_append_sheet(workbook, peakUsageSheet, "Peak Usage");
    }

    // Generate Excel file
    XLSX.writeFile(
      workbook,
      `BMS_Data_${selectedTagId}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <div
      style={{
        marginBottom: "30px",
        backgroundColor: darkMode ? "#34495e" : "#f9f9f9",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: darkMode
          ? "0 2px 10px rgba(0,0,0,0.2)"
          : "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          color: darkMode ? "#3498db" : "#1259c3",
          marginBottom: "15px",
        }}
      >
        Excel Data Export
      </h2>

      <p
        style={{
          fontSize: "0.9rem",
          color: darkMode ? "#bdc3c7" : "#757575",
          marginBottom: "20px",
        }}
      >
        Generate an Excel file with detailed battery data for analysis or
        reporting.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Generate Button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={generateExcel}
            style={{
              padding: "12px 30px",
              backgroundColor: darkMode ? "#3498db" : "#1259c3",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              boxShadow: darkMode
                ? "0 2px 8px rgba(52, 152, 219, 0.3)"
                : "0 2px 8px rgba(18, 89, 195, 0.3)",
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Processing Data..." : "Generate Excel File"}
          </button>
        </div>

        {/* Progress Indicator */}
        {loading && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: darkMode ? "#2c3e50" : "#e0e0e0",
                borderRadius: "4px",
                marginTop: "10px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  backgroundColor: darkMode ? "#2ecc71" : "#4CAF50",
                  width: `${Math.min(progress, 100)}%`,
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: darkMode ? "#bdc3c7" : "#757575",
                marginTop: "5px",
              }}
            >
              Fetching data batches...{" "}
              {progress > 0 ? `${progress} records processed` : ""}
            </p>
          </div>
        )}

        {/* Download Button (only shown when export is ready) */}
        {exportReady && (
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button
              onClick={downloadExcel}
              style={{
                padding: "12px 30px",
                backgroundColor: darkMode ? "#2ecc71" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
                boxShadow: darkMode
                  ? "0 2px 8px rgba(46, 204, 113, 0.3)"
                  : "0 2px 8px rgba(76, 175, 80, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Excel File
            </button>
          </div>
        )}

        {/* Success and Error Messages */}
        {success && (
          <div
            style={{
              backgroundColor: darkMode ? "rgba(46, 204, 113, 0.1)" : "#e8f5e9",
              color: darkMode ? "#2ecc71" : "#4CAF50",
              padding: "12px",
              borderRadius: "10px",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: darkMode ? "rgba(231, 76, 60, 0.1)" : "#ffebee",
              color: darkMode ? "#e74c3c" : "#F44336",
              padding: "12px",
              borderRadius: "10px",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelExportFeature;
