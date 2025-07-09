import React from "react";
import { motion } from "framer-motion";

const CardItem = ({ label, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
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
    <div>
      <div style={{ color: "#757575", fontSize: "14px" }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: "16px", color: "#000000" }}>
        {value}
      </div>
    </div>
  </motion.div>
);

export default CardItem;
