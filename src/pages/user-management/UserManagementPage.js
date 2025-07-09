import React from "react";
import { useUserManagement } from "./hooks/useUserManagement.js";
import UserTable from "./components/UserTable.js";
import UserDetailsModal from "./components/UserDetailsModal.js";
import LoadingSpinner from "../components/common/LoadingSpinner.js";

const UserManagementPage = () => {
  const {
    users,
    loading,
    selectedUser,
    userDetails,
    loadingDetails,
    handleUserClick,
    handleRoleUpdate,
    closeUserDetails,
  } = useUserManagement();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#eaeae8",
        padding: "16px",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(26,27,26,0.08)",
          border: "1px solid #cbccd4",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1a1b1a",
            margin: 0,
          }}
        >
          User Management
        </h1>
        <div style={{ color: "#636362", fontSize: "0.9rem" }}>
          Total Users: {users.length}
        </div>
      </div>
      {/* User Table */}
      <UserTable
        users={users}
        onUserClick={handleUserClick}
        onRoleUpdate={handleRoleUpdate}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          selectedUser={selectedUser}
          userDetails={userDetails}
          loadingDetails={loadingDetails}
          onClose={closeUserDetails}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
