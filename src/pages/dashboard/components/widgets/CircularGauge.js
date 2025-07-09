import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const CircularGauge = ({
  title,
  description,
  value,
  min,
  max,
  unit,
  percentageChange,
}) => {
  // Calculate percentage for visualization
  const percentage = ((value - min) / (max - min)) * 100;

  // Dynamic colors for percentage - using OneUI colors
  const gaugeColor =
    percentage > 70 ? "#4CAF50" : percentage > 40 ? "#FF9800" : "#F44336";

  return (
    <div
      style={{
        width: "300px", // Fixed width for consistency
        height: "510px", // Fixed height for consistency
        border: "1px solid #e6e6e6", // Light border
        borderRadius: "15px", // Rounded corners for OneUI
        padding: "20px",
        background: "#fff", // White background
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)", // OneUI shadow
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}
    >
      {/* Title */}
      <h3
        style={{
          fontSize: "2rem",
          fontWeight: "600",
          color: "#1259c3", // OneUI blue
          textAlign: "center",
          marginBottom: "1px",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: "1.1rem",
            color: "#757575", // Gray text
            textAlign: "center",
            marginBottom: "15px",
          }}
        >
          {description}
        </p>
      )}

      {/* Min Value */}
      <div
        style={{
          fontSize: "1.1rem",
          color: "#757575", // Gray text
          textAlign: "center",
        }}
        title="Minimum Value"
      >
        Min: {min} {unit} {/* Display min value with unit */}
      </div>

      {/* Circular Progress Bar */}
      <div
        style={{
          width: "200px", // Fixed width for the progress bar container
          height: "200px", // Fixed height for the progress bar container
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto 10px", // Center the progress bar
        }}
      >
        <CircularProgressbar
          value={percentage}
          text={`${value} ${unit}`} // Display actual value and unit
          styles={buildStyles({
            pathColor: gaugeColor, // Dynamic color based on percentage
            textColor: "#1259c3", // OneUI blue
            textSize: "16px", // Adjusted text size
            trailColor: "#f2f2f2", // OneUI light background
          })}
        />
      </div>

      {/* Delta (Percentage Change) */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#1259c3", // OneUI blue
          }}
        >
          Change
        </div>
        <div
          style={{
            fontSize: "1.1rem",
            color: percentageChange > 0 ? "#4CAF50" : "#F44336", // Green or Red
            fontWeight: "500",
          }}
          title="Percentage Change"
        >
          {percentageChange > 0 ? (
            <>
              <FaArrowUp style={{ color: "#4CAF50" }} />{" "}
              {percentageChange.toFixed(2)}%
            </>
          ) : (
            <>
              <FaArrowDown style={{ color: "#F44336" }} />{" "}
              {Math.abs(percentageChange).toFixed(2)}%
            </>
          )}
        </div>
      </div>

      {/* Max Value */}
      <div
        style={{
          fontSize: "0.9rem",
          color: "#757575", // Gray text
          textAlign: "center",
        }}
        title="Maximum Value"
      >
        Max: {max} {unit} {/* Display max value with unit */}
      </div>
    </div>
  );
};

export default CircularGauge;
