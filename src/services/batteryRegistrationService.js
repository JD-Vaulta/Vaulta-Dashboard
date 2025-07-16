import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { fetchAuthSession } from 'aws-amplify/auth';
import awsconfig from "../aws-exports.js";

// Configurable logging - set to false to disable logs
const ENABLE_LOGGING = true;

const log = (...args) => {
  if (ENABLE_LOGGING) {
    console.log('[BatteryRegistration]', ...args);
  }
};

const logError = (...args) => {
  if (ENABLE_LOGGING) {
    console.error('[BatteryRegistration]', ...args);
  }
};

// Initialize Lambda client with Amplify credentials
const getLambdaClient = async () => {
  try {
    // Get credentials from the current Amplify session
    const session = await fetchAuthSession();
    
    if (!session.credentials) {
      throw new Error('No credentials available from Amplify session');
    }

    log('Creating Lambda client with Amplify credentials');
    
    return new LambdaClient({
      region: awsconfig.aws_project_region,
      credentials: {
        accessKeyId: session.credentials.accessKeyId,
        secretAccessKey: session.credentials.secretAccessKey,
        sessionToken: session.credentials.sessionToken,
      },
    });
  } catch (error) {
    logError('Error getting Amplify credentials:', error);
    throw new Error('Failed to authenticate with AWS. Please ensure you are logged in.');
  }
};

// Lambda function ARNs - Add these to your .env file
const LAMBDA_ARNS = {
  registerBattery: process.env.REACT_APP_REGISTER_BATTERY_LAMBDA_ARN,
  getUserBatteries: process.env.REACT_APP_GET_BATTERIES_LAMBDA_ARN,
  manageBattery: process.env.REACT_APP_MANAGE_BATTERY_LAMBDA_ARN,
};

// Get current user ID from session
const getCurrentUserId = async () => {
  try {
    const session = await fetchAuthSession();
    // Get user ID from the identity ID (Cognito Identity Pool)
    return session.userSub || null;
  } catch (error) {
    logError('Error getting user ID:', error);
    return null;
  }
};

// Helper function to invoke Lambda functions
const invokeLambda = async (functionArn, payload) => {
  try {
    const client = await getLambdaClient();
    
    // Add user ID to payload
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Unable to get user ID from session');
    }
    
    const enrichedPayload = {
      userId: userId,
      ...payload
    };
    
    const command = new InvokeCommand({
      FunctionName: functionArn,
      Payload: JSON.stringify(enrichedPayload),
    });

    log('Invoking Lambda:', functionArn, 'with payload:', enrichedPayload);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.Payload));
    log('Lambda response:', responseBody);
    
    if (response.StatusCode !== 200) {
      throw new Error(`Lambda invocation failed with status: ${response.StatusCode}`);
    }

    if (responseBody.statusCode && responseBody.statusCode !== 200) {
      throw new Error(responseBody.body || 'Lambda function returned error');
    }

    return responseBody;
  } catch (error) {
    logError('Lambda invocation error:', error);
    throw error;
  }
};

// Register a new battery
export const registerBattery = async (serialNumber, batteryId, nickname = null) => {
  try {
    log('Registering battery:', { serialNumber, batteryId, nickname });
    
    const payload = {
      serialNumber: serialNumber.trim(),
      batteryId: batteryId.trim(),
      nickname: nickname ? nickname.trim() : null,
    };

    const response = await invokeLambda(LAMBDA_ARNS.registerBattery, payload);
    
    log('Battery registered successfully:', response);
    return {
      success: true,
      data: response.body || response,
      message: 'Battery registered successfully'
    };
  } catch (error) {
    logError('Error registering battery:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to register battery'
    };
  }
};

// Get user's registered batteries
export const getUserBatteries = async () => {
  try {
    log('Fetching user batteries...');
    
    // Send empty payload - userId will be added by invokeLambda
    const response = await invokeLambda(LAMBDA_ARNS.getUserBatteries, {});
    
    // Handle different response formats
    let batteries = [];
    if (response.body) {
      // If body is a string, try to parse it
      if (typeof response.body === 'string') {
        try {
          const parsedBody = JSON.parse(response.body);
          batteries = parsedBody.batteries || parsedBody || [];
        } catch (e) {
          batteries = [];
        }
      } else {
        // Body is already an object
        batteries = response.body.batteries || response.body || [];
      }
    } else {
      // Response is the data directly
      batteries = response.batteries || response || [];
    }
    
    log('User batteries fetched:', batteries);
    
    return {
      success: true,
      data: Array.isArray(batteries) ? batteries : [],
      message: 'Batteries fetched successfully'
    };
  } catch (error) {
    logError('Error fetching user batteries:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      message: 'Failed to fetch batteries'
    };
  }
};

// Deactivate a battery registration
export const deactivateBattery = async (registrationId) => {
  try {
    log('Deactivating battery:', registrationId);
    
    const payload = {
      action: 'deactivate',
      registrationId: registrationId,
    };

    const response = await invokeLambda(LAMBDA_ARNS.manageBattery, payload);
    
    log('Battery deactivated successfully:', response);
    return {
      success: true,
      data: response.body || response,
      message: 'Battery deactivated successfully'
    };
  } catch (error) {
    logError('Error deactivating battery:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to deactivate battery'
    };
  }
};

// Validate if user has access to a specific battery
export const validateBatteryAccess = async (batteryId) => {
  try {
    log('Validating battery access for:', batteryId);
    
    const batteriesResult = await getUserBatteries();
    if (!batteriesResult.success) {
      return false;
    }

    const hasAccess = batteriesResult.data.some(
      battery => battery.batteryId === batteryId && battery.isActive
    );
    
    log('Battery access validation result:', hasAccess);
    return hasAccess;
  } catch (error) {
    logError('Error validating battery access:', error);
    return false;
  }
};

// Format battery for dropdown display
export const formatBatteryForDisplay = (battery) => {
  const displayName = battery.nickname 
    ? `${battery.nickname} (${battery.batteryId})`
    : `${battery.serialNumber} - ${battery.batteryId}`;
    
  return {
    value: battery.batteryId,
    label: displayName,
    ...battery
  };
};

// Test AWS connection
export const testAWSConnection = async () => {
  try {
    const client = await getLambdaClient();
    log("AWS SDK initialized successfully with Amplify credentials");
    return true;
  } catch (error) {
    logError("AWS SDK initialization failed:", error);
    return false;
  }
};

// Export logging control
export const setBatteryLogging = (enabled) => {
  // Note: This will only affect new calls, not existing closures
  global.BATTERY_LOGGING_ENABLED = enabled;
};

// Export getCurrentUserId for use in other components
export { getCurrentUserId };