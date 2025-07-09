import React from "react";

// Progress bar component
export const ProgressBar = ({ percentage, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "error":
        return "#F44336"; // Red for errors
      case "complete":
        return "#4CAF50"; // Green for completion
      case "in_progress":
        return "#1259c3"; // Blue for in progress
      default:
        return "#757575"; // Gray for unknown status
    }
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#e0e0e0",
        borderRadius: "4px",
        height: "8px",
        marginTop: "10px",
        marginBottom: "5px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percentage || 0}%`,
          backgroundColor: getStatusColor(),
          height: "100%",
          borderRadius: "4px",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

// Loading indicator component
export const LoadingIndicator = ({ message }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "#666",
      }}
    >
      <div
        style={{
          border: "4px solid rgba(18, 89, 195, 0.3)",
          borderTop: "4px solid #1259c3",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          animation: "spin 1s linear infinite",
          marginBottom: "10px",
        }}
      />
      <p>{message || "Loading..."}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Status badge component
export const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "In Progress":
        return "#FFC107";
      case "Failed":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: `${getStatusColor()}20`, // 20% opacity
        color: getStatusColor(),
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "500",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: getStatusColor(),
          marginRight: "6px",
        }}
      />
      {status}
    </span>
  );
};

// Cache indicator component
export const CacheIndicator = ({ isFromCache }) => {
  if (!isFromCache) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "#E1F5FE",
        color: "#0288D1",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "500",
        marginLeft: "8px",
      }}
    >
      From Cache
    </span>
  );
};

export default {
  ProgressBar,
  LoadingIndicator,
  StatusBadge,
  CacheIndicator,
};
