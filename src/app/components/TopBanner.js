import React, { useState, useRef, useEffect } from "react";
import logo from "../../vaulta_logo.svg";
import { signOut } from "aws-amplify/auth";

const TopBanner = ({
  bmsState,
  packControllerState,
  children,
  lastUpdate,
  isUpdating,
  user,
  navigate,
  timestamp,
  dataType = "battery", // New prop to specify data type
  onDataTypeChange, // Callback for data type changes
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userEmail, setUserEmail] = useState(null);

  // Format timestamps
  const formatTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString();
  };

  const formatDataTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Get user email
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        if (user && user.attributes && user.attributes.email) {
          setUserEmail(user.attributes.email);
          return;
        }

        if (user && user.username && user.username.includes("@")) {
          setUserEmail(user.username);
          return;
        }

        try {
          const { fetchUserAttributes } = await import("aws-amplify/auth");
          const userAttributes = await fetchUserAttributes();

          if (userAttributes && userAttributes.email) {
            setUserEmail(userAttributes.email);
            return;
          }
        } catch (error) {
          console.log("Could not get email from fetchUserAttributes:", error);
        }

        setUserEmail(user?.username || "User");
      } catch (error) {
        console.error("Error getting user email:", error);
        setUserEmail(user?.username || "User");
      }
    };

    getUserEmail();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("User signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle data type change
  const handleDataTypeChange = (newDataType) => {
    if (onDataTypeChange) {
      onDataTypeChange(newDataType);
    }
  };

  // Menu items for main navigation
  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "User Management", path: "/user-management" },
    { label: "Data Analytics", path: "/data-analytics" },
    { label: "ML Dashboard", path: "/ml-dashboard" },
    { label: "Energy Monitor", path: "/energy-monitor" },
    { label: "Diagnostics", path: "/diagnostics" },
    { label: "Warranty", path: "/warranty" },
    { label: "Battery Management", path: "/battery-management" },
  ];

  // Check if a menu item is active
  const isActive = (path) => {
    return window.location.pathname === path;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: "10px",
        border: "1px solid #e6e6e6",
        padding: "0",
        overflow: "hidden",
      }}
    >
      {/* Top Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid #e6e6e6",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: "80px",
            width: "80px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f5f5f9",
            borderRadius: "8px",
            marginRight: "20px",
          }}
        >
          <img
            src={logo}
            alt="Vaulta Logo"
            style={{
              height: "80%",
              width: "80%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Title */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1259c3",
              margin: 0,
            }}
          >
            Battery Management Dashboard
          </h1>
        </div>

        {/* User Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 20px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              minWidth: "120px",
              fontWeight: "500",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ marginRight: "8px" }}>⎋</span>
            Sign Out
          </button>

          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "rgba(129, 129, 129, 0.1)",
              borderRadius: "20px",
              color: "#818181",
              fontSize: "0.9rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              maxWidth: "300px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={userEmail}
          >
            <span
              style={{
                backgroundColor: "#818181",
                color: "white",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              @
            </span>
            {userEmail || user?.username || "User"}
          </div>
        </div>
      </div>

      {/* Navigation and Tab Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "10px 20px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {menuItems.map((item, index) => {
            const isActiveItem = isActive(item.path);

            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  backgroundColor: isActiveItem ? "#4CAF50" : "#fff",
                  color: isActiveItem ? "#fff" : "#333",
                  border: "1px solid #e6e6e6",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "normal",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (!isActiveItem) {
                    e.target.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActiveItem) {
                    e.target.style.backgroundColor = "#fff";
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>{children}</div>
      </div>
    </div>
  );
};

export default TopBanner;
