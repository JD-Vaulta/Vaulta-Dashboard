// Updated MainView.js with improved responsiveness and professional design
import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Import widgets
import StatusCards from "../widgets/StatusCards.js";
import GaugePanel from "../widgets/GaugePanel.js";
import BatteryMetrics from "../widgets/BatteryMetrics.js";
import WeatherCard from "../widgets/WeatherCard.js";

const MainView = ({ bmsState, roundValue, colors, RefreshButton }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  // Calculate responsive font sizes and spacing
  const getResponsiveValue = (min, max, unit = 'px') => {
    return `clamp(${min}${unit}, ${(min + max) / 2}vw, ${max}${unit})`;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isTablet ? "1fr" : "minmax(280px, 350px) 1fr",
        gridTemplateRows: isTablet ? "auto auto" : "1fr",
        gap: getResponsiveValue(8, 16),
        height: "100%",
        maxHeight: "calc(100vh - 100px)",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left Section - Battery Status and Performance */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: getResponsiveValue(8, 16),
          minHeight: 0,
          maxHeight: isTablet ? "auto" : "100%",
          overflow: "hidden",
        }}
      >
        {/* Battery Status Section */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            padding: getResponsiveValue(12, 16),
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "0 0 auto",
            height: isTablet ? "auto" : "45%",
            maxHeight: isTablet ? "none" : "350px",
            minHeight: isMobile ? "auto" : "200px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: getResponsiveValue(8, 12),
              paddingBottom: getResponsiveValue(8, 12),
              borderBottom: `1px solid ${colors.lightGrey}`,
              flexWrap: "wrap",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                color: colors.textDark,
                fontWeight: "600",
                fontSize: getResponsiveValue(14, 18),
                margin: 0,
              }}
            >
              Battery Status
            </h2>
            <RefreshButton />
          </div>
          <div style={{ 
            flex: 1, 
            overflow: "auto", 
            minHeight: 0,
            maxHeight: "100%",
          }}>
            <StatusCards
              bmsState={bmsState}
              roundValue={roundValue}
              colors={colors}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Battery Performance Section */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: isMobile ? "250px" : "200px",
            maxHeight: isTablet ? "400px" : "400px",
            overflow: "hidden",
          }}
        >
          <GaugePanel
            bmsState={bmsState}
            roundValue={roundValue}
            colors={colors}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Right Section - Weather and System Metrics */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: getResponsiveValue(8, 16),
          minHeight: 0,
          maxHeight: isTablet ? "auto" : "100%",
          overflow: "hidden",
        }}
      >
        {/* Weather and Metrics Container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "minmax(250px, 350px) 1fr",
            gridTemplateRows: isMobile ? "auto auto" : "1fr",
            gap: getResponsiveValue(8, 16),
            flex: 1,
            minHeight: 0,
            maxHeight: "100%",
            overflow: "hidden",
          }}
        >
          {/* Weather Card */}
          <div style={{ 
            minHeight: isMobile ? "300px" : "250px",
            maxHeight: isTablet ? "400px" : "600px",
            overflow: "hidden",
          }}>
            <WeatherCard city="Brisbane" colors={colors} isMobile={isMobile} />
          </div>

          {/* System Metrics */}
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: "6px",
              padding: getResponsiveValue(12, 16),
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              minHeight: isMobile ? "300px" : "250px",
              maxHeight: isTablet ? "400px" : "600px",
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                color: colors.textDark,
                marginBottom: getResponsiveValue(8, 12),
                fontWeight: "600",
                fontSize: getResponsiveValue(14, 18),
                paddingBottom: getResponsiveValue(8, 12),
                borderBottom: `1px solid ${colors.lightGrey}`,
                flexShrink: 0,
              }}
            >
              System Metrics
            </h2>
            <div style={{ 
              flex: 1, 
              overflow: "auto",
              minHeight: 0,
              maxHeight: "100%",
            }}>
              <BatteryMetrics
                bmsState={bmsState}
                roundValue={roundValue}
                colors={colors}
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainView;