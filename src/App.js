import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import React, { useState, useEffect } from "react";
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
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <SignUpPage />
                  )
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

  // Define the default section for each page
  useEffect(() => {
    const path = location.pathname;
    // Set default section when path changes
    switch (path) {
      case "/dashboard":
        setActiveSection({ dashboard: "system" });
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
  }, [location.pathname]);

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
        return (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveSection({ dashboard: "system" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.dashboard === "system" ? "#4CAF50" : "#ffffff",
                color:
                  activeSection.dashboard === "system" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
              }}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveSection({ dashboard: "details" })}
              style={{
                margin: "0 5px",
                padding: "8px 16px",
                backgroundColor:
                  activeSection.dashboard === "details" ? "#4CAF50" : "#ffffff",
                color:
                  activeSection.dashboard === "details" ? "#fff" : "#333333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "0.85rem",
              }}
            >
              Detailed Data
            </button>
          </div>
        );
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
              }}
            >
              Dashboard
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
              }}
            >
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
              }}
            >
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
        lastUpdate={lastUpdate}
        isUpdating={isUpdating}
        navigate={navigate}
        timestamp={bmsData?.lastMinuteData?.[0]?.Timestamp?.N} // Unix timestamp from your data
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

            {/* Existing Routes */}
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
                    activeSection={activeSection.dashboard || "system"}
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