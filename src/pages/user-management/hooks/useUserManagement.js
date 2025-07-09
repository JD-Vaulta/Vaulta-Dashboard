import { useEffect, useState } from "react";
import { cognitoUserService } from "../services/cognitoUserService.js";

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await cognitoUserService.listUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle user click and fetch details
  const handleUserClick = async (username) => {
    setLoadingDetails(true);
    setSelectedUser(username);

    try {
      const details = await cognitoUserService.getUserDetails(username);
      setUserDetails(details);
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Failed to fetch user details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle role update
  const handleRoleUpdate = async (username, newRole) => {
    const confirmed = window.confirm(
      `Are you sure you want to set the role of ${username} to ${newRole}?`
    );

    if (confirmed) {
      try {
        await cognitoUserService.updateUserRole(username, newRole);
        alert(`Role updated successfully for ${username}`);

        // Refresh the user list
        const updatedUsers = await cognitoUserService.listUsers();
        setUsers(updatedUsers);
      } catch (error) {
        console.error("Error updating user role:", error);
        alert("Failed to update user role. Please try again.");
      }
    }
  };

  // Close user details modal
  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  return {
    users,
    loading,
    selectedUser,
    userDetails,
    loadingDetails,
    handleUserClick,
    handleRoleUpdate,
    closeUserDetails,
  };
};
