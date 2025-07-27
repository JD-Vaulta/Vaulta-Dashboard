import React from "react";
import { motion } from "framer-motion";

const DailySummary = ({ data }) => {
  if (!data.dailySummaries || data.dailySummaries.length === 0) {
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
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📅</div>
        <h3 style={{ color: "#666", marginBottom: "15px" }}>
          No Daily Summary Data Available
        </h3>
        <p style={{ color: "#888", maxWidth: "500px", margin: "0 auto" }}>
          There are no daily power summaries available for the selected battery.
          Daily summaries are generated from hourly energy consumption data over
          the past 7 days.
        </p>
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            maxWidth: "400px",
            margin: "25px auto 0",
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
            💡 Daily summaries require at least one hour of positive power
            consumption data per day to be generated.
          </p>
        </div>
      </motion.div>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0, color: "#1259c3" }}>Daily Power Summary</h3>
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
          {data.dailySummaries.length} day
          {data.dailySummaries.length !== 1 ? "s" : ""} of data
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #dee2e6",
              }}
            >
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#495057",
                }}
              >
                Date
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#495057",
                }}
              >
                Total Power
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#495057",
                }}
              >
                Active Hours
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#495057",
                }}
              >
                Avg Power
              </th>
            </tr>
          </thead>
          <tbody>
            {data.dailySummaries.map((summary, index) => (
              <tr
                key={summary.date}
                style={{
                  borderBottom:
                    index < data.dailySummaries.length - 1
                      ? "1px solid #dee2e6"
                      : "none",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.parentElement.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.target.parentElement.style.backgroundColor = "transparent")
                }
              >
                <td
                  style={{
                    padding: "12px",
                    fontWeight: "500",
                    color: "#212529",
                  }}
                >
                  {new Date(summary.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    color: "#0d6efd",
                    fontWeight: "500",
                  }}
                >
                  {summary.TotalPower?.toFixed(1)} Wh
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    color: "#198754",
                  }}
                >
                  {summary.PositiveHours}h
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    color: "#fd7e14",
                    fontWeight: "500",
                  }}
                >
                  {summary.AveragePower?.toFixed(1)} W
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div
        style={{
          marginTop: "15px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.85rem",
        }}
      >
        <div>
          <strong>Total Period: </strong>
          <span style={{ color: "#0d6efd" }}>
            {data.dailySummaries
              .reduce((sum, day) => sum + (day.TotalPower || 0), 0)
              .toFixed(1)}{" "}
            Wh
          </span>
        </div>
        <div>
          <strong>Avg Daily: </strong>
          <span style={{ color: "#fd7e14" }}>
            {(
              data.dailySummaries.reduce(
                (sum, day) => sum + (day.AveragePower || 0),
                0
              ) / data.dailySummaries.length
            ).toFixed(1)}{" "}
            W
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default DailySummary;
