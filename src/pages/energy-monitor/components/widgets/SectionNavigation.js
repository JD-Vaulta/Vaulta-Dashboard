import React from "react";

const SectionNavigation = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: "keyInsights", label: "Key Insights" },
    { id: "hourlyAverages", label: "Hourly Trends" },
    { id: "dailySummary", label: "Daily Summary" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          style={{
            padding: "10px 15px",
            backgroundColor:
              activeSection === section.id ? "#4CAF50" : "#f5f5f5",
            color: activeSection === section.id ? "white" : "#333",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
};

export default SectionNavigation;
