import React from "react";
import WarrantyStatus from "./components/WarrantyStatus.js";
import SupportContact from "./components/SupportContact.js";
import DocumentManager from "./components/DocumentManager.js";
import { getWarrantyInfo } from "./utils/warrantyHelpers.js";

const WarrantyPage = ({ bmsData }) => {
  const warrantyInfo = getWarrantyInfo(bmsData);

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
        <WarrantyStatus warrantyInfo={warrantyInfo} />
        <DocumentManager />
        <SupportContact />
      </div>
    </div>
  );
};

export default WarrantyPage;
