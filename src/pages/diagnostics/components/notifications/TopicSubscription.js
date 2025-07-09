import React from "react";
import { useSNSManagement } from "../../hooks/useSNSManagement.js";
import { colors } from "../../utils/diagnosticsHelpers.js";

const TopicSubscription = ({ user, setSubscriptionStatus }) => {
  const {
    availableTopics,
    selectedTopic,
    setSelectedTopic,
    isLoadingTopics,
    isSubscribing,
    handleSubscribe,
    fetchError,
    userEmail,
  } = useSNSManagement(user, setSubscriptionStatus);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubscribe();
  };

  if (fetchError) {
    return (
      <div
        style={{
          padding: "10px",
          backgroundColor: "#ffebee",
          borderRadius: "4px",
          color: colors.accentRed,
          marginBottom: "10px",
        }}
      >
        {fetchError}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="sns-topic"
          style={{
            display: "block",
            fontSize: "0.85rem",
            marginBottom: "5px",
            color: colors.textLight,
          }}
        >
          Select notification topic:
        </label>
        {isLoadingTopics ? (
          <div
            style={{
              fontSize: "0.85rem",
              color: colors.textLight,
              padding: "8px 0",
            }}
          >
            Loading available topics...
          </div>
        ) : availableTopics.length === 0 ? (
          <div
            style={{
              fontSize: "0.85rem",
              color: colors.accentRed,
              padding: "8px 0",
            }}
          >
            No topics available. Please check your AWS SNS configuration.
          </div>
        ) : (
          <select
            id="sns-topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: "5px",
              border: `1px solid ${colors.secondary}`,
              borderRadius: "4px",
              fontSize: "0.9rem",
              backgroundColor: "#fff",
              color: colors.textDark,
            }}
            disabled={isLoadingTopics}
          >
            {availableTopics.map((topic) => (
              <option key={topic.arn} value={topic.arn}>
                {topic.name}
              </option>
            ))}
          </select>
        )}
        {selectedTopic && availableTopics.length > 0 && (
          <p
            style={{
              fontSize: "0.8rem",
              margin: "5px 0",
              color: colors.textLight,
              fontStyle: "italic",
            }}
          >
            {availableTopics.find((t) => t.arn === selectedTopic)?.description}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isSubscribing || isLoadingTopics || availableTopics.length === 0
        }
        style={{
          backgroundColor: colors.accentBlue,
          color: "white",
          border: "none",
          padding: "8px 15px",
          borderRadius: "4px",
          cursor:
            isSubscribing || isLoadingTopics || availableTopics.length === 0
              ? "default"
              : "pointer",
          width: "100%",
          opacity:
            isSubscribing || isLoadingTopics || availableTopics.length === 0
              ? 0.7
              : 1,
        }}
      >
        {isSubscribing
          ? "Subscribing..."
          : `Subscribe ${userEmail} to Notifications`}
      </button>
    </form>
  );
};

export default TopicSubscription;
