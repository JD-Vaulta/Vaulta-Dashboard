import React from "react";
import { motion } from "framer-motion";

const DailySummary = ({ data }) => {
  if (data.dailySummaries.length === 0) {
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
              <th style={{ padding: "12px", textAlign: "left" }}>Avg Power</th>
            </tr>
          </thead>
          <tbody>
            {data.dailySummaries.map((summary) => (
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

export default DailySummary;
