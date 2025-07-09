// HourlyAveragesBarChart.js
import React from "react";
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

const HourlyAveragesBarChart = ({ data }) => {
  const last24Hours = Object.entries(data.hourlyAverages).slice(-24);
  const combinedData = last24Hours.map(([_, hour]) => {
    const value = hour.TotalCurrent;
    return Math.abs(value) < 0.01
      ? { value: 0.1, color: "#000000" }
      : { value, color: value > 0 ? "#28a745" : "#dc3545" };
  });

  const chartData = {
    labels: last24Hours.map((_, index) => `-${24 - index} hr`),
    datasets: [
      {
        label: "Hourly Current",
        data: combinedData.map((d) => d.value),
        backgroundColor: combinedData.map((d) => d.color),
        borderColor: combinedData.map((d) => d.color),
        borderWidth: 1,
        categoryPercentage: 1.0,
        barPercentage: 0.9,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#e0e0e0" },
        ticks: {
          callback: function (value) {
            return value === 0.1 ? "" : value;
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: { autoSkip: false, maxRotation: 0 },
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const value = context.raw === 0.1 ? 0 : context.raw;
            return `Current: ${value.toFixed(2)}A`;
          },
        },
      },
      legend: { display: false },
    },
    maintainAspectRatio: false,
  };

  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        position: "relative",
        height: "400px",
      }}
    >
      <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
        Hourly Averages (Last 24 Hours)
      </h3>
      <div style={{ height: "350px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HourlyAveragesBarChart;
