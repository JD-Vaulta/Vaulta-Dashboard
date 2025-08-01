import React from "react";
import { motion } from "framer-motion";

const CardItem = ({ label, value, icon, color }) => {
  console.log("CardItem: Rendering", label, "with value:", value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #e6e6e6",
        borderRadius: "15px",
        padding: "15px",
        margin: "10px 0",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {icon && (
        <div style={{ marginRight: "15px", color: color, fontSize: "24px" }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{ color: "#757575", fontSize: "14px", marginBottom: "4px" }}
        >
          {label}
        </div>
        <motion.div
          key={value} // This will trigger animation when value changes
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            color: "#000000",
            minHeight: "20px",
            wordBreak: "break-word",
          }}
        >
          {value || "Loading..."}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CardItem;
