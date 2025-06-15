import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBatteryAnomalies } from "../../queries.js";
import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "../../aws-exports.js";

const MLDashboardContainer = ({ signOut, bmsData }) => {
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [displayedAnomalies, setDisplayedAnomalies] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [currentDisplayCount, setCurrentDisplayCount] = useState(10);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [initialLoad, setInitialLoad] = useState(false);
  const navigate = useNavigate();

  // Define colors for consistent styling
  const colors = {
    primary: "#818181", // Base gray
    secondary: "#c0c0c0", // Light gray
    accentGreen: "#4CAF50", // Vibrant green
    accentRed: "#F44336", // Strategic red
    accentBlue: "#2196F3", // Complementary blue
    background: "rgba(192, 192, 192, 0.1)",
    textDark: "#333333",
    textLight: "#555555",
    highlight: "#FFC107", // Accent yellow
  };

  // Load initial anomalies on component mount
  useEffect(() => {
    if (!initialLoad) {
      fetchAnomalies();
      setInitialLoad(true);
    }
  }, [initialLoad]);

  // Real DynamoDB fetch function for all anomalies
  const fetchAnomalies = async (loadMore = false) => {
    setLoading(true);
    try {
      // Get AWS credentials
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      // Initialize DynamoDB DocumentClient
      const docClient = new AWS.DynamoDB.DocumentClient({
        region: awsconfig.aws_project_region,
        credentials,
      });

      // Determine how many to fetch
      const limit = loadMore ? 50 : 50; // Always fetch 50 to cache

      // Fetch all anomalies data
      const result = await getAllBatteryAnomalies(docClient, limit);

      if (result.success) {
        if (loadMore) {
          // Add new data to existing
          const newAnomalies = [...anomalies, ...result.data];
          setAnomalies(newAnomalies);
          setTotalLoaded(newAnomalies.length);

          // Update displayed count
          const newDisplayCount = Math.min(
            currentDisplayCount + 10,
            newAnomalies.length
          );
          setDisplayedAnomalies(newAnomalies.slice(0, newDisplayCount));
          setCurrentDisplayCount(newDisplayCount);
          setHasMoreData(newDisplayCount < newAnomalies.length);
        } else {
          // Initial load
          setAnomalies(result.data);
          setTotalLoaded(result.data.length);
          setDisplayedAnomalies(result.data.slice(0, 10)); // Show first 10
          setCurrentDisplayCount(10);
          setHasMoreData(result.data.length > 10);
        }

        setLastEvaluatedKey(result.lastEvaluatedKey);
      } else {
        console.error("Failed to fetch anomalies:", result.error);
        if (!loadMore) {
          setAnomalies([]);
          setDisplayedAnomalies([]);
          setHasMoreData(false);
          setTotalLoaded(0);
        }
      }
    } catch (error) {
      console.error("Error fetching anomalies:", error);
      if (!loadMore) {
        setAnomalies([]);
        setDisplayedAnomalies([]);
        setHasMoreData(false);
        setTotalLoaded(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreAnomalies = () => {
    // If we have cached data, show more from cache
    if (currentDisplayCount < anomalies.length) {
      const newCount = Math.min(currentDisplayCount + 10, anomalies.length);
      setDisplayedAnomalies(anomalies.slice(0, newCount));
      setCurrentDisplayCount(newCount);
      setHasMoreData(newCount < anomalies.length || lastEvaluatedKey);
    }
    // If we need to fetch more data from DynamoDB
    else if (lastEvaluatedKey) {
      fetchAnomalies(true);
    }
  };

  const refreshAnomalies = () => {
    setAnomalies([]);
    setDisplayedAnomalies([]);
    setCurrentDisplayCount(10);
    setTotalLoaded(0);
    setLastEvaluatedKey(null);
    fetchAnomalies();
  };

  const openAnomalyDetail = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnomaly(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAnomalySeverity = (score) => {
    const numScore = parseFloat(score);
    if (numScore > 35)
      return {
        level: "High",
        color: colors.accentRed,
        bg: "rgba(244, 67, 54, 0.1)",
      };
    if (numScore > 25)
      return {
        level: "Medium",
        color: colors.highlight,
        bg: "rgba(255, 193, 7, 0.1)",
      };
    return {
      level: "Low",
      color: colors.accentGreen,
      bg: "rgba(76, 175, 80, 0.1)",
    };
  };

  // Helper function to round numbers to 2 decimal places
  const roundTo2 = (value) => {
    return parseFloat(value).toFixed(2);
  };

  // Get unique battery IDs for display
  const uniqueBatteryIds = [
    ...new Set(displayedAnomalies.map((a) => a.tag_id)),
  ];

  return (
    <div
      style={{
        height: "80vh",
        backgroundColor: colors.background,
        fontFamily:
          "SamsungOne, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Fixed */}
      <div
        style={{
          backgroundColor: "white",
          padding: "25px",
          margin: "10px 10px 0 10px",
          borderRadius: "15px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "600",
            color: colors.primary,
            margin: "0 0 20px 0",
            borderBottom: `2px solid ${colors.secondary}`,
            paddingBottom: "15px",
          }}
        >
          Battery Anomaly Detection
        </h1>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {/* Stats Display */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                backgroundColor: colors.background,
                padding: "12px 20px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "500",
                color: colors.primary,
              }}
            >
              Showing: {displayedAnomalies.length} anomalies
            </div>
            <div
              style={{
                backgroundColor: colors.background,
                padding: "12px 20px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "500",
                color: colors.primary,
              }}
            >
              Cached: {totalLoaded} anomalies
            </div>
            <div
              style={{
                backgroundColor: colors.background,
                padding: "12px 20px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "500",
                color: colors.accentGreen,
              }}
            >
              Batteries: {uniqueBatteryIds.length}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* Load More Button */}
            {hasMoreData && (
              <button
                onClick={loadMoreAnomalies}
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  backgroundColor: loading
                    ? colors.secondary
                    : colors.background,
                  color: loading ? colors.textLight : colors.primary,
                  border: `2px solid ${
                    loading ? colors.secondary : colors.primary
                  }`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minWidth: "120px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = colors.primary;
                    e.target.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = colors.background;
                    e.target.style.color = colors.primary;
                  }
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #66666640",
                        borderTop: "2px solid #666666",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    Loading...
                  </>
                ) : (
                  <>⬇️ Load More</>
                )}
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={refreshAnomalies}
              disabled={loading}
              style={{
                padding: "12px 24px",
                backgroundColor: loading ? colors.secondary : colors.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = colors.textDark;
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = colors.primary;
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff40",
                      borderTop: "2px solid #ffffff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  Loading...
                </>
              ) : (
                <>🔄 Refresh</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px",
          paddingTop: "20px",
        }}
      >
        {/* Anomalies Display */}
        {displayedAnomalies.length > 0 && (
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "600",
                  color: colors.textDark,
                  margin: 0,
                }}
              >
                All Battery Anomalies
              </h2>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.textLight,
                  backgroundColor: colors.background,
                  padding: "6px 12px",
                  borderRadius: "20px",
                }}
              >
                Latest anomalies from all batteries
              </div>
            </div>

            {/* Anomalies List */}
            <div
              style={{
                display: "grid",
                gap: "15px",
              }}
            >
              {displayedAnomalies.map((anomaly, index) => {
                const severity = getAnomalySeverity(anomaly.anomaly_score);
                return (
                  <div
                    key={anomaly.id}
                    onClick={() => openAnomalyDetail(anomaly)}
                    style={{
                      padding: "20px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor: "#fafafa",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f0f0f0";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fafafa";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: colors.textDark,
                          }}
                        >
                          Anomaly #{index + 1}
                        </div>
                        <div
                          style={{
                            backgroundColor: colors.background,
                            color: colors.primary,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          {anomaly.tag_id}
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: severity.bg,
                          color: severity.color,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {severity.level} Risk
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                        fontSize: "14px",
                      }}
                    >
                      <div>
                        <span style={{ color: colors.textLight }}>
                          Detection Time:{" "}
                        </span>
                        <span style={{ fontWeight: "500" }}>
                          {anomaly.detection_time}
                        </span>
                      </div>
                      <div>
                        {/* <span style={{ color: colors.textLight }}>
                          Anomaly Score:{" "}
                        </span>
                        <span
                          style={{ fontWeight: "500", color: severity.color }}
                        >
                          {roundTo2(anomaly.anomaly_score)}
                        </span> */}
                      </div>
                      <div>
                        {/* <span style={{ color: colors.textLight }}>SOC: </span>
                        <span style={{ fontWeight: "500" }}>
                          {roundTo2(anomaly.SOCPercent)}%
                        </span> */}
                      </div>
                      <div>
                        <span style={{ color: colors.textLight }}>
                          Total Voltage:{" "}
                        </span>
                        <span style={{ fontWeight: "500" }}>
                          {roundTo2(anomaly.TotalBattVoltage)}V
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "12px",
                        color: colors.textLight,
                        textAlign: "right",
                      }}
                    >
                      Click to view detailed information →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && displayedAnomalies.length === 0 && (
          <div
            style={{
              backgroundColor: "white",
              padding: "60px",
              borderRadius: "15px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              🔍
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                color: colors.textLight,
                margin: "0 0 10px 0",
              }}
            >
              No anomalies found
            </h3>
            <p
              style={{
                color: colors.textLight,
                margin: "0 0 20px 0",
              }}
            >
              The database appears to be empty or there was an error loading
              data.
            </p>
            <button
              onClick={refreshAnomalies}
              style={{
                padding: "10px 20px",
                backgroundColor: colors.primary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Modal for Detailed View */}
      {showModal && selectedAnomaly && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "30px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                width: "30px",
                height: "30px",
                border: "none",
                backgroundColor: colors.background,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "16px",
                color: colors.textLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.accentRed;
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.background;
                e.target.style.color = colors.textLight;
              }}
            >
              ×
            </button>

            {/* Modal Content */}
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: colors.primary,
                  marginBottom: "20px",
                  paddingRight: "40px",
                }}
              >
                Anomaly Details
              </h2>

              {(() => {
                const severity = getAnomalySeverity(
                  selectedAnomaly.anomaly_score
                );
                return (
                  <div
                    style={{
                      backgroundColor: severity.bg,
                      color: severity.color,
                      padding: "12px 20px",
                      borderRadius: "8px",
                      marginBottom: "25px",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {severity.level} Risk Anomaly 
                  </div>
                );
              })()}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* Basic Information */}
                <div
                  style={{
                    backgroundColor: colors.background,
                    padding: "20px",
                    borderRadius: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: colors.textDark,
                      marginBottom: "15px",
                    }}
                  >
                    Basic Information
                  </h3>
                  <div
                    style={{ display: "grid", gap: "10px", fontSize: "14px" }}
                  >
                    <div>
                      <strong>ID:</strong> {selectedAnomaly.id}
                    </div>
                    <div>
                      <strong>Tag ID:</strong> {selectedAnomaly.tag_id}
                    </div>
                    <div>
                      <strong>Detection Time:</strong>{" "}
                      {selectedAnomaly.detection_time}
                    </div>
                    <div>
                      <strong>Timestamp:</strong>{" "}
                      {formatTimestamp(selectedAnomaly.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Battery Metrics */}
                <div
                  style={{
                    backgroundColor: colors.background,
                    padding: "20px",
                    borderRadius: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: colors.textDark,
                      marginBottom: "15px",
                    }}
                  >
                    Battery Metrics
                  </h3>
                  <div
                    style={{ display: "grid", gap: "10px", fontSize: "14px" }}
                  >
                    
                    <div>
                      <strong>Total Voltage:</strong>{" "}
                      {roundTo2(selectedAnomaly.TotalBattVoltage)}V
                    </div>
                    <div>
                      <strong>Total Current:</strong>{" "}
                      {roundTo2(selectedAnomaly.TotalCurrent)}A
                    </div>
                  </div>
                </div>

                {/* Temperature Data */}
                <div
                  style={{
                    backgroundColor: colors.background,
                    padding: "20px",
                    borderRadius: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: colors.textDark,
                      marginBottom: "15px",
                    }}
                  >
                    Temperature Data
                  </h3>
                  <div
                    style={{ display: "grid", gap: "10px", fontSize: "14px" }}
                  >
                    <div>
                      <strong>Max Cell Temp:</strong>{" "}
                      {roundTo2(selectedAnomaly.MaxCellTemp)}°C
                    </div>
                    <div>
                      <strong>Min Cell Temp:</strong>{" "}
                      {roundTo2(selectedAnomaly.MinCellTemp)}°C
                    </div>
                    <div>
                      <strong>Temp Difference:</strong>{" "}
                      {roundTo2(
                        parseFloat(selectedAnomaly.MaxCellTemp) -
                          parseFloat(selectedAnomaly.MinCellTemp)
                      )}
                      °C
                    </div>
                  </div>
                </div>

                {/* Voltage Data */}
                <div
                  style={{
                    backgroundColor: colors.background,
                    padding: "20px",
                    borderRadius: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: colors.textDark,
                      marginBottom: "15px",
                    }}
                  >
                    Voltage Data
                  </h3>
                  <div
                    style={{ display: "grid", gap: "10px", fontSize: "14px" }}
                  >
                    <div>
                      <strong>Max Cell Voltage:</strong>{" "}
                      {roundTo2(selectedAnomaly.MaximumCellVoltage)}V
                    </div>
                    <div>
                      <strong>Min Cell Voltage:</strong>{" "}
                      {roundTo2(selectedAnomaly.MinimumCellVoltage)}V
                    </div>
                    <div>
                      <strong>Voltage Difference:</strong>{" "}
                      {roundTo2(
                        parseFloat(selectedAnomaly.MaximumCellVoltage) -
                          parseFloat(selectedAnomaly.MinimumCellVoltage)
                      )}
                      V
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add loading spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MLDashboardContainer;
