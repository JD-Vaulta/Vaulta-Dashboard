import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";

const PackControllerGauges = ({ 
  packControllerState = {}, 
  roundValue = (v) => Math.round(v), 
  colors = {
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
  }, 
  isMobile = false 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState({});

  // Helper function to safely get values
  const getValue = (key, defaultValue = 0) => {
    return packControllerState?.[key]?.N || packControllerState?.[key] || defaultValue;
  };

  // Track history of values
  useEffect(() => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    const newHistory = { ...history };
    const gauges = [
      { key: "SOCPercent", value: getValue("SOCPercent") },
      { key: "SystemTemp", value: getValue("SystemTemp") },
      { key: "TotalVoltage", value: getValue("TotalVoltage") },
      { key: "TotalCurrent", value: getValue("TotalCurrent") },
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
  }, [packControllerState]);

  const calculateColor = (value, max, min = 0, type) => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    if (type === "temp" && percentage > 80) return colors.error;
    if (type === "voltage" && (percentage > 95 || percentage < 5)) return colors.warning;
    if (type === "current" && Math.abs(value) > max * 0.9) return colors.warning;
    if (type === "soc" && percentage < 20) return colors.error;
    if (type === "soc" && percentage < 50) return colors.warning;
    
    return "#70ab5c"; // Green color for normal values
  };

  const gauges = [
    {
      title: "State of Charge",
      key: "SOCPercent",
      value: roundValue(getValue("SOCPercent")),
      info: `${roundValue(getValue("SystemSoc"))}% System`,
      min: 0,
      max: 100,
      unit: "%",
      type: "soc",
      status: (percentage) =>
        percentage >= 80 ? "Excellent" : percentage >= 50 ? "Good" : percentage >= 20 ? "Low" : "Critical",
    },
    {
      title: "System Temperature",
      key: "SystemTemp",
      value: roundValue(getValue("SystemTemp")),
      info: `Normal Range`,
      min: -10,
      max: 60,
      unit: "°C",
      type: "temp",
      status: (percentage) =>
        percentage >= 90 ? "Critical" : percentage >= 70 ? "High" : percentage >= 30 ? "Normal" : "Low",
    },
    {
      title: "Total Voltage",
      key: "TotalVoltage",
      value: roundValue(getValue("TotalVoltage")),
      info: `Range: ${getValue("SystemMinVoltage", 0)}-${getValue("SystemMaxVoltage", 100)}V`,
      min: getValue("SystemMinVoltage", 0),
      max: getValue("SystemMaxVoltage", 100),
      unit: "V",
      type: "voltage",
      status: (percentage) =>
        percentage >= 95 ? "High" : percentage >= 80 ? "Normal" : percentage >= 5 ? "Low" : "Critical",
    },
    {
      title: "Total Current",
      key: "TotalCurrent",
      value: roundValue(getValue("TotalCurrent")),
      info: `Max: ±${getValue("SystemChargeCurrent", 144)}A`,
      min: -getValue("SystemDischargeCurrent", 144),
      max: getValue("SystemChargeCurrent", 144),
      unit: "A",
      type: "current",
      status: (percentage) => {
        const absValue = Math.abs(getValue("TotalCurrent"));
        const maxCurrent = getValue("SystemChargeCurrent", 144);
        if (absValue >= maxCurrent * 0.9) return "High";
        if (absValue >= maxCurrent * 0.7) return "Medium";
        return "Normal";
      },
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
    const color = calculateColor(gauge.value, gauge.max, gauge.min, gauge.type);
    const statusText = gauge.status(percentage);

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
              value={Math.max(0, Math.min(100, percentage))}
              text={`${gauge.value}${gauge.unit}`}
              strokeWidth={18}
              styles={buildStyles({
                textSize: isMobile ? "20px" : "18px",
                pathColor: color,
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
              backgroundColor: `${color}15`,
              color: color,
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
            color={color}
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

export default PackControllerGauges;