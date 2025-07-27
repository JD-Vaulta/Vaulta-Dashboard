import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const BatteryMetricsCarousel = ({
  bmsState = {},
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
    lightGreen: "#70ab5c",
    textLight: "#6C757D",
  },
  isMobile = false,
}) => {
  // Generate historical data
  const [history, setHistory] = useState({
    SOCPercent: [82, 83, 85, 87, 89, 90, 92, 91, 90, 89],
    SOB: [95, 96, 97, 97, 98, 98, 98, 97, 97, 96],
    Temperature: [33, 34, 35, 36, 36, 35, 34, 35, 36, 37],
    SOH: [96, 96, 95, 95, 95, 95, 94, 94, 94, 95],
  });

  // Generate timestamps
  const generateTimeLabels = (count) => {
    const labels = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now - i * 15 * 60000);
      labels.push(
        time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    return labels;
  };

  const timeLabels = generateTimeLabels(10);

  // Update history
  useEffect(() => {
    setHistory((prev) => {
      const newHistory = { ...prev };

      if (bmsState.SOCPercent?.N) {
        const socValue = parseFloat(bmsState.SOCPercent.N);
        newHistory.SOCPercent = [...prev.SOCPercent.slice(1), socValue];
      }

      if (bmsState.MaxCellTemp?.N) {
        const tempValue = parseFloat(bmsState.MaxCellTemp.N);
        newHistory.Temperature = [...prev.Temperature.slice(1), tempValue];
      }

      newHistory.SOB = [...prev.SOB.slice(1), 98];
      newHistory.SOH = [...prev.SOH.slice(1), 95];

      return newHistory;
    });
  }, [bmsState]);

  // Metrics data with enhanced visual properties
  const metricsData = [
    {
      title: "State of Charge",
      key: "SOCPercent",
      value: parseFloat(bmsState.SOCPercent?.N),
      maxValue: 100,
      unit: "%",
      additionalInfo: `${roundValue(bmsState.SOCAh?.N)} Ah`,
      status:
        parseFloat(bmsState.TotalCurrent?.N) > 0 ? "Discharging" : "Charging",
      statusColor: colors.success,
      trend: "",
      gaugeColor: (val) => {
        if (val > 80) return colors.success;
        if (val > 50) return colors.warning;
        return colors.error;
      },
      icon: "",
    },
    {
      title: "State of Balance",
      key: "SOB",
      value: parseFloat(bmsState.BalanceSOCPercent?.N),
      maxValue: 100,
      unit: "%",
      additionalInfo: "3.35V-3.37V",
      status:
        parseFloat(bmsState.Node01BalanceStatus?.N) == 0 &&
        parseFloat(bmsState.Node00BalanceStatus?.N) == 0
          ? "Balanced"
          : "Not Balanced",
      statusColor: colors.success,
      trend: "",
      gaugeColor: colors.success,
      icon: "",
    },
    {
      title: "Battery Temp",
      key: "Temperature",
      value: parseFloat(bmsState.MaxCellTemp?.N),
      maxValue: 60,
      unit: "°C",
      additionalInfo: "0°-60°",
      status: "Normal",
      statusColor: colors.success,
      trend: "",
      gaugeColor: (value) => {
        if (value > 50) return colors.error;
        if (value > 10) return colors.warning;
        return colors.success;
      },
      icon: "",
    },
    {
      title: "State of Health",
      key: "SOH",
      value: parseFloat(bmsState.SOH_Estimate?.N),
      maxValue: 100,
      unit: "%",
      additionalInfo: "",
      status: "Excellent",
      statusColor: colors.success,
      trend: "",
      gaugeColor: colors.success,
      icon: "",
    },
  ];

  // Enhanced chart data creation
  const createChartData = (historyData, color) => {
    return {
      labels: timeLabels,
      datasets: [
        {
          label: "Value",
          data: historyData,
          borderColor: color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: {
            target: "origin",
            above: color + "20",
          },
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  // Enhanced Metric card component
  const MetricCard = ({ metric }) => {
    const color = colors.accent;
    const historyData = history[metric.key] || [];
    const chartData = createChartData(historyData, color);
    const percentage = (metric.value / metric.maxValue) * 100;
    const gaugeColor =
      typeof metric.gaugeColor === "function"
        ? metric.gaugeColor(metric.value)
        : metric.gaugeColor;

    return (
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: "10px",
          padding: isMobile ? "12px" : "16px",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${colors.lightGrey}`,
          transition: "all 0.3s ease",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
          e.currentTarget.style.borderColor = colors.lightGrey;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Header with icon and title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "20px" : "24px",
              marginRight: "8px",
            }}
          >
            {metric.icon}
          </div>
          <h4
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              color: colors.textDark,
              margin: 0,
            }}
          >
            {metric.title}
          </h4>
        </div>

        {/* Main content - Gauge and info */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "12px",
            minHeight: 0,
          }}
        >
          {/* Gauge section */}
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? "100px" : "121px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: isMobile ? "80px" : "100px",
                position: "relative",
              }}
            >
              <CircularProgressbar
                value={metric.value}
                maxValue={metric.maxValue}
                text={`${Math.round(metric.value)}${metric.unit}`}
                strokeWidth={18}
                styles={buildStyles({
                  textSize: isMobile ? "20px" : "20px",
                  pathColor: "#70ab5c",
                  textColor: colors.textDark,
                  trailColor: colors.white,
                  pathTransitionDuration: 0.5,
                  strokeLinecap: "butt",
                  text: {
                    fontWeight: "bold",
                    dominantBaseline: "middle",
                    textAnchor: "middle",
                  },
                })}
              />
            </div>
          </div>

          {/* Info section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            {/* Additional info */}
            <div
              style={{
                fontSize: isMobile ? "12px" : "14px",
                color: colors.textLight,
                marginBottom: "8px",
              }}
            >
              {metric.additionalInfo}
            </div>

            {/* Status and trend */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? "10px" : "12px",
                    color: metric.statusColor,
                    fontWeight: "600",
                    padding: "2px 8px",
                    backgroundColor: `${metric.statusColor}15`,
                    borderRadius: "12px",
                  }}
                >
                  {metric.status}
                </span>
                <span
                  style={{
                    fontSize: isMobile ? "10px" : "12px",
                    color: metric.trend.startsWith("+")
                      ? colors.success
                      : colors.error,
                    fontWeight: "600",
                  }}
                >
                  {metric.trend}
                </span>
              </div>

              {/* Mini chart */}
              <div
                style={{
                  height: "40px",
                  width: "100%",
                  position: "relative",
                }}
              >
                <Line
                  data={chartData}
                  options={chartOptions}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gridTemplateRows: isMobile ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
        gap: isMobile ? "12px" : "16px",
        padding: isMobile ? "8px" : "12px",
      }}
    >
      {metricsData.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
};

BatteryMetricsCarousel.propTypes = {
  bmsState: PropTypes.object.isRequired,
  roundValue: PropTypes.func.isRequired,
  colors: PropTypes.object.isRequired,
  isMobile: PropTypes.bool,
};

export default BatteryMetricsCarousel;
