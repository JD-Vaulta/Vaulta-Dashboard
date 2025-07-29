import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useBatteryContext } from "../../contexts/BatteryContext.js";
import { registerBattery } from "../../services/batteryRegistrationService.js";

const BatteryRegistrationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshBatteries, hasRegisteredBatteries } = useBatteryContext();

  const [currentStep, setCurrentStep] = useState(
    hasRegisteredBatteries ? "form" : "welcome"
  );
  const [formData, setFormData] = useState({
    serialNumber: "",
    batteryId: "",
    nickname: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Validate form
  const validateForm = () => {
    if (!formData.serialNumber.trim()) {
      setError("Serial number is required");
      return false;
    }
    if (!formData.batteryId.trim()) {
      setError("Battery ID is required");
      return false;
    }
    // Basic format validation for battery ID
    if (!/^(0x)?[0-9a-fA-F]+$/.test(formData.batteryId.trim())) {
      setError("Battery ID must be in hexadecimal format (e.g., 0x440 or 440)");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Ensure battery ID has 0x prefix
      const batteryId = formData.batteryId.startsWith("0x")
        ? formData.batteryId
        : `0x${formData.batteryId}`;

      const result = await registerBattery(
        formData.serialNumber,
        batteryId,
        formData.nickname || null,
        formData.location || null
      );

      if (result.success) {
        setSuccess(true);
        setCurrentStep("success");
        // Refresh battery context
        await refreshBatteries();
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation after successful registration
  const handleContinue = () => {
    // Go back to the page they were trying to access, or dashboard
    const redirectTo = location.state?.from?.pathname || "/dashboard";
    navigate(redirectTo);
  };

  // Common styles matching your app
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 200px)",
    padding: "20px",
    backgroundColor: "#f2f2f2",
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    textAlign: "center",
  };

  const buttonStyle = {
    padding: "12px 24px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background-color 0.2s ease",
    margin: "8px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "16px",
    marginBottom: "16px",
    boxSizing: "border-box",
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Welcome Screen
  if (currentStep === "welcome") {
    return (
      <motion.div
        style={containerStyle}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div style={cardStyle}>
          <h1 style={{ color: "#333", marginBottom: "24px" }}>
            Welcome to Your Battery Management System
          </h1>
          <p
            style={{
              color: "#666",
              fontSize: "18px",
              lineHeight: "1.6",
              marginBottom: "32px",
            }}
          >
            To get started, you'll need to register at least one battery. This
            ensures you only see data from batteries you own and manage.
          </p>
          <div
            style={{
              backgroundColor: "#e8f5e8",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <h3 style={{ color: "#2e7d32", margin: "0 0 12px 0" }}>
              What you'll need:
            </h3>
            <ul style={{ color: "#2e7d32", margin: 0, paddingLeft: "20px" }}>
              <li>Battery serial number</li>
              <li>Battery ID (Look on your Battery Label for this)</li>
              <li>Optional: A nickname for easy identification</li>
              <li>Optional: Physical location of the battery</li>
            </ul>
          </div>
          <button
            style={buttonStyle}
            onClick={() => setCurrentStep("form")}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
          >
            Register My First Battery
          </button>
        </div>
      </motion.div>
    );
  }

  // Success Screen
  if (currentStep === "success") {
    return (
      <motion.div
        style={containerStyle}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div style={cardStyle}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>✅</div>
          <h1 style={{ color: "#4CAF50", marginBottom: "16px" }}>
            Battery Registered Successfully!
          </h1>
          <p style={{ color: "#666", fontSize: "18px", marginBottom: "32px" }}>
            Your battery has been registered and you can now access all features
            of the system.
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <button
              style={buttonStyle}
              onClick={handleContinue}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
            >
              Continue to Dashboard
            </button>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: "#2196F3",
              }}
              onClick={() => navigate("/battery-management")}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1976D2")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2196F3")}
            >
              Manage Batteries
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Registration Form
  return (
    <motion.div
      style={containerStyle}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div style={cardStyle}>
        <h1 style={{ color: "#333", marginBottom: "8px" }}>
          {hasRegisteredBatteries ? "Add New Battery" : "Register Your Battery"}
        </h1>
        <p style={{ color: "#666", marginBottom: "32px" }}>
          Enter your battery information below
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Serial Number *
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="Enter battery serial number"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Battery ID *
            </label>
            <input
              type="text"
              name="batteryId"
              value={formData.batteryId}
              onChange={handleInputChange}
              placeholder="Hardware ID from Battery Label"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Nickname (Optional)
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="e.g., Main Battery, Backup Battery"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Location (Optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Garage, Basement, Solar Room"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#ffebee",
                color: "#d32f2f",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ textAlign: "center", display: "flex", gap: "12px" }}>
            {hasRegisteredBatteries && (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#666",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#555")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#666")}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseOver={(e) =>
                !loading && (e.target.style.backgroundColor = "#45a049")
              }
              onMouseOut={(e) =>
                !loading && (e.target.style.backgroundColor = "#4CAF50")
              }
            >
              {loading ? "Registering..." : "Register Battery"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BatteryRegistrationPage;
