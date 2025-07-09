// CardItem.js
import React from "react";

const CardItem = ({ label, value, icon, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "15px",
      margin: "10px 0",
      backgroundColor: "#f9f9f9",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    }}
  >
    {icon && (
      <div
        style={{
          marginRight: "15px",
          color: color || "#333",
          fontSize: "24px",
        }}
      >
        {icon}
      </div>
    )}
    <div>
      <div style={{ color: "#666", fontSize: "14px" }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: "16px" }}>{value}</div>
    </div>
  </div>
);

export default CardItem;
