import React from "react";

const WarrantyStatus = ({ warrantyInfo }) => {
  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          marginBottom: "15px",
        }}
      >
        Warranty Status
      </h2>

      <div
        style={{
          backgroundColor: "#e8f5e9",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          borderLeft: "5px solid #4caf50",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#4caf50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          ✓
        </div>
        <div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#4caf50",
            }}
          >
            Warranty Active
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            Your battery is under warranty until {warrantyInfo.expiryDate}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "15px",
        }}
      >
        {Object.entries(warrantyInfo).map(([key, value]) => (
          <div
            key={key}
            style={{
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#666" }}>
              {key.charAt(0).toUpperCase() +
                key.slice(1).replace(/([A-Z])/g, " $1")}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarrantyStatus;
