import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports.js";
import CustomAuthWrapper from "./CustomAuthWrapper.js";
import SignInPage from "./pages/auth/SignInPage.js";
import SignUpPage from "./pages/auth/SignUpPage.js";
import Dashboard from "./pages/dashboard/DashboardPage.js";
import UserManagementPage from "./pages/user-management/UserManagementPage.js";
import DataAnalyticsPage from "./pages/data-analytics/DataAnalyticsPage.js";
import SystemSettings from "./app/components/SystemSettings.js";
import EnergyMonitorPage from "./pages/energy-monitor/EnergyMonitorPage.js";
import MLDashboardPage from "./pages/ml-dashboard/MLDashboardPage.js";
import DiagnosticsPage from "./pages/diagnostics/DiagnosticsPage.js";
import WarrantyPage from "./pages/warranty/WarrantyPage.js";
import TopBanner from "./app/components/TopBanner.js";
import LoadingSpinner from "./app/components/LoadingSpinner.js";
import useDynamoDB from "./useDynamoDB.js";
import { invokeLambdaFunction } from "./calc/lastmonthdata.js";

// Battery Registration Imports
import { BatteryProvider } from "./contexts/BatteryContext.js";
import BatteryProtectedRoute from "./components/auth/BatteryProtectedRoute.js";
import BatteryRegistrationPage from "./pages/battery-registration/BatteryRegistrationPage.js";
import BatteryManagementPage from "./pages/battery-registration/BatteryManagementPage.js";

// PackController Data Imports
import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import { getLatestPackControllerReading } from "./queries.js";

import "@aws-amplify/ui-react/styles.css";
import { AnimatePresence, motion } from "framer-motion";

// Add the `region` parameter to the `awsconfig` object
awsconfig.region = awsconfig.aws_project_region;

// Configure Amplify with the updated `awsconfig`
Amplify.configure(awsconfig);

// Protected Route Component
function ProtectedRoute({ children, user }) {
  const location = useLocation();

  if (!user) {
    // Redirect to sign in page but save the attempted location
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

// Main App Component
function App() {
  const { data: bmsData, error: dynamoError } = useDynamoDB();
  const [lambdaResponse, setLambdaResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lambdaError, setLambdaError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Lambda data for Energy Monitor
  useEffect(() => {
    const fetchLambdaData = async () => {
      if (
        !bmsData ||
        !bmsData.lastMinuteData ||
        bmsData.lastMinuteData.length === 0
      ) {
        console.log("BMS data not ready yet");
        return;
      }

      setIsUpdating(true);
      setLambdaError(null);

      try {
        // Get TagID from the current data
        const currentTagId = bmsData.lastMinuteData[0].TagID;
        const tagIdSuffix = currentTagId.split("BAT-")[1] || "0x440"; // Extract the suffix

        console.log("Invoking Lambda function with TagID:", tagIdSuffix);
        const response = await invokeLambdaFunction(tagIdSuffix, "7days"); // Pass time range
        console.log("Lambda response received:", response);
        setLambdaResponse(response);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error fetching Lambda data:", error);
        setLambdaError("Failed to fetch Lambda data. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    };

    fetchLambdaData();
  }, [bmsData]);

  // Handle errors from useDynamoDB
  useEffect(() => {
    if (dynamoError) {
      console.error("Error fetching BMS data:", dynamoError);
    }
  }, [dynamoError]);

  // Main App with Auth Wrapper
  return (
    <BrowserRouter>
      <CustomAuthWrapper>
        {({ user, signOut, navigate, checkAuthStatus }) => (
          <BatteryProvider user={user}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/signin"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <SignInPage onSignIn={checkAuthStatus} />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <SignUpPage />
                }
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute user={user}>
                    <BatteryProtectedRoute user={user}>
                      <AppWithAuth
                        user={user}
                        signOut={signOut}
                        navigate={navigate}
                        bmsData={bmsData}
                        lambdaResponse={lambdaResponse}
                        lastUpdate={lastUpdate}
                        isUpdating={isUpdating}
                      />
                    </BatteryProtectedRoute>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BatteryProvider>
        )}
      </CustomAuthWrapper>
    </BrowserRouter>
  );
}

// App with Authentication - this separates the authenticated app from the auth wrapper
function AppWithAuth({
  user,
  signOut,
  navigate,
  bmsData,
  lambdaResponse,
  lastUpdate,
  isUpdating,
}) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState({});

  // PackController Integration States
  const [dataType, setDataType] = useState("battery"); // "battery" or "packcontroller"
  const [packControllerState, setPackControllerState] = useState(null);
  const [packControllerLoading, setPackControllerLoading] = useState(false);
  const [packControllerLastUpdate, setPackControllerLastUpdate] = useState(
    new Date()
  );

  // Define the default section for each page
  useEffect(() => {
    const path = location.pathname;
    // Set default section when path changes
    switch (path) {
      case "/dashboard":
        if (dataType === "packcontroller") {
          setActiveSection({ dashboard: "overview" });
        } else {
          setActiveSection({ dashboard: "system" });
        }
        break;
      case "/data-analytics":
        setActiveSection({ analytics: "overview" });
        break;
      case "/energy-monitor":
        setActiveSection({ energy: "keyInsights" });
        break;
      // Add defaults for other pages
      default:
        // Keep current section or set a default
        break;
    }
  }, [location.pathname, dataType]);

  // Fetch PackController data when data type changes
  useEffect(() => {
    const fetchPackControllerData = async () => {
      if (dataType !== "packcontroller") return;

      try {
        setPackControllerLoading(true);

        const session = await fetchAuthSession();
        const credentials = session.credentials;

        const docClient = new AWS.DynamoDB.DocumentClient({
          apiVersion: "2012-08-10",
          region: awsconfig.region,
          credentials,
        });

        const deviceId = "PACK-CONTROLLER"; // Use the actual device ID from your data
        const latestReading = await getLatestPackControllerReading(
          docClient,
          deviceId
        );

        if (latestReading) {
          console.log("Latest PackController reading received:", latestReading);
          setPackControllerState(latestReading);
          setPackControllerLastUpdate(new Date());
        } else {
          console.warn("No PackController data available");
        }
      } catch (error) {
        console.error("Error fetching PackController data:", error);
      } finally {
        setPackControllerLoading(false);
      }
    };

    fetchPackControllerData();
  }, [dataType]);

  // Auto-refresh PackController data
  useEffect(() => {
    if (dataType !== "packcontroller") return;

    const interval = setInterval(async () => {
      try {
        const session = await fetchAuthSession();
        const credentials = session.credentials;

        const docClient = new AWS.DynamoDB.DocumentClient({
          apiVersion: "2012-08-10",
          region: awsconfig.region,
          credentials,
        });

        const deviceId = "PACK-CONTROLLER";
        const latestReading = await getLatestPackControllerReading(
          docClient,
          deviceId
        );

        if (latestReading) {
          setPackControllerState(latestReading);
          setPackControllerLastUpdate(new Date());
        }
      } catch (error) {
        console.error("Error auto-refreshing PackController data:", error);
      }
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [dataType]);

  // Handle data type change
  const handleDataTypeChange = (newDataType) => {
    console.log("Data type changed to:", newDataType);
    setDataType(newDataType);

    // Reset section to appropriate default for the data type
    if (newDataType === "packcontroller") {
      setActiveSection({ dashboard: "overview" });
    } else {
      setActiveSection({ dashboard: "system" });
    }
  };

  // Get the current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/user-management")) return "users";
    if (path.startsWith("/data-analytics")) return "analytics";
    if (path.startsWith("/ml-dashboard")) return "ml";
    if (path.startsWith("/system-settings")) return "settings";
    if (path.startsWith("/energy-monitor")) return "energy";
    if (path.startsWith("/diagnostics")) return "diagnostics";
    if (path.startsWith("/warranty")) return "warranty";
    if (path.startsWith("/battery-")) return "battery";
    return "";
  };

  // Get section controls for current page
  const getSectionControls = () => {
    const currentPage = getCurrentPage();

    // Return different section controls based on current page
    switch (currentPage) {
      case "dashboard":
        if (dataType === "packcontroller") {
          return (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActiveSection({ dashboard: "overview" })}
                style={{
                  margin: "0 5px",
                  padding: "8px 16px",
                  backgroundColor:
                    activeSection.dashboard === "overview"
                      ? "#4CAF50"
                      : "#ffffff",
                  color:
                    activeSection.dashboard === "overview" ? "#fff" : "#333333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📊</span>
                Overview
              </button>
              <button
                onClick={() => setActiveSection({ dashboard: "alarms" })}
                style={{
                  margin: "0 5px",
                  padding: "8px 16px",
                  backgroundColor:
                    activeSection.dashboard === "alarms"
                      ? "#4CAF50"
                      : "#ffffff",
                  color:
                    activeSection.dashboard === "alarms" ? "#fff" : "#333333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🚨</span>
                Alarm History
              </button>
            </div>
          );
        } else {
          return (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActiveSection({ dashboard: "system" })}
                style={{
                  margin: "0 5px",
                  padding: "8px 16px",
                  backgroundColor:
                    activeSection.dashboard === "system"
                      ? "#4CAF50"
                      : "#ffffff",
                  color:
                    activeSection.dashboard === "system" ? "#fff" : "#333333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⚙️</span>
                System Overview
              </button>
              <button
                onClick={() => setActiveSection({ dashboard: "details" })}
                style={{
                  margin: "0 5px",
                  padding: "8px 16px",
                  backgroundColor:
                    activeSection.dashboard === "details"
                      ? "#4CAF50"
                      : "#ffffff",
                  color:
                    activeSection.dashboard === "details" ? "#fff" : "#333333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📋</span>
                Detailed Data
              </button>
              <button
                onClick={() => setActiveSection({ dashboard: "installations" })}
                style={{
                  margin: "0 5px",
                  padding: "8px 16px",
                  backgroundColor:
                    activeSection.dashboard === "installations"
                      ? "#4CAF50"
                      : "#ffffff",
                  color:
                    activeSection.dashboard === "installations"
                      ? "#fff"
                      : "#333333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🏢</span>
                Installations
              </button>
            </div>
          );
        }
      case "energy":
        return (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveSection({ energy: "keyInsights" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.energy === "keyInsights"
                    ? "#4CAF50"
                    : "#ffffff",
                color:
                  activeSection.energy === "keyInsights" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📊</span>
              Key Insights
            </button>
            <button
              onClick={() => setActiveSection({ energy: "hourlyAverages" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.energy === "hourlyAverages"
                    ? "#4CAF50"
                    : "#ffffff",
                color:
                  activeSection.energy === "hourlyAverages"
                    ? "#fff"
                    : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📈</span>
              Hourly Trends
            </button>
            <button
              onClick={() => setActiveSection({ energy: "dailySummary" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.energy === "dailySummary"
                    ? "#4CAF50"
                    : "#ffffff",
                color:
                  activeSection.energy === "dailySummary" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📅</span>
              Daily Summary
            </button>
          </div>
        );
      case "analytics":
        return (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveSection({ analytics: "overview" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.analytics === "overview"
                    ? "#4CAF50"
                    : "#ffffff",
                color:
                  activeSection.analytics === "overview" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection({ analytics: "trends" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.analytics === "trends" ? "#4CAF50" : "#ffffff",
                color:
                  activeSection.analytics === "trends" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
              }}
            >
              Trends
            </button>
          </div>
        );
      // Add more cases for other pages
      default:
        return null;
    }
  };

  // Get current timestamp for data display
  const getCurrentTimestamp = () => {
    if (dataType === "packcontroller") {
      if (packControllerState?.Timestamp?.N) {
        return parseInt(packControllerState.Timestamp.N);
      }
      if (packControllerState?.Timestamp) {
        return parseInt(packControllerState.Timestamp);
      }
    } else {
      if (bmsData?.lastMinuteData?.[0]?.Timestamp?.N) {
        return parseInt(bmsData.lastMinuteData[0].Timestamp.N);
      }
      if (bmsData?.lastMinuteData?.[0]?.Timestamp) {
        return parseInt(bmsData.lastMinuteData[0].Timestamp);
      }
    }
    return Math.floor(Date.now() / 1000);
  };

  // Get current update time and loading state
  const getCurrentUpdateInfo = () => {
    if (dataType === "packcontroller") {
      return {
        lastUpdate: packControllerLastUpdate,
        isUpdating: packControllerLoading,
      };
    } else {
      return {
        lastUpdate: lastUpdate,
        isUpdating: isUpdating,
      };
    }
  };

  const updateInfo = getCurrentUpdateInfo();

  // Define animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "auto",
        backgroundColor: "#f2f2f2",
      }}
    >
      {/* Persistent TopBanner that stays during page transitions */}
      <TopBanner
        user={user}
        signOut={signOut}
        bmsState={bmsData?.lastMinuteData?.[0] || {}}
        packControllerState={packControllerState || {}}
        lastUpdate={updateInfo.lastUpdate}
        isUpdating={updateInfo.isUpdating}
        navigate={navigate}
        timestamp={getCurrentTimestamp()}
        dataType={dataType}
        onDataTypeChange={handleDataTypeChange}
      >
        {getSectionControls()}
      </TopBanner>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "0 10px 10px 10px",
        }}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Battery Registration Routes */}
            <Route
              path="/battery-registration"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <BatteryRegistrationPage />
                </motion.div>
              }
            />

            <Route
              path="/battery-management"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <BatteryManagementPage />
                </motion.div>
              }
            />

            {/* Dashboard Route with PackController Support */}
            <Route
              path="/dashboard"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <Dashboard
                    bmsData={bmsData}
                    activeSection={
                      activeSection.dashboard ||
                      (dataType === "packcontroller" ? "overview" : "system")
                    }
                    dataType={dataType}
                    packControllerState={packControllerState}
                  />
                </motion.div>
              }
            />

            <Route
              path="/user-management"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <UserManagementPage />
                </motion.div>
              }
            />

            <Route
              path="/data-analytics"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <DataAnalyticsPage
                    activeSection={activeSection.analytics || "overview"}
                  />
                </motion.div>
              }
            />

            <Route
              path="/ml-dashboard"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <MLDashboardPage
                    bmsData={bmsData}
                    lambdaResponse={lambdaResponse}
                  />
                </motion.div>
              }
            />

            <Route
              path="/system-settings"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <SystemSettings />
                </motion.div>
              }
            />

            <Route
              path="/energy-monitor"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <EnergyMonitorPage
                    bmsData={bmsData}
                    lambdaResponse={lambdaResponse}
                    activeSection={activeSection.energy || "keyInsights"}
                  />
                </motion.div>
              }
            />

            <Route
              path="/diagnostics"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <DiagnosticsPage bmsData={bmsData} user={user} />
                </motion.div>
              }
            />

            <Route
              path="/warranty"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: "100%" }}
                >
                  <WarrantyPage bmsData={bmsData} />
                </motion.div>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
