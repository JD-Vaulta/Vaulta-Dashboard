import React, { useState, useEffect } from "react";
import { colors } from "../../utils/diagnosticsHelpers.js";

const UserEmailDisplay = ({ user }) => {
  const [userEmail, setUserEmail] = useState("");
  const [isLoadingUserEmail, setIsLoadingUserEmail] = useState(true);

  useEffect(() => {
    const getUserEmail = async () => {
      setIsLoadingUserEmail(true);
      try {
        if (user && user.attributes && user.attributes.email) {
          setUserEmail(user.attributes.email);
        } else if (user && user.username && user.username.includes("@")) {
          setUserEmail(user.username);
        } else {
          try {
            const { fetchUserAttributes } = await import("aws-amplify/auth");
            const userAttributes = await fetchUserAttributes();
            if (userAttributes && userAttributes.email) {
              setUserEmail(userAttributes.email);
            } else {
              throw new Error("No email in user attributes");
            }
          } catch (attrError) {
            try {
              const { getCurrentUser } = await import("aws-amplify/auth");
              const userData = await getCurrentUser();
              if (
                userData &&
                userData.username &&
                userData.username.includes("@")
              ) {
                setUserEmail(userData.username);
              } else {
                throw new Error("No email format username in current user");
              }
            } catch (currentUserError) {
              throw new Error("Could not retrieve user email from any source");
            }
          }
        }
      } catch (error) {
        console.error("Failed to get user email:", error);
        setUserEmail("");
      } finally {
        setIsLoadingUserEmail(false);
      }
    };

    getUserEmail();
  }, [user]);

  if (isLoadingUserEmail) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "15px",
          color: colors.textLight,
        }}
      >
        Loading your profile information...
      </div>
    );
  }

  if (!userEmail) {
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
        Could not retrieve your email address. Notification management is
        unavailable.
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: "15px",
        padding: "10px",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          backgroundColor: colors.accentBlue,
          color: "white",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.9rem",
        }}
      >
        @
      </div>
      <div>
        <p
          style={{
            fontSize: "0.85rem",
            color: colors.textLight,
            margin: 0,
          }}
        >
          Managing notifications for:
        </p>
        <p
          style={{
            fontSize: "0.95rem",
            color: colors.textDark,
            fontWeight: "500",
            margin: "3px 0 0 0",
          }}
        >
          {userEmail}
        </p>
      </div>
    </div>
  );
};

export default UserEmailDisplay;
