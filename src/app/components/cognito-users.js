import { fetchAuthSession } from "aws-amplify/auth";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import awsmobile from "../../aws-exports.js";

// Configure the Cognito client with Amplify credentials
const configureCognitoClient = async () => {
  try {
    const { credentials } = await fetchAuthSession(); // Fetch the current auth session
    const { accessKeyId, secretAccessKey, sessionToken } = credentials;

    // Create and return the Cognito client
    return new CognitoIdentityProvider({
      region: "ap-southeast-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    });
  } catch (error) {
    console.error("Error configuring Cognito client:", error);
    throw error;
  }
};

// List users from Cognito User Pool
export const listUsers = async () => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id, // Replace with your User Pool ID
      Limit: 60, // Increased limit to get more users
    };

    const data = await cognito.listUsers(params); // Call the listUsers API
    // console.log("List of users:", JSON.stringify(data.Users, null, 2)); // Log users to the console
    return data.Users; // Return the list of users
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

// Get detailed information about a specific user
export const getUserDetails = async (username) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id, // Replace with your User Pool ID
      Username: username,
    };

    const data = await cognito.adminGetUser(params); // Call the adminGetUser API
    console.log(`User details for ${username}:`, JSON.stringify(data, null, 2));
    return data; // Return the detailed user information
  } catch (error) {
    console.error(`Error fetching details for user ${username}:`, error);
    throw error;
  }
};

// Get user groups (if user belongs to any groups)
export const getUserGroups = async (username) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id,
      Username: username,
    };

    const data = await cognito.adminListGroupsForUser(params);
    console.log(
      `Groups for user ${username}:`,
      JSON.stringify(data.Groups, null, 2)
    );
    return data.Groups;
  } catch (error) {
    console.error(`Error fetching groups for user ${username}:`, error);
    throw error;
  }
};

// Get user's MFA settings
export const getUserMFASettings = async (username) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id,
      Username: username,
    };

    const data = await cognito.adminListUserAuthEvents(params);
    console.log(
      `Auth events for user ${username}:`,
      JSON.stringify(data.AuthEvents, null, 2)
    );
    return data.AuthEvents;
  } catch (error) {
    console.error(`Error fetching MFA settings for user ${username}:`, error);
    throw error;
  }
};

// Update the custom:user-role attribute for a user
export const updateUserRole = async (username, role) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id, // Replace with your User Pool ID
      Username: username,
      UserAttributes: [
        {
          Name: "custom:user_role",
          Value: role, // Role can be "admin" or "client"
        },
      ],
    };

    await cognito.adminUpdateUserAttributes(params); // Call the update API
    console.log(`User ${username} role updated to ${role}`);
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Enable or disable a user
export const setUserEnabled = async (username, enabled) => {
  try {
    const cognito = await configureCognitoClient();

    if (enabled) {
      const params = {
        UserPoolId: awsmobile.aws_user_pools_id,
        Username: username,
      };
      await cognito.adminEnableUser(params);
      console.log(`User ${username} has been enabled`);
    } else {
      const params = {
        UserPoolId: awsmobile.aws_user_pools_id,
        Username: username,
      };
      await cognito.adminDisableUser(params);
      console.log(`User ${username} has been disabled`);
    }
  } catch (error) {
    console.error(
      `Error ${enabled ? "enabling" : "disabling"} user ${username}:`,
      error
    );
    throw error;
  }
};

// Reset user password (force password reset on next login)
export const resetUserPassword = async (username) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id,
      Username: username,
    };

    await cognito.adminResetUserPassword(params);
    console.log(`Password reset initiated for user ${username}`);
  } catch (error) {
    console.error(`Error resetting password for user ${username}:`, error);
    throw error;
  }
};

// Delete a user from the user pool
export const deleteUser = async (username) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id,
      Username: username,
    };

    await cognito.adminDeleteUser(params);
    console.log(`User ${username} has been deleted`);
  } catch (error) {
    console.error(`Error deleting user ${username}:`, error);
    throw error;
  }
};

// Update user attributes
export const updateUserAttributes = async (username, attributes) => {
  try {
    const cognito = await configureCognitoClient();
    const params = {
      UserPoolId: awsmobile.aws_user_pools_id,
      Username: username,
      UserAttributes: attributes.map((attr) => ({
        Name: attr.name,
        Value: attr.value,
      })),
    };

    await cognito.adminUpdateUserAttributes(params);
    console.log(`User ${username} attributes updated successfully`);
  } catch (error) {
    console.error(`Error updating attributes for user ${username}:`, error);
    throw error;
  }
};

// Get comprehensive user information (combines multiple API calls)
export const getComprehensiveUserInfo = async (username) => {
  try {
    const [userDetails, userGroups] = await Promise.allSettled([
      getUserDetails(username),
      getUserGroups(username),
    ]);

    const result = {
      details: userDetails.status === "fulfilled" ? userDetails.value : null,
      groups: userGroups.status === "fulfilled" ? userGroups.value : [],
      errors: [],
    };

    if (userDetails.status === "rejected") {
      result.errors.push(
        `Failed to fetch user details: ${userDetails.reason.message}`
      );
    }

    if (userGroups.status === "rejected") {
      result.errors.push(
        `Failed to fetch user groups: ${userGroups.reason.message}`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Error fetching comprehensive user info for ${username}:`,
      error
    );
    throw error;
  }
};
