import React from "react";
import { useSNSManagement } from "../../hooks/useSNSManagement.js";
import { colors } from "../../utils/diagnosticsHelpers.js";

const SubscriptionManager = ({ user, setSubscriptionStatus }) => {
  const {
    userSubscriptions,
    isLoadingSubscriptions,
    isUnsubscribing,
    handleUnsubscribe,
    fetchSubscriptions,
  } = useSNSManagement(user, setSubscriptionStatus);

  if (isLoadingSubscriptions) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "15px",
          color: colors.textLight,
        }}
      >
        Loading your subscriptions...
      </div>
    );
  }

  if (userSubscriptions.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "15px",
          color: colors.textLight,
          backgroundColor: "rgba(0,0,0,0.05)",
          borderRadius: "4px",
        }}
      >
        You don't have any active SNS subscriptions. Switch to the Subscribe tab
        to add one.
      </div>
    );
  }

  return (
    <div>
      <p
        style={{
          marginBottom: "10px",
          fontSize: "0.85rem",
          color: colors.textLight,
        }}
      >
        Your current subscriptions:
      </p>
      <div
        style={
          {
            // Removed maxHeight and overflowY to eliminate scrolling
          }
        }
      >
        {userSubscriptions.map((sub, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              borderBottom:
                index < userSubscriptions.length - 1
                  ? `1px solid ${colors.secondary}`
                  : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: colors.textDark,
                }}
              >
                {sub.topicName}
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color:
                    sub.status === "Confirmed"
                      ? colors.accentGreen
                      : colors.highlight,
                  fontStyle: "italic",
                  marginTop: "3px",
                }}
              >
                Status: {sub.status}
              </p>
            </div>
            <button
              onClick={() => handleUnsubscribe(sub.subscriptionArn)}
              disabled={
                isUnsubscribing || sub.status === "Pending Confirmation"
              }
              style={{
                backgroundColor:
                  sub.status === "Pending Confirmation"
                    ? colors.secondary
                    : colors.accentRed,
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor:
                  sub.status === "Pending Confirmation" || isUnsubscribing
                    ? "default"
                    : "pointer",
                opacity:
                  sub.status === "Pending Confirmation" || isUnsubscribing
                    ? 0.6
                    : 1,
                fontSize: "0.8rem",
              }}
            >
              {sub.status === "Pending Confirmation"
                ? "Pending"
                : "Unsubscribe"}
            </button>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={fetchSubscriptions}
          style={{
            backgroundColor: "transparent",
            color: colors.accentBlue,
            border: "none",
            padding: "5px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: "5px" }}>↻</span> Refresh
        </button>
      </div>
    </div>
  );
};

export default SubscriptionManager;
