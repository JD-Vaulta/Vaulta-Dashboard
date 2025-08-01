import React from "react";

const SectionNavigation = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: "keyInsights", label: "Key Insights", icon: "📊" },
    { id: "hourlyAverages", label: "Hourly Trends", icon: "📈" },
    { id: "dailySummary", label: "Daily Summary", icon: "📅" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        backgroundColor: "white",
        padding: "15px 20px",
        borderRadius: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        flexWrap: "wrap", // Allow wrapping on smaller screens
      }}
    >
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          style={{
            padding: "10px 20px",
            backgroundColor:
              activeSection === section.id ? "#4CAF50" : "#f5f5f5",
            color: activeSection === section.id ? "white" : "#333",
            border:
              activeSection === section.id
                ? "2px solid #4CAF50"
                : "2px solid transparent",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow:
              activeSection === section.id
                ? "0 2px 8px rgba(76, 175, 80, 0.3)"
                : "0 1px 3px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            if (activeSection !== section.id) {
              e.target.style.backgroundColor = "#e8e8e8";
              e.target.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeSection !== section.id) {
              e.target.style.backgroundColor = "#f5f5f5";
              e.target.style.transform = "translateY(0)";
            }
          }}
        >
          <span>{section.icon}</span>
          {section.label}
        </button>
      ))}
    </div>
  );
};

export default SectionNavigation;
