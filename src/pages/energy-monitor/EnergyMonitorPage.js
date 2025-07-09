import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/common/LoadingSpinner.js";
import KeyInsights from "./components/views/KeyInsights.js";
import HourlyChart from "./components/views/HourlyChart.js";
import DailySummary from "./components/views/DailySummary.js";
import SectionNavigation from "./components/widgets/SectionNavigation.js";
import { useEnergyData } from "./hooks/useEnergyData.js";

const EnergyMonitorPage = ({ bmsData, lambdaResponse }) => {
  const [activeSection, setActiveSection] = useState("keyInsights");
  const { loading, processedData } = useEnergyData(bmsData, lambdaResponse);

  const LoadingScreen = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <LoadingSpinner />
        <h2 style={{ marginTop: "20px", color: "#1259c3" }}>
          Loading energy data...
        </h2>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "keyInsights":
        return (
          <KeyInsights
            data={processedData}
            bmsData={bmsData}
            lambdaResponse={lambdaResponse}
          />
        );
      case "hourlyAverages":
        return <HourlyChart data={processedData} />;
      case "dailySummary":
        return <DailySummary data={processedData} />;
      default:
        return (
          <KeyInsights
            data={processedData}
            bmsData={bmsData}
            lambdaResponse={lambdaResponse}
          />
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f2f2f2",
      }}
    >
      {loading ? (
        <LoadingScreen />
      ) : (
        <div style={{ padding: "20px" }}>
          <SectionNavigation
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default EnergyMonitorPage;
