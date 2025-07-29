import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";

const Gauges = ({ bmsState = {}, roundValue = (v) => Math.round(v), colors = {
  primary: "#007BFF",
  success: "#28A745",
  warning: "#FFC107",
  error: "#DC3545",
  accent: "#17A2B8",
  white: "#FFFFFF",
  lightGrey: "#E9ECEF",
  textDark: "#343A40",
  textLight: "#6C757D",
  background: "#F8F9FA"
}, isMobile = false }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState({});

  // Status and color calculation functions
  const getTempStatus = (temp) => {
    if (temp >= 50) return "Critical";
    if (temp >= 40) return "Warning";
    return "Normal";
  };

  const getVoltageStatus = (voltage) => {
    if (voltage >= 3.65) return "High";
    if (voltage >= 3.45) return "Elevated";
    if (voltage <= 2.8) return "Low";
    return "Optimal";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Critical":
      case "High":
      case "Low":
        return colors.error;
      case "Warning":
      case "Elevated":
      case "Fair":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  // Track history of values
  useEffect(() => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    const newHistory = { ...history };
    const gaugeKeys = [
      { key: "MaxCellTemp", value: bmsState.MaxCellTemp?.N },
      { key: "MaximumCellVoltage", value: bmsState.MaximumCellVoltage?.N },
      { key: "MinCellTemp", value: bmsState.MinCellTemp?.N },
      { key: "MinimumCellVoltage", value: bmsState.MinimumCellVoltage?.N },
    ];

    gaugeKeys.forEach((gauge) => {
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

  const gauges = [
    {
      title: "Max Cell Temp",
      key: "MaxCellTemp",
      value: roundValue(bmsState.MaxCellTemp?.N || 0),
      info: `Node: ${bmsState.MaxCellTempNode?.N || "N/A"}`,
      min: 0,
      max: 60,
      unit: "°C",
      type: "temp",
      getStatus: () => getTempStatus(bmsState.MaxCellTemp?.N || 0),
    },
    {
      title: "Max Cell Voltage",
      key: "MaximumCellVoltage",
      value: roundValue(bmsState.MaximumCellVoltage?.N || 0),
      info: `Cell: ${bmsState.MaximumCellVoltageCellNo?.N || "N/A"}, Node: ${
        bmsState.MaximumCellVoltageNode?.N || "N/A"
      }`,
      min: 2,
      max: 3.8,
      unit: "V",
      type: "voltage",
      getStatus: () => getVoltageStatus(bmsState.MaximumCellVoltage?.N || 0),
    },
    {
      title: "Min Cell Temp",
      key: "MinCellTemp",
      value: roundValue(bmsState.MinCellTemp?.N || 0),
      info: `Node: ${bmsState.MinCellTempNode?.N || "N/A"}`,
      min: 0,
      max: 60,
      unit: "°C",
      type: "temp",
      getStatus: () => getTempStatus(bmsState.MinCellTemp?.N || 0),
    },
    {
      title: "Min Cell Voltage",
      key: "MinimumCellVoltage",
      value: roundValue(bmsState.MinimumCellVoltage?.N || 0),
      info: `Cell: ${bmsState.MinimumCellVoltageCellNo?.N || "N/A"}, Node: ${
        bmsState.MinimumCellVoltageNode?.N || "N/A"
      }`,
      min: 2,
      max: 3.8,
      unit: "V",
      type: "voltage",
      getStatus: () => getVoltageStatus(bmsState.MinimumCellVoltage?.N || 0),
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
          marginTop: "8px",
          opacity: 0.6,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  const GaugeCard = ({ gauge }) => {
    const historyData = history[gauge.key] || [];
    const percentage = ((gauge.value - gauge.min) / (gauge.max - gauge.min)) * 100;
    const statusText = gauge.getStatus();
    const statusColor = getStatusColor(statusText);

    const getResponsiveValue = (min, max, unit = 'px') => {
      return `clamp(${min}${unit}, ${(min + max) / 2}vw, ${max}${unit})`;
    };

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: getResponsiveValue(8, 12),
          backgroundColor: colors.white,
          borderRadius: "6px",
          border: `1px solid ${colors.lightGrey}`,
          margin: "0 4px",
          height: "100%",
          maxHeight: "350px",
          position: "relative",
          transition: "all 0.2s ease",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "11px" : getResponsiveValue(12, 14),
            marginBottom: "8px",
            fontWeight: "600",
            color: colors.textDark,
            textAlign: "center",
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
          }}
        >
          <div
            style={{ 
              width: isMobile ? "70px" : getResponsiveValue(80, 100), 
              height: isMobile ? "70px" : getResponsiveValue(80, 100), 
              margin: "0 auto 8px" 
            }}
          >
            <CircularProgressbar
              value={percentage}
              text={`${gauge.value}${gauge.unit}`}
              strokeWidth={18}
              styles={buildStyles({
                textSize: isMobile ? "20px" : "18px",
                pathColor: "#70ab5c",
                textColor: colors.textDark,
                trailColor: colors.white,
                pathTransitionDuration: 0.5,
                strokeLinecap: 'butt',
                text: {
                  fontWeight: 'bold',
                  dominantBaseline: 'middle',
                  textAnchor: 'middle',
                },
              })}
            />
          </div>

          <div
            style={{
              fontSize: isMobile ? "9px" : getResponsiveValue(10, 12),
              color: colors.textLight,
              marginBottom: "6px",
              padding: "4px 8px",
              background: colors.background,
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "500",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {gauge.info}
          </div>

          <div
            style={{
              padding: "2px 8px",
              backgroundColor: `${statusColor}15`,
              color: statusColor,
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: isMobile ? "9px" : getResponsiveValue(10, 11),
              whiteSpace: "nowrap",
            }}
          >
            {statusText}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "8px",
            right: "8px",
            height: "30px",
          }}
        >
          <MiniChart
            data={historyData}
            min={gauge.min}
            max={gauge.max}
            color="#70ab5c"
            key={gauge.key}
          />
        </div>
      </div>
    );
  };

  const handleTouchStart = (e) => {
    const touchStartX = e.touches[0].clientX;

    const handleTouchMove = (e) => {
      const touchEndX = e.touches[0].clientX;
      const deltaX = touchStartX - touchEndX;

      if (Math.abs(deltaX) > 50) {
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
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "8px",
        overflow: "hidden",
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
          style={{ 
            flex: 1, 
            display: "flex",
            gap: "8px",
            minHeight: 0,
            maxHeight: "100%",
            overflow: "hidden",
          }}
        >
          {currentCards.map((gauge, index) => (
            <GaugeCard key={index} gauge={gauge} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div
        style={{ 
          display: "flex", 
          justifyContent: "center", 
          padding: "8px 12px",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                index === currentPage ? colors.primary : colors.lightGrey,
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: index === currentPage ? "scale(1.5)" : "scale(1)",
              padding: 0,
            }}
            aria-label={`View page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Gauges;