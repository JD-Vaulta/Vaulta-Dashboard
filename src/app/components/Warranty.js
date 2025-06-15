import React from "react";

const Warranty = ({ bmsData }) => {
  const currentData = bmsData?.lastMinuteData?.[0] || {};

  // Simulate warranty data
  const warrantyInfo = {
    serialNumber: currentData.SerialNumber?.N || "BMS-2023-00145",
    purchaseDate: "2023-06-15",
    warrantyPeriod: "5 years",
    expiryDate: "2028-06-15",
    status: "Active",
    coverageType: "Full Coverage",
    remainingCycles: 4000,
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#1259c3",
          marginBottom: "20px",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "10px",
        }}
      >
        Warranty Information
      </h1>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px",
        }}
      >
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
            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Serial Number
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {warrantyInfo.serialNumber}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Purchase Date
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {warrantyInfo.purchaseDate}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Warranty Period
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {warrantyInfo.warrantyPeriod}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Expiry Date
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {warrantyInfo.expiryDate}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Coverage Type
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {warrantyInfo.coverageType}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Manufacturer
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                {"Vaulta Systems"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              marginBottom: "15px",
            }}
          >
            Support & Service
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <div
              style={{
                flex: "1 1 300px",
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>
                Request Service
              </h3>
              <p style={{ marginBottom: "15px" }}>
                Schedule a service or request warranty-covered repairs.
              </p>
              <button
                style={{
                  backgroundColor: "#1259c3",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Submit Service Request
              </button>
            </div>

            <div
              style={{
                flex: "1 1 300px",
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>
                Support Contact
              </h3>
              <p style={{ marginBottom: "5px" }}>
                <strong>Email:</strong> support@vaulta.com
              </p>
              <p style={{ marginBottom: "5px" }}>
                <strong>Phone:</strong> +61 7 1234 5678
              </p>
              <p style={{ marginBottom: "5px" }}>
                <strong>Hours:</strong> Mon-Fri, 9am-5pm AEST
              </p>
              <p style={{ marginBottom: "15px" }}>
                <strong>Priority Support:</strong> Available for registered
                customers
              </p>
              <button
                style={{
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warranty;
