import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBanner from "./TopBanner.js";
import { listUsers, updateUserRole, getUserDetails } from "./cognito-users.js";
import LoadingSpinner from "./LoadingSpinner.js";

const Page2 = ({ signOut }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  // Color palette
  const colors = {
    silverChalice: "#aeaeae",
    heavyMetal: "#1a1b1a",
    desertStorm: "#eaeae8",
    atlantis: "#87c842",
    stormDust: "#636362",
    thunderbird: "#bf1c1b",
    mantis: "#81c156",
    grannySmithApple: "#b8e09f",
    ghost: "#cbccd4",
    fedora: "#746c74",
  };

  // Placeholder bmsState for TopBanner
  const [bmsState, setBmsState] = useState({
    DeviceId: { N: "ADMIN-DEVICE" },
    SerialNumber: { N: "12345678" },
    TagID: { S: "BAT-ADMIN" },
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await listUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to extract attribute value from user
  const getAttributeValue = (user, attributeName) => {
    const attribute = user.Attributes.find(
      (attr) => attr.Name === attributeName
    );
    return attribute ? attribute.Value : "N/A";
  };

  // Function to handle role update
  const handleRoleUpdate = async (username, newRole) => {
    const confirmed = window.confirm(
      `Are you sure you want to set the role of ${username} to ${newRole}?`
    );

    if (confirmed) {
      try {
        await updateUserRole(username, newRole);
        alert(`Role updated successfully for ${username}`);

        // Refresh the user list to reflect the updated role
        const updatedUsers = await listUsers();
        setUsers(updatedUsers);
      } catch (error) {
        console.error("Error updating user role:", error);
        alert("Failed to update user role. Please try again.");
      }
    }
  };

  // Function to handle user click and fetch details
  const handleUserClick = async (username) => {
    setLoadingDetails(true);
    setSelectedUser(username);

    try {
      const details = await getUserDetails(username);
      setUserDetails(details);
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Failed to fetch user details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close user details modal
  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  // Empty component for tab controls (needed for TopBanner)
  const TabControls = () => <div></div>;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: colors.desertStorm,
        fontFamily:
          "SamsungOne, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        padding: "16px",
        gap: "16px",
      }}
    >
      {/* Main Content Container */}
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(26,27,26,0.08)",
            border: `1px solid ${colors.ghost}`,
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: colors.heavyMetal,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "32px",
                backgroundColor: colors.atlantis,
                borderRadius: "4px",
              }}
            ></span>
            User Management
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: colors.stormDust,
              fontSize: "0.9rem",
            }}
          >
            <span>Total Users: {users.length}</span>
          </div>
        </div>

        {/* Users Table Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(26,27,26,0.08)",
            border: `1px solid ${colors.ghost}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.heavyMetal,
                    color: "white",
                  }}
                >
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Username
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    User Role
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const userRole = getAttributeValue(user, "custom:user_role");
                  const isAdmin = userRole === "admin";

                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: `1px solid ${colors.ghost}`,
                        backgroundColor:
                          index % 2 === 0 ? colors.desertStorm : "white",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          colors.grannySmithApple;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? colors.desertStorm : "white";
                      }}
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          color: colors.heavyMetal,
                          fontWeight: "500",
                        }}
                        onClick={() => handleUserClick(user.Username)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor:
                                user.UserStatus === "CONFIRMED"
                                  ? colors.mantis
                                  : colors.thunderbird,
                            }}
                          ></div>
                          {user.Username}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: colors.stormDust,
                        }}
                        onClick={() => handleUserClick(user.Username)}
                      >
                        {getAttributeValue(user, "email")}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                        }}
                        onClick={() => handleUserClick(user.Username)}
                      >
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            backgroundColor:
                              user.UserStatus === "CONFIRMED"
                                ? colors.grannySmithApple
                                : colors.silverChalice,
                            color:
                              user.UserStatus === "CONFIRMED"
                                ? colors.heavyMetal
                                : "white",
                          }}
                        >
                          {user.UserStatus}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                        }}
                        onClick={() => handleUserClick(user.Username)}
                      >
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            backgroundColor: isAdmin
                              ? colors.atlantis
                              : colors.ghost,
                            color: isAdmin ? "white" : colors.heavyMetal,
                          }}
                        >
                          {userRole === "admin"
                            ? "Administrator"
                            : "Standard User"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <select
                          defaultValue={userRole}
                          onChange={(e) =>
                            handleRoleUpdate(user.Username, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "12px",
                            border: `2px solid ${colors.ghost}`,
                            backgroundColor: "white",
                            cursor: "pointer",
                            color: colors.heavyMetal,
                            fontSize: "0.9rem",
                            outline: "none",
                            transition: "all 0.2s ease",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.atlantis;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = colors.ghost;
                          }}
                        >
                          <option value="admin">Administrator</option>
                          <option value="client">Standard User</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
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
          onClick={closeUserDetails}
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
                onClick={closeUserDetails}
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
                  <strong style={{ color: colors.heavyMetal }}>
                    Username:
                  </strong>
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
                    {new Date(
                      userDetails.UserLastModifiedDate
                    ).toLocaleString()}
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
      )}
    </div>
  );
};

export default Page2;
