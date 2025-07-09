// DailyPowerSummaryTable.js
import React from "react";

const DailyPowerSummaryTable = ({ data }) => {
  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px",
      }}
    >
      <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
        Daily Power Summary
      </h3>
      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
              Date
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
              Total Power
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
              Positive Hours
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
              Average Power
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.dailyPowerSummary).map(([date, summary]) => (
            <tr key={date}>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}
              >
                {date}
              </td>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}
              >
                {summary.TotalPower.toFixed(2)} kWh
              </td>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}
              >
                {summary.PositiveHours}
              </td>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}
              >
                {summary.AveragePower.toFixed(2)} kW
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyPowerSummaryTable;
