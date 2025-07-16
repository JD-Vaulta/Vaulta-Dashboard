// Updated LoadingSpinner.js with professional color scheme
"use client";
import React from "react";

const LoadingSpinner = () => {
  const colors = {
    primary: "#2E7D32",
    background: "#FAFAFA",
    lightGrey: "#E0E0E0",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: colors.background,
      }}
    >
      <div
        style={{
          border: `4px solid ${colors.lightGrey}`,
          borderTop: `4px solid ${colors.primary}`,
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      ></div>
      <p
        style={{
          color: colors.primary,
          fontWeight: "500",
          fontSize: "16px",
        }}
      >
        Loading...
      </p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;