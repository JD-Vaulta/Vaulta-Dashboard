import React from "react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HourlyChart = ({ data }) => {
  // Use content signature instead of timestamp - only changes when actual data changes
  const dataKey = data?._contentSignature || "no-data";

  console.log(
    "HourlyChart: Rendering with dataKey:",
    dataKey.substring(0, 50) + "...",
    "data:",
    {
      last24HoursCount: data?.last24Hours?.length || 0,
      contentSignature: data?._contentSignature?.substring(0, 100) + "...",
    }
  );

  if (!data.last24Hours || data.last24Hours.length === 0) {
    return (
      <motion.div
        key={`no-hourly-data-${dataKey}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          margin: "10px",
          textAlign: "center",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📈</div>
        <h3 style={{ color: "#666", marginBottom: "15px" }}>
          No Hourly Data Available
        </h3>
        <p style={{ color: "#888", maxWidth: "400px", lineHeight: "1.6" }}>
          There is no hourly current data available for the selected battery in
          the last 24 hours. Please check if the data collection is working
          properly or try selecting a different battery.
        </p>
      </motion.div>
    );
  }

  // Create chart data directly - will recalculate when actual data changes
  console.log(
    "HourlyChart: Creating chart data for",
    data.last24Hours.length,
    "hours"
  );
  console.log(
    "HourlyChart: Sample data values:",
    data.last24Hours.slice(0, 3).map((h) => h.TotalCurrent)
  );

  // Fill missing hours with 0 values to show a complete 24-hour view
  const completeHourlyData = Array.from({ length: 24 }, (_, i) => {
    const existingData = data.last24Hours.find((h, index) => index === i);
    return existingData ? existingData.TotalCurrent : 0;
  });

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Current (A)",
        data: completeHourlyData,
        backgroundColor: completeHourlyData.map((current) =>
          current > 0 ? "#4CAF50" : current < 0 ? "#F44336" : "#E0E0E0"
        ),
        borderWidth: 1,
        borderColor: completeHourlyData.map((current) =>
          current > 0 ? "#388E3C" : current < 0 ? "#D32F2F" : "#BDBDBD"
        ),
      },
    ],
  };

  // Define options directly
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          generateLabels: function (chart) {
            return [
              {
                text: "Discharging (Positive)",
                fillStyle: "#4CAF50",
                strokeStyle: "#388E3C",
                lineWidth: 1,
              },
              {
                text: "Charging (Negative)",
                fillStyle: "#F44336",
                strokeStyle: "#D32F2F",
                lineWidth: 1,
              },
              {
                text: "No Data",
                fillStyle: "#E0E0E0",
                strokeStyle: "#BDBDBD",
                lineWidth: 1,
              },
            ];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            if (value === 0) return "No data";
            return `Current: ${value.toFixed(2)} A ${
              value > 0 ? "(Discharging)" : "(Charging)"
            }`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Current (A)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Hour of Day",
        },
      },
    },
  };

  return (
    <motion.div
      key={`hourly-chart-${dataKey}`} // Only changes when actual data content changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        margin: "10px",
        minHeight: "500px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0, color: "#1259c3", fontSize: "20px" }}>
          Hourly Current (Last 24 Hours)
        </h3>
        <div
          style={{
            backgroundColor: "#e3f2fd",
            color: "#1565c0",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: "500",
          }}
        >
          {data.last24Hours.length} hours of data
        </div>
      </div>

      <div style={{ height: "400px" }}>
        <Bar
          key={dataKey} // Force chart re-render only when data content changes
          data={chartData}
          options={options}
        />
      </div>

      <div
        style={{
          marginTop: "15px",
          fontSize: "0.85rem",
          color: "#666",
          textAlign: "center",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        📊 Showing {data.last24Hours.length} hours of data out of 24 hours
      </div>
    </motion.div>
  );
};

export default HourlyChart;
