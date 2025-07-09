import React from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner.js";

const UserDetailsModal = ({
  selectedUser,
  userDetails,
  loadingDetails,
  onClose,
}) => {
  const colors = {
    heavyMetal: "#1a1b1a",
    desertStorm: "#eaeae8",
    stormDust: "#636362",
    ghost: "#cbccd4",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(26,27,26,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(26,27,26,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "12px",
            borderBottom: `1px solid ${colors.ghost}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: colors.heavyMetal,
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            User Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: colors.stormDust,
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {loadingDetails ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <LoadingSpinner />
          </div>
        ) : userDetails ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "12px",
                padding: "16px",
                backgroundColor: colors.desertStorm,
                borderRadius: "12px",
              }}
            >
              <strong style={{ color: colors.heavyMetal }}>Username:</strong>
              <span style={{ color: colors.stormDust }}>
                {userDetails.Username}
              </span>

              <strong style={{ color: colors.heavyMetal }}>Status:</strong>
              <span style={{ color: colors.stormDust }}>
                {userDetails.UserStatus}
              </span>

              <strong style={{ color: colors.heavyMetal }}>Created:</strong>
              <span style={{ color: colors.stormDust }}>
                {new Date(userDetails.UserCreateDate).toLocaleString()}
              </span>

              <strong style={{ color: colors.heavyMetal }}>
                Last Modified:
              </strong>
              <span style={{ color: colors.stormDust }}>
                {new Date(userDetails.UserLastModifiedDate).toLocaleString()}
              </span>
            </div>

            {userDetails.UserAttributes &&
              userDetails.UserAttributes.length > 0 && (
                <div>
                  <h3
                    style={{
                      color: colors.heavyMetal,
                      fontSize: "1.1rem",
                      marginBottom: "12px",
                    }}
                  >
                    Attributes
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {userDetails.UserAttributes.map((attr, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 2fr",
                          gap: "12px",
                          padding: "8px 12px",
                          backgroundColor:
                            index % 2 === 0 ? colors.desertStorm : "white",
                          borderRadius: "8px",
                        }}
                      >
                        <strong
                          style={{
                            color: colors.heavyMetal,
                            fontSize: "0.9rem",
                          }}
                        >
                          {attr.Name}:
                        </strong>
                        <span
                          style={{
                            color: colors.stormDust,
                            fontSize: "0.9rem",
                          }}
                        >
                          {attr.Value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <p style={{ color: colors.stormDust }}>No details available</p>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;
