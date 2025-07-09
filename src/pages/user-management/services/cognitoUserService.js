import { fetchAuthSession } from "aws-amplify/auth";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import awsmobile from "../../../aws-exports.js";

// Configure the Cognito client with Amplify credentials
const configureCognitoClient = async () => {
  try {
    const { credentials } = await fetchAuthSession();
    const { accessKeyId, secretAccessKey, sessionToken } = credentials;

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

export const cognitoUserService = {
  // List users from Cognito User Pool
  listUsers: async () => {
    try {
      const cognito = await configureCognitoClient();
      const params = {
        UserPoolId: awsmobile.aws_user_pools_id,
        Limit: 60,
      };

      const data = await cognito.listUsers(params);
      return data.Users;
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  },

  // Get detailed information about a specific user
  getUserDetails: async (username) => {
    try {
      const cognito = await configureCognitoClient();
      const params = {
        UserPoolId: awsmobile.aws_user_pools_id,
        Username: username,
      };

      const data = await cognito.adminGetUser(params);
      console.log(
        `User details for ${username}:`,
        JSON.stringify(data, null, 2)
      );
      return data;
    } catch (error) {
      console.error(`Error fetching details for user ${username}:`, error);
      throw error;
    }
  },

  // Update the custom:user-role attribute for a user
  updateUserRole: async (username, role) => {
    try {
      const cognito = await configureCognitoClient();
      const params = {
        UserPoolId: awsmobile.aws_user_pools_id,
        Username: username,
        UserAttributes: [
          {
            Name: "custom:user_role",
            Value: role,
          },
        ],
      };

      await cognito.adminUpdateUserAttributes(params);
      console.log(`User ${username} role updated to ${role}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // Get user groups (if user belongs to any groups)
  getUserGroups: async (username) => {
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
  },

  // Enable or disable a user
  setUserEnabled: async (username, enabled) => {
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
  },

  // Reset user password (force password reset on next login)
  resetUserPassword: async (username) => {
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
  },

  // Delete a user from the user pool
  deleteUser: async (username) => {
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
  },
};
