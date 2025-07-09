// This is your DashboardCell.js moved with exact same functionality
import React from "react";
import PropTypes from "prop-types";
import NodeTables from "../widgets/NodeTables.js";

const CellView = ({ nodeData, colors, RefreshButton }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "15px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        flex: 1,
        overflow: "hidden",
        border: `1px solid ${colors.secondary}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h2
          style={{
            color: colors.textDark,
            fontWeight: "600",
            fontSize: "1.2rem",
            margin: 0,
          }}
        >
          Cell & Temperature Data
        </h2>
        <RefreshButton />
      </div>
      <div
        style={{
          flex: 1,
          borderTop: `1px solid ${colors.secondary}`,
          paddingTop: "15px",
        }}
      >
        <NodeTables nodeData={nodeData} colors={colors} />
      </div>
    </div>
  );
};

CellView.propTypes = {
  nodeData: PropTypes.array.isRequired,
  colors: PropTypes.object.isRequired,
  RefreshButton: PropTypes.func.isRequired,
};

export default CellView;
