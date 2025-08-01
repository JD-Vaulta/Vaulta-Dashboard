import React from "react";
import { motion } from "framer-motion";
import CardItem from "../widgets/CardItem.js";
import { getKeyInsightMetrics } from "../../utils/energyHelpers.js";

const KeyInsights = ({ data, bmsData, lambdaResponse }) => {
  // Use content signature instead of timestamp for keys - only changes when actual data changes
  const dataKey = data?._contentSignature || "no-data";

  console.log(
    "KeyInsights: Rendering with dataKey:",
    dataKey.substring(0, 50) + "...",
    "data:",
    {
      last24HoursCount: data?.last24Hours?.length || 0,
      dailySummariesCount: data?.dailySummaries?.length || 0,
      contentSignature: data?._contentSignature?.substring(0, 100) + "...",
    }
  );

  // Check if we have any meaningful data
  const hasData = data.last24Hours.length > 0 || data.dailySummaries.length > 0;

  if (!hasData) {
    return (
      <motion.div
        key={`no-data-${dataKey}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          textAlign: "center",
          margin: "10px",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📊</div>
        <h3 style={{ color: "#666", marginBottom: "15px" }}>
          No Energy Data Available
        </h3>
        <p style={{ color: "#888", marginBottom: "20px", lineHeight: "1.6" }}>
          There is no energy consumption data available for the selected
          battery. This could be because:
        </p>
        <ul
          style={{
            textAlign: "left",
            color: "#666",
            lineHeight: "1.6",
            maxWidth: "500px",
            margin: "0 auto 20px",
            paddingLeft: "20px",
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
            fontSize: "14px",
          }}
        >
          <p style={{ margin: 0, color: "#666", fontStyle: "italic" }}>
            💡 Tip: Try refreshing the page or check if the data collection
            service is running properly.
          </p>
        </div>
      </motion.div>
    );
  }

  // Calculate metrics directly - this will recalculate when data content changes
  console.log(
    "KeyInsights: Calculating metrics for dataKey:",
    dataKey.substring(0, 50) + "..."
  );
  const metrics = getKeyInsightMetrics(data, bmsData, lambdaResponse);
  console.log("KeyInsights: Calculated metrics:", {
    totalPowerConsumed: metrics.totalPowerConsumed,
    avgPowerConsumption: metrics.avgPowerConsumption,
    peakPowerConsumption: metrics.peakPowerConsumption,
    currentPowerStatus: metrics.currentPowerStatus,
  });

  // Define card sections directly
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
    <div style={{ margin: "10px" }}>
      <motion.div
        key={`insights-${dataKey}`} // Only changes when actual content changes
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {cardSections.map((section, index) => (
          <div
            key={`section-${index}`} // Keep section key stable
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
                fontSize: "18px",
              }}
            >
              {section.title}
            </h3>
            {section.items.map((item, i) => (
              <CardItem
                key={`${item.label}-${dataKey}`} // Only value changes trigger re-render
                label={item.label}
                value={item.value}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default KeyInsights;
