import React from "react";

const SupportContact = () => {
  return (
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
  );
};

export default SupportContact;
