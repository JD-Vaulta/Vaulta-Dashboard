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
  const chartData = {
    labels: data.last24Hours.map((_, i) => `${i}:00`),
    datasets: [
      {
        label: "Current (A)",
        data: data.last24Hours.map((h) => h.TotalCurrent),
        backgroundColor: data.last24Hours.map((h) =>
          h.TotalCurrent > 0 ? "#4CAF50" : "#F44336"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        marginBottom: "20px",
        height: "400px",
      }}
    >
      <h3 style={{ marginBottom: "15px", color: "#1259c3" }}>
        Hourly Current (Last 24 Hours)
      </h3>
      <div style={{ height: "350px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </motion.div>
  );
};

export default HourlyChart;
