import React, { useState } from "react";
import TopBanner from "./TopBanner.js";
import { fetchLastWeekData } from "../../calc/lastweekdata.js";
import { useNavigate } from "react-router-dom";

const Page4 = ({ signOut }) => {
  const [selectedTagId, setSelectedTagId] = useState("0x440");
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Placeholder bmsState for TopBanner
  const [bmsState, setBmsState] = useState({
    DeviceId: { N: "SETTINGS-DEVICE" },
    SerialNumber: { N: "12345678" },
    TagID: { S: "BAT-SETTINGS" },
  });

  // List of TagIDs
  const baseIds = [
    "0x100",
    "0x140",
    "0x180",
    "0x1C0",
    "0x200",
    "0x240",
    "0x280",
    "0x2C0",
    "0x400",
    "0x440",
    "0x480",
    "0x4C0",
    "0x500",
    "0x540",
    "0x580",
    "0x5C0",
    "0x600",
    "0x640",
    "0x680",
    "0x6C0",
    "0x740",
    "0x780",
  ];

  // Time range options
  const timeRanges = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 1 Month", value: "1month" },
  ];

  // Settings options
  const settingsOptions = [
    { id: "notifications", label: "Email Notifications", value: true },
    { id: "autoBackup", label: "Automatic Backup", value: false },
    { id: "darkMode", label: "Dark Mode", value: false },
    { id: "dataSync", label: "Data Synchronization", value: true },
  ];

  // Function to handle fetching data
  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await fetchLastWeekData(selectedTagId, selectedTimeRange);
      setSuccess("System configurations updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update system settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Empty component for tab controls (needed for TopBanner)
  const TabControls = () => <div></div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "20vh",
        backgroundColor: "#f2f2f2", // OneUI light background
        fontFamily:
          "SamsungOne, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        padding: "10px",
      }}
    >
      <div
        style={{
          flex: 1,
          backgroundColor: "#f2f2f2", // OneUI light background
          maxHeight: "80vh",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "15px", // Rounded corners for OneUI
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)", // OneUI shadow
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1259c3", // OneUI blue
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "10px",
            }}
          >
            System Settings
          </h1>

          {/* Settings Section */}
          <div
            style={{
              marginBottom: "30px",
              backgroundColor: "#f9f9f9",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#1259c3", // OneUI blue
                marginBottom: "15px",
              }}
            >
              Application Preferences
            </h2>

            <div style={{ marginBottom: "20px" }}>
              {settingsOptions.map((option) => (
                <div
                  key={option.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e6e6e6",
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#000000" }}>
                    {option.label}
                  </span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked={option.value} />
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "50px",
                        height: "26px",
                        backgroundColor: option.value ? "#4CAF50" : "#e6e6e6", // Changed to green for active
                        borderRadius: "34px",
                        transition: "0.4s",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "20px",
                          width: "20px",
                          left: option.value ? "26px" : "3px",
                          bottom: "3px",
                          backgroundColor: "white",
                          borderRadius: "50%",
                          transition: "0.4s",
                        }}
                      ></span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management Section */}
          <div
            style={{
              marginBottom: "30px",
              backgroundColor: "#f9f9f9",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#1259c3", // OneUI blue
                marginBottom: "15px",
              }}
            >
              System Calibration
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              {/* Device Selection */}
              <div>
                <label
                  htmlFor="tagId"
                  style={{
                    fontSize: "14px",
                    color: "#757575",
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Device ID:
                </label>
                <select
                  id="tagId"
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  style={{
                    padding: "10px 15px",
                    borderRadius: "25px", // Rounded corners for OneUI
                    border: "1px solid #e6e6e6",
                    width: "100%",
                    fontSize: "14px",
                    color: "#000000",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {baseIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Selection */}
              <div>
                <label
                  htmlFor="timeRange"
                  style={{
                    fontSize: "14px",
                    color: "#757575",
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Calibration Period:
                </label>
                <select
                  id="timeRange"
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  style={{
                    padding: "10px 15px",
                    borderRadius: "25px", // Rounded corners for OneUI
                    border: "1px solid #e6e6e6",
                    width: "100%",
                    fontSize: "14px",
                    color: "#000000",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Apply Button */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={handleFetchData}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#4CAF50", // Changed to green for consistency
                  color: "white",
                  border: "none",
                  borderRadius: "25px", // Rounded corners for OneUI
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)", // Green shadow
                }}
                disabled={loading}
              >
                {loading ? "Applying Changes..." : "Apply Changes"}
              </button>
            </div>

            {/* Success and Error Messages */}
            {success && (
              <div
                style={{
                  backgroundColor: "#e8f5e9", // Light green background
                  color: "#4CAF50", // Green text
                  padding: "12px",
                  borderRadius: "10px",
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                {success}
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: "#ffebee", // Light red background
                  color: "#F44336", // Red text
                  padding: "12px",
                  borderRadius: "10px",
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* System Information */}
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#1259c3", // OneUI blue
                marginBottom: "15px",
              }}
            >
              System Information
            </h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      color: "#757575",
                      width: "40%",
                    }}
                  >
                    Software Version
                  </td>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      fontWeight: "500",
                    }}
                  >
                    2.5.1
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      color: "#757575",
                    }}
                  >
                    Last Update
                  </td>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      fontWeight: "500",
                    }}
                  >
                    April 8, 2025
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      color: "#757575",
                    }}
                  >
                    Server Status
                  </td>
                  <td
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #e6e6e6",
                      fontWeight: "500",
                      color: "#4CAF50", // Green for operational
                    }}
                  >
                    Operational
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 5px",
                      color: "#757575",
                    }}
                  >
                    Database Status
                  </td>
                  <td
                    style={{
                      padding: "10px 5px",
                      fontWeight: "500",
                      color: "#4CAF50", // Green for operational
                    }}
                  >
                    Connected
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page4;
