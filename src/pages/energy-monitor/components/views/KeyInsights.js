import React from "react";
import { motion } from "framer-motion";
import CardItem from "../widgets/CardItem.js";
import { getKeyInsightMetrics } from "../../utils/energyHelpers.js";

const KeyInsights = ({ data, bmsData, lambdaResponse }) => {
  const metrics = getKeyInsightMetrics(data, bmsData, lambdaResponse);

  // Check if we have any meaningful data
  const hasData = data.last24Hours.length > 0 || data.dailySummaries.length > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📊</div>
        <h3 style={{ color: "#666", marginBottom: "15px" }}>
          No Energy Data Available
        </h3>
        <p style={{ color: "#888", marginBottom: "20px" }}>
          There is no energy consumption data available for the selected
          battery. This could be because:
        </p>
        <ul
          style={{
            textAlign: "left",
            color: "#666",
            lineHeight: "1.6",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <li>The battery hasn't been active in the last 7 days</li>
          <li>Energy data collection hasn't started for this battery</li>
          <li>The Lambda function needs to be triggered to collect data</li>
          <li>
            The battery ID format doesn't match the data collection system
          </li>
        </ul>
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "0.9rem",
              fontStyle: "italic",
            }}
          >
            💡 Tip: Try selecting a different battery or check if the data
            collection service is running properly.
          </p>
        </div>
      </motion.div>
    );
  }

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
            metrics.currentPowerStatus === "Consuming" ? "#FF9800" : "#4CAF50",
        },
      ],
    },
    {
      title: "System Health",
      items: [
        {
          label: "State of Charge",
          value: metrics.systemHealth,
          icon: "📋",
          color: "#1259c3",
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

export default KeyInsights;
