// Updated InstallationView.js with responsive design and professional color scheme
import React from "react";

const InstallationView = ({ colors, isMobile }) => {
  // Helper function to render status indicators
  const renderStatusIndicator = (status, activity) => {
    let bgColor = colors.success;
    let statusText = "OK";

    if (status === "ERROR") {
      bgColor = colors.error;
      statusText = "ERROR";
    } else if (activity === "Overcharge") {
      bgColor = colors.error;
      statusText = "Overcharge";
    } else if (activity === "Over-Temp") {
      bgColor = colors.error;
      statusText = "Over-Temp";
    }

    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: colors.white,
          padding: isMobile ? "2px 4px" : "4px 8px",
          borderRadius: "4px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: isMobile ? "9px" : "11px",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
      >
        {statusText}
      </div>
    );
  };

  // Array of installations for the table
  const installations = [
    {
      name: "Installation 1",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 2",
      location: "Newcastle",
      status: "ERROR",
      activity: "Overcharge",
      wattage: "0W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "21°C Sunny",
    },
    {
      name: "Installation 3",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 4",
      location: "Brisbane",
      status: "ERROR",
      activity: "Over-Temp",
      wattage: "0W",
      soc: "76%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 5",
      location: "Brisbane",
      status: "OK",
      activity: "Discharging",
      wattage: "-4000W",
      soc: "96%",
      batteryTemp: "42°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 6",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "20°C Rain",
    },
    {
      name: "Installation 7",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 8",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
    {
      name: "Installation 10",
      location: "Brisbane",
      status: "OK",
      activity: "Charging",
      wattage: "+4000W",
      soc: "96%",
      batteryTemp: "36°C",
      weather: "25°C Sunny",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 100px)",
      }}
    >
      <div style={{ 
        padding: isMobile ? "12px" : "16px", 
        borderBottom: `1px solid ${colors.lightGrey}`,
        backgroundColor: colors.white,
      }}>
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "600",
            color: colors.textDark,
          }}
        >
          Installations
        </h2>
      </div>

      <div style={{ 
        flex: 1, 
        overflow: "auto", 
        padding: "16px",
        backgroundColor: colors.background,
        maxHeight: "calc(100vh - 200px)",
      }}>
        <div style={{
          overflowX: "auto",
          backgroundColor: colors.white,
          borderRadius: "6px",
          border: `1px solid ${colors.lightGrey}`,
        }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: isMobile ? "11px" : "13px",
              minWidth: isMobile ? "600px" : "800px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: colors.background }}>
                {[
                  "Name", "Location", "Status", "Activity", 
                  "Wattage", "SOC", "Battery Temp", "Weather", "Actions"
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: isMobile ? "8px 4px" : "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: colors.textDark,
                      borderBottom: `2px solid ${colors.lightGrey}`,
                      position: "sticky",
                      top: 0,
                      backgroundColor: colors.background,
                      zIndex: 1,
                      fontSize: isMobile ? "10px" : "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isMobile && header === "Battery Temp" ? "Temp" : header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {installations.map((installation, index) => (
                <tr 
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? colors.white : colors.background,
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGrey + "30";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 
                      index % 2 === 0 ? colors.white : colors.background;
                  }}
                >
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textDark,
                      fontWeight: "500",
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.name}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textLight,
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.location}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}` 
                    }}
                  >
                    {renderStatusIndicator(installation.status, installation.activity)}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textDark,
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.activity}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: installation.wattage.startsWith("+") 
                        ? colors.success 
                        : installation.wattage.startsWith("-") 
                        ? colors.warning 
                        : colors.textDark,
                      fontWeight: "600",
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.wattage}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textDark,
                      fontWeight: "500",
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.soc}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textDark,
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.batteryTemp}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}`,
                      color: colors.textLight,
                      fontSize: isMobile ? "10px" : "inherit",
                    }}
                  >
                    {installation.weather}
                  </td>
                  <td
                    style={{ 
                      padding: isMobile ? "8px 4px" : "10px 8px", 
                      borderBottom: `1px solid ${colors.lightGrey}` 
                    }}
                  >
                    <button
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.white,
                        border: "none",
                        padding: isMobile ? "4px 8px" : "6px 12px",
                        borderRadius: "4px",
                        fontSize: isMobile ? "10px" : "12px",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        fontWeight: "500",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = colors.primary;
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats Bar */}
      <div
        style={{
          backgroundColor: colors.background,
          borderTop: `1px solid ${colors.lightGrey}`,
          padding: isMobile ? "8px 12px" : "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: isMobile ? "10px" : "12px",
          color: colors.textLight,
          flexWrap: "wrap",
          gap: isMobile ? "8px" : "12px",
        }}
      >
        <div>Total: {installations.length}</div>
        <div>
          Errors:{" "}
          <span style={{ color: colors.error, fontWeight: "600" }}>
            {installations.filter((i) => i.status === "ERROR").length}
          </span>
        </div>
        <div>
          Charging:{" "}
          <span style={{ color: colors.success, fontWeight: "600" }}>
            {installations.filter((i) => i.activity === "Charging").length}
          </span>
        </div>
        <div style={{ display: isMobile ? "none" : "block" }}>
          Discharging:{" "}
          <span style={{ color: colors.warning, fontWeight: "600" }}>
            {installations.filter((i) => i.activity === "Discharging").length}
          </span>
        </div>
        <div style={{ display: isMobile ? "none" : "block" }}>
          Last Update: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default InstallationView;