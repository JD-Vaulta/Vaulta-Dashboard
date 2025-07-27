import React, { useState } from "react";
import UserEmailDisplay from "./UserEmailDisplay.js";
import TabNavigation from "../../../components/common/TabNavigation.js";
import TopicSubscription from "./TopicSubscription.js";
import SubscriptionManager from "./SubscriptionManager.js";
import { colors } from "../../utils/diagnosticsHelpers.js";

const NotificationManager = ({ user }) => {
  const [activeTab, setActiveTab] = useState("subscribe");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  return (
    <div
      style={{
        width: "50%",
        backgroundColor: colors.background,
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        minHeight: "600px", // Added minimum height
      }}
    >
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          marginBottom: "15px",
          color: colors.textDark,
          borderBottom: `1px solid ${colors.secondary}`,
          paddingBottom: "10px",
        }}
      >
        SNS Notification Management
      </h2>

      <div
        style={{
          flex: 1,
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
          overflow: "visible", // Changed from "auto" to "visible" to remove scroll
          display: "flex",
          flexDirection: "column",
        }}
      >
        <UserEmailDisplay user={user} />

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div style={{ flex: 1 }}>
          {activeTab === "subscribe" ? (
            <TopicSubscription
              user={user}
              setSubscriptionStatus={setSubscriptionStatus}
            />
          ) : (
            <SubscriptionManager
              user={user}
              setSubscriptionStatus={setSubscriptionStatus}
            />
          )}
        </div>

        {subscriptionStatus && (
          <div
            style={{
              fontSize: "0.85rem",
              marginTop: "12px",
              padding: "8px",
              backgroundColor: subscriptionStatus.includes("Successfully")
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(244, 67, 54, 0.1)",
              color: subscriptionStatus.includes("Successfully")
                ? colors.accentGreen
                : colors.accentRed,
              borderRadius: "4px",
              borderLeft: `3px solid ${
                subscriptionStatus.includes("Successfully")
                  ? colors.accentGreen
                  : colors.accentRed
              }`,
            }}
          >
            {subscriptionStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
