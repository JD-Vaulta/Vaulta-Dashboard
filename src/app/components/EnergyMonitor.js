import React, { useState, useEffect } from "react";
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
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Page5 = ({ bmsData, lambdaResponse }) => {
  const [activeSection, setActiveSection] = useState("keyInsights");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have both required data sources
    const hasBmsData = bmsData?.lastMinuteData?.length > 0;
    const hasLambdaData =
      lambdaResponse && Object.keys(lambdaResponse).length > 0;

    setLoading(!(hasBmsData && hasLambdaData));
  }, [lambdaResponse, bmsData]);

  // Helper functions for data processing
  const getLatestHourData = () => {
    if (!lambdaResponse?.hourlyPower) return null;
    const hourlyEntries = Object.entries(lambdaResponse.hourlyPower);
    return hourlyEntries.length > 0
      ? {
          timestamp: hourlyEntries[hourlyEntries.length - 1][0],
          ...hourlyEntries[hourlyEntries.length - 1][1],
        }
      : null;
  };

  const getLast24Hours = () => {
    if (!lambdaResponse?.hourlyAverages) return [];

    return Object.entries(lambdaResponse.hourlyAverages)
      .map(([timestamp, data]) => ({
        timestamp,
        TotalCurrent: data.TotalCurrent || "N/A",
        Power: data.Power || 0,
        TotalBattVoltage: data.TotalBattVoltage || "N/A",
        TotalLoadVoltage: data.TotalLoadVoltage || "N/A",
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-24);
  };

  const getAllDailySummaries = () => {
    if (
      !lambdaResponse?.dailyPowerSummary ||
      Object.keys(lambdaResponse.dailyPowerSummary).length === 0
    ) {
      return [];
    }

    return Object.entries(lambdaResponse.dailyPowerSummary)
      .map(([date, summary]) => ({
        date,
        TotalPower: summary.TotalPower || 0,
        AveragePower: summary.AveragePower || 0,
        PositiveHours: summary.PositiveHours || 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Card component
  const CardItem = ({ label, value, icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #e6e6e6",
        borderRadius: "15px",
        padding: "15px",
        margin: "10px 0",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {icon && (
        <div style={{ marginRight: "15px", color: color, fontSize: "24px" }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ color: "#757575", fontSize: "14px" }}>{label}</div>
        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#000000" }}>
          {value}
        </div>
      </div>
    </motion.div>
  );

  // Key Insights Component
  const KeyInsightsCard = () => {
    const latestHour = getLatestHourData();
    const last24Hours = getLast24Hours();
    const dailySummaries = getAllDailySummaries();
    const latestDailySummary =
      dailySummaries.length > 0
        ? dailySummaries[dailySummaries.length - 1]
        : null;
    const chargingHours = lambdaResponse?.chargingHours || [];

    console.log("KeyInsights data:", {
      latestHour,
      last24Hours,
      dailySummaries,
      latestDailySummary,
      chargingHours,
    });

    if (!latestHour || !last24Hours.length) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No energy data available yet
        </div>
      );
    }

    // Calculate metrics with proper fallbacks
    const metrics = {
      totalPowerConsumed: latestDailySummary
        ? `${latestDailySummary.TotalPower?.toFixed(2)} Wh`
        : "N/A",
      avgPowerConsumption: latestDailySummary
        ? `${latestDailySummary.AveragePower?.toFixed(2)} W`
        : "N/A",
      positiveHours: latestDailySummary
        ? `${latestDailySummary.PositiveHours} hrs`
        : "N/A",
      peakPowerConsumption: `${Math.max(
        ...last24Hours.map((h) => h.TotalCurrent)
      ).toFixed(2)} A`,
      peakChargingPower: `${Math.min(
        ...last24Hours.map((h) => h.TotalCurrent)
      ).toFixed(2)} A`,
      currentPowerStatus: latestHour.Power > 0 ? "Consuming" : "Charging",
      systemHealth: `${parseFloat(
        bmsData?.lastMinuteData?.[0]?.SOCPercent?.N || 0
      ).toFixed(2)}%`,
    };

    const cardSections = [
      {
        title: "Daily Power Summary",
        items: [
          {
            label: "Total Power",
            value: metrics.totalPowerConsumed,
            icon: "⚡",
            color: "#1259c3",
          },
          {
            label: "Avg Power",
            value: metrics.avgPowerConsumption,
            icon: "📊",
            color: "#4CAF50",
          },
          {
            label: "Active Hours",
            value: metrics.positiveHours,
            icon: "⏱️",
            color: "#FF9800",
          },
        ],
      },
      {
        title: "Power Insights",
        items: [
          {
            label: "Peak Consumption",
            value: metrics.peakPowerConsumption,
            icon: "📈",
            color: "#F44336",
          },
          {
            label: "Peak Charging",
            value: metrics.peakChargingPower,
            icon: "🔋",
            color: "#1259c3",
          },
          {
            label: "Current Status",
            value: metrics.currentPowerStatus,
            icon: metrics.currentPowerStatus === "Consuming" ? "🔌" : "🔋",
            color:
              metrics.currentPowerStatus === "Consuming"
                ? "#FF9800"
                : "#4CAF50",
          },
        ],
      },
      {
        title: "System Health",
        items: [
          {
            label: "State of Charge",
            value: metrics.systemHealth,
            icon: "📉",
            color: "#F44336",
          },
        ],
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {cardSections.map((section, index) => (
          <div
            key={index}
            style={{
              background: "#fff",
              borderRadius: "15px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontWeight: "600",
                marginBottom: "15px",
                color: "#1259c3",
              }}
            >
              {section.title}
            </h3>
            {section.items.map((item, i) => (
              <CardItem
                key={i}
                label={item.label}
                value={item.value}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </div>
        ))}
      </motion.div>
    );
  };

  // Hourly Averages Chart Component
  const HourlyAveragesChart = () => {
    const last24Hours = getLast24Hours();

    const chartData = {
      labels: last24Hours.map((_, i) => `${i}:00`),
      datasets: [
        {
          label: "Current (A)",
          data: last24Hours.map((h) => h.TotalCurrent),
          backgroundColor: last24Hours.map((h) =>
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

  // Daily Summary Table Component
  const DailySummaryTable = () => {
    const dailySummaries = getAllDailySummaries();

    console.log("Daily summaries:", dailySummaries);

    if (dailySummaries.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No daily summary data available
        </div>
      );
    }

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
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#1259c3" }}>
          Daily Power Summary
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  Total Power
                </th>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  Active Hours
                </th>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  Avg Power
                </th>
              </tr>
            </thead>
            <tbody>
              {dailySummaries.map((summary) => (
                <tr key={summary.date}>
                  <td style={{ padding: "12px" }}>{summary.date}</td>
                  <td style={{ padding: "12px" }}>
                    {summary.TotalPower?.toFixed(2)} Wh
                  </td>
                  <td style={{ padding: "12px" }}>{summary.PositiveHours}</td>
                  <td style={{ padding: "12px" }}>
                    {summary.AveragePower?.toFixed(2)} W
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <LoadingSpinner />
        <h2 style={{ marginTop: "20px", color: "#1259c3" }}>
          Loading energy data...
        </h2>
      </div>
    </div>
  );

  // Main content when data is loaded
  const renderContent = () => {
    switch (activeSection) {
      case "keyInsights":
        return <KeyInsightsCard />;
      case "hourlyAverages":
        return <HourlyAveragesChart />;
      case "dailySummary":
        return <DailySummaryTable />;
      default:
        return <KeyInsightsCard />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      {loading ? (
        <LoadingScreen />
      ) : (
        <div style={{ padding: "20px" }}>
          {/* Section Navigation */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            {["keyInsights", "hourlyAverages", "dailySummary"].map(
              (section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  style={{
                    padding: "10px 15px",
                    backgroundColor:
                      activeSection === section ? "#4CAF50" : "#f5f5f5",
                    color: activeSection === section ? "white" : "#333",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {section === "keyInsights" && "Key Insights"}
                  {section === "hourlyAverages" && "Hourly Trends"}
                  {section === "dailySummary" && "Daily Summary"}
                </button>
              )
            )}
          </div>

          {/* Main Content */}
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default Page5;
