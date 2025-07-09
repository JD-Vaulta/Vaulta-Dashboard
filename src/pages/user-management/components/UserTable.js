import React from "react";

const UserTable = ({ users, onUserClick, onRoleUpdate }) => {
  const colors = {
    heavyMetal: "#1a1b1a",
    desertStorm: "#eaeae8",
    atlantis: "#87c842",
    thunderbird: "#bf1c1b",
    mantis: "#81c156",
    grannySmithApple: "#b8e09f",
    ghost: "#cbccd4",
    stormDust: "#636362",
  };

  const getAttributeValue = (user, attributeName) => {
    const attribute = user.Attributes.find(
      (attr) => attr.Name === attributeName
    );
    return attribute ? attribute.Value : "N/A";
  };

  return (
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
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: colors.heavyMetal, color: "white" }}>
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Username
              </th>
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Email
              </th>
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                User Role
              </th>
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: "600",
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
                    cursor: "pointer",
                  }}
                  onClick={() => onUserClick(user.Username)}
                >
                  <td
                    style={{
                      padding: "16px 20px",
                      color: colors.heavyMetal,
                      fontWeight: "500",
                    }}
                  >
                    {user.Username}
                  </td>
                  <td style={{ padding: "16px 20px", color: colors.stormDust }}>
                    {getAttributeValue(user, "email")}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        backgroundColor:
                          user.UserStatus === "CONFIRMED"
                            ? colors.grannySmithApple
                            : colors.ghost,
                        color:
                          user.UserStatus === "CONFIRMED"
                            ? colors.heavyMetal
                            : "white",
                      }}
                    >
                      {user.UserStatus}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
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
                      {userRole === "admin" ? "Administrator" : "Standard User"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <select
                      defaultValue={userRole}
                      onChange={(e) =>
                        onRoleUpdate(user.Username, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "12px",
                        border: `2px solid ${colors.ghost}`,
                        backgroundColor: "white",
                        cursor: "pointer",
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
  );
};

export default UserTable;
