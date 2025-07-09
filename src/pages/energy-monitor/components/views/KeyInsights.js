import React from "react";
import { motion } from "framer-motion";
import CardItem from "../widgets/CardItem.js";
import { getKeyInsightMetrics } from "../../utils/energyHelpers.js";

const KeyInsights = ({ data, bmsData, lambdaResponse }) => {
  const metrics = getKeyInsightMetrics(data, bmsData, lambdaResponse);

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

export default KeyInsights;
