// This is your DashboardInstallations.js moved with exact same functionality
import React from "react";

const InstallationView = () => {
  // Helper function to render status indicators
  const renderStatusIndicator = (status) => {
    let bgColor = "#8BC34A"; // Default green for OK
    let statusText = "OK";

    if (status === "ERROR") {
      bgColor = "#FF0000";
      statusText = "ERROR";
    } else if (status === "Overcharge") {
      bgColor = "#FF0000";
      statusText = "Overcharge";
    } else if (status === "Over-Temp") {
      bgColor = "#FF0000";
      statusText = "Over-Temp";
    }

    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: "white",
          padding: "2px 8px",
          borderRadius: "2px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "0.75rem",
          minWidth: "60px",
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
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: "2px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 160px)",
      }}
    >
      <div style={{ padding: "10px 15px", borderBottom: "1px solid #e0e0e0" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: "600",
            color: "#333333",
          }}
        >
          Installations
        </h2>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "10px 15px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Location
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Activity
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Wattage
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                SOC
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Battery Temp
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Weather
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333333",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {installations.map((installation, index) => (
              <tr key={index}>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.name}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.location}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {renderStatusIndicator(installation.status)}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.activity}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.wattage}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.soc}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.batteryTemp}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  {installation.weather}
                </td>
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #e0e0e0" }}
                >
                  <button
                    style={{
                      backgroundColor: "#FF0000",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "2px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
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

      {/* Footer Stats Bar */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          borderTop: "1px solid #e0e0e0",
          padding: "8px 15px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#666",
        }}
      >
        <div>Total Installations: {installations.length}</div>
        <div>
          Error Status:{" "}
          {installations.filter((i) => i.status === "ERROR").length}
        </div>
        <div>
          Charging:{" "}
          {installations.filter((i) => i.activity === "Charging").length}
        </div>
        <div>
          Discharging:{" "}
          {installations.filter((i) => i.activity === "Discharging").length}
        </div>
        <div>Last Update: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default InstallationView;
