import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";

const Gauges = ({ bmsState, roundValue }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState({});
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Strictly using only WeatherCard colors
  const colors = {
    primary: "#818181",
    secondary: "#c0c0c0",
    accentGreen: "#4CAF50",
    accentRed: "#F44336",
    background: "rgba(192, 192, 192, 0.1)",
    textDark: "#333333",
    textLight: "#555555",
    highlight: "#FFC107",
  };

  const gaugeColors = {
    // Your existing colors...
    gaugeDarkGray: "#333333",
    gaugeGray: "#666666",
    gaugeBlack: "#000000",
    // Keep your other colors...
  };

  // Track history of values
  useEffect(() => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    const newHistory = { ...history };
    const gauges = [
      { key: "MaxCellTemp", value: bmsState.MaxCellTemp?.N },
      { key: "MaximumCellVoltage", value: bmsState.MaximumCellVoltage?.N },
      { key: "MinCellTemp", value: bmsState.MinCellTemp?.N },
      { key: "MinimumCellVoltage", value: bmsState.MinimumCellVoltage?.N },
    ];

    gauges.forEach((gauge) => {
      if (gauge.value !== undefined) {
        if (!newHistory[gauge.key]) {
          newHistory[gauge.key] = [];
        }
        newHistory[gauge.key].push({
          value: gauge.value,
          timestamp,
          time: now.getTime(),
        });

        if (newHistory[gauge.key].length > 20) {
          newHistory[gauge.key].shift();
        }
      }
    });

    setHistory(newHistory);
  }, [bmsState]);

  const calculateColor = (value, max) => {
    return "#808080"; // Using primary gray for all other states
  };

  const gauges = [
    {
      title: "Max Cell Temp",
      key: "MaxCellTemp",
      value: roundValue(bmsState.MaxCellTemp?.N || 0),
      info: `Node: ${bmsState.MaxCellTempNode?.N || "N/A"}`,
      min: 0,
      max: 100,
      unit: "°C",
      status: (percentage) =>
        percentage >= 90 ? "Critical" : percentage >= 60 ? "Warning" : "Normal",
    },
    {
      title: "Max Cell Voltage",
      key: "MaximumCellVoltage",
      value: roundValue(bmsState.MaximumCellVoltage?.N || 0),
      info: `Cell: ${bmsState.MaximumCellVoltageCellNo?.N || "N/A"}, Node: ${
        bmsState.MaximumCellVoltageNode?.N || "N/A"
      }`,
      min: 0,
      max: 5,
      unit: "V",
      status: (percentage) =>
        percentage >= 90 ? "High" : percentage >= 60 ? "Elevated" : "Optimal",
    },
    {
      title: "Min Cell Temp",
      key: "MinCellTemp",
      value: roundValue(bmsState.MinCellTemp?.N || 0),
      info: `Node: ${bmsState.MinCellTempNode?.N || "N/A"}`,
      min: 0,
      max: 100,
      unit: "°C",
      status: (percentage) =>
        percentage >= 90 ? "Critical" : percentage >= 60 ? "Warning" : "Stable",
    },
    {
      title: "Min Cell Voltage",
      key: "MinimumCellVoltage",
      value: roundValue(bmsState.MinimumCellVoltage?.N || 0),
      info: `Cell: ${bmsState.MinimumCellVoltageCellNo?.N || "N/A"}, Node: ${
        bmsState.MinimumCellVoltageNode?.N || "N/A"
      }`,
      min: 0,
      max: 5,
      unit: "V",
      status: (percentage) =>
        percentage >= 90 ? "Low" : percentage >= 60 ? "Fair" : "Good",
    },
  ];

  const pages = [
    [gauges[0], gauges[1]],
    [gauges[2], gauges[3]],
  ];

  const currentCards = pages[currentPage];
  const totalPages = pages.length;

  const MiniChart = ({ data, min, max, color }) => {
    if (!data || data.length < 2) return null;

    const chartHeight = 40;
    const points = data
      .map((entry, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = ((max - entry.value) / (max - min)) * chartHeight;
        return `${x}% ${y}`;
      })
      .join(", ");

    return (
      <div
        style={{
          position: "relative",
          height: chartHeight,
          marginTop: "10px",
          opacity: 0.6,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1={chartHeight}
            x2="100%"
            y2={chartHeight}
            stroke={colors.secondary}
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke={colors.secondary}
            strokeWidth="0.5"
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {data.map((entry, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((max - entry.value) / (max - min)) * chartHeight;

            return (
              <React.Fragment key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={hoveredPoint?.index === i ? 3 : 0}
                  fill={color}
                  style={{ transition: "r 0.2s ease" }}
                />
                <rect
                  x={x - 5}
                  y={0}
                  width={10}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint({ index: i, entry })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </React.Fragment>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: `${(hoveredPoint.index / (data.length - 1)) * 100}%`,
              transform: "translateX(-50%)",
              background: colors.textDark,
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            {/* More robust fix */}
            {(() => {
              const value = hoveredPoint.entry.value;
              const numValue =
                typeof value === "number" ? value : parseFloat(value);
              return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
            })()}
            {gauges.find((g) => g.key === data.key)?.unit}
            <br />
            {hoveredPoint.entry.timestamp}
          </div>
        )}
      </div>
    );
  };

  const GaugeCard = ({ gauge }) => {
    const historyData = history[gauge.key] || [];
    const percentage = (gauge.value / gauge.max) * 100;
    const color = calculateColor(gauge.value, gauge.max);
    const statusText = gauge.status(percentage);

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "10px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: `1px solid ${colors.primary}`,
          margin: "0 5px",
          height: "100%",
          minHeight: "250px",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          ":hover": {
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          },
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            marginBottom: "12px",
            fontWeight: "700",
            color: colors.textDark,
            textAlign: "center",
            letterSpacing: "0.5px",
          }}
        >
          {gauge.title}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            position: "relative",
          }}
        >
          <div
            style={{ width: "100px", height: "100px", margin: "0 auto 10px" }}
          >
            <CircularProgressbar
              value={percentage}
              text={`${gauge.value}${gauge.unit}`}
              styles={buildStyles({
                textSize: "24px",
                pathColor: color,
                textColor: colors.textDark,
                trailColor: colors.background,
                pathTransitionDuration: 0.5,
              })}
            />
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              color: colors.textLight,
              marginBottom: "12px",
              padding: "8px 12px",
              background: colors.background,
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "500",
              border: `1px solid ${colors.secondary}`,
            }}
          >
            {gauge.info}
          </div>

          <div
            style={{
              padding: "6px 16px",
              backgroundColor: `${color}20`,
              color: color,
              borderRadius: "20px",
              fontWeight: "600",
              fontSize: "0.85rem",
              border: `1px solid ${color}50`,
            }}
          >
            {statusText}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "15px",
            right: "15px",
            height: "50px",
          }}
        >
          <MiniChart
            data={historyData}
            min={gauge.min}
            max={gauge.max}
            color={color}
            key={gauge.key}
          />
        </div>
      </div>
    );
  };

  const handleTouchStart = (e) => {
    const touchStartX = e.touches[0].clientX;
    const touchStartY = e.touches[0].clientY;

    const handleTouchMove = (e) => {
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && currentPage < totalPages - 1) {
          setCurrentPage(currentPage + 1);
        } else if (deltaX < 0 && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        }
        document.removeEventListener("touchmove", handleTouchMove);
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    const cleanUp = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", cleanUp);
    };
    document.addEventListener("touchend", cleanUp, { once: true });
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: colors.background,
        borderRadius: "12px",
        overflow: "hidden",
        padding: "5px",
        border: `1px solid ${colors.secondary}`,
      }}
      onTouchStart={handleTouchStart}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, padding: "10px", display: "flex" }}
        >
          {currentCards.map((gauge, index) => (
            <GaugeCard key={index} gauge={gauge} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div
        style={{ display: "flex", justifyContent: "center", padding: "10px" }}
      >
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background:
                index === currentPage ? colors.primary : colors.secondary,
              border: "none",
              margin: "0 5px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: index === currentPage ? "scale(1.2)" : "scale(1)",
            }}
            aria-label={`View page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Gauges;
