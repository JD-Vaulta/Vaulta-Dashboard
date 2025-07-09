// components/LoadingSpinner.js
"use client";
import React from "react";

const LoadingSpinner = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2", // OneUI light background
      }}
    >
      <div
        style={{
          border: "4px solid rgba(18, 89, 195, 0.3)", // OneUI blue border
          borderTop: "4px solid #1259c3", // OneUI blue top border
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      ></div>
      <p
        style={{
          color: "#1259c3",
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
