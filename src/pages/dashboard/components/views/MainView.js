// This is your DashboardMain.js moved with exact same functionality
import React from "react";
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
  return (
    <>
      {/* Left Section - Combined Battery Status and Performance */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "30%",
          minWidth: "300px",
          marginRight: "10px",
          gap: "10px",
        }}
      >
        {/* Battery Status Section */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "15px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            border: `1px solid ${colors.secondary}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h2
              style={{
                color: colors.textDark,
                fontWeight: "600",
                fontSize: "1.2rem",
                margin: 0,
              }}
            >
              Battery Status
            </h2>
            <RefreshButton />
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              borderTop: `1px solid ${colors.secondary}`,
              paddingTop: "15px",
            }}
          >
            <StatusCards
              bmsState={bmsState}
              roundValue={roundValue}
              colors={colors}
            />
          </div>
        </div>

        {/* Battery Performance Section */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "0px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${colors.secondary}`,
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <GaugePanel
              bmsState={bmsState}
              roundValue={roundValue}
              colors={colors}
            />
          </div>
        </div>
      </div>

      {/* Right Section - Weather and System Metrics */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "10px",
            minHeight: 0,
          }}
        >
          {/* Weather Card */}
          <div
            style={{
              flex: 0.35,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            <WeatherCard city="Brisbane" />
          </div>

          {/* System Metrics */}
          <div
            style={{
              flex: 0.65,
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              border: `1px solid ${colors.secondary}`,
            }}
          >
            <h2
              style={{
                color: colors.textDark,
                marginBottom: "15px",
                fontWeight: "600",
                fontSize: "1.2rem",
                borderBottom: `1px solid ${colors.secondary}`,
                paddingBottom: "5px",
              }}
            >
              System Metrics
            </h2>
            <div style={{ flex: 1, minHeight: 0 }}>
              <BatteryMetrics
                bmsState={bmsState}
                roundValue={roundValue}
                colors={colors}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainView;
