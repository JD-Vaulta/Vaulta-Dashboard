// src/services/batteryRegistrationService.js
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import AWS from 'aws-sdk';

// Logging configuration - set to false to disable logs
const ENABLE_LOGGING = true;
const LOG_PREFIX = '[BatteryRegistrationService]';

const log = (...args) => {
  if (ENABLE_LOGGING) {
    console.log(LOG_PREFIX, ...args);
  }
};

const logError = (...args) => {
  if (ENABLE_LOGGING) {
    console.error(LOG_PREFIX, ...args);
  }
};

const logWarn = (...args) => {
  if (ENABLE_LOGGING) {
    console.warn(LOG_PREFIX, ...args);
  }
};

// Lambda function names - update these with your actual function names
const LAMBDA_FUNCTIONS = {
  REGISTER_BATTERY: 'registerBattery',
  GET_USER_BATTERIES: 'getUserBatteries',
  MANAGE_BATTERY: 'manageBattery'
};

class BatteryRegistrationService {
  constructor() {
    this.lambdaClient = null;
    this.currentUser = null;
    this.initializeAttempted = false;
    log('Service initialized');
  }

  async initialize() {
    if (this.initializeAttempted) {
      log('Initialize already attempted, skipping...');
      return this.lambdaClient !== null;
    }

    this.initializeAttempted = true;
    log('Initializing AWS Lambda client...');

    try {
      // Get current user
      this.currentUser = await getCurrentUser();
      log('Current user retrieved:', { 
        userId: this.currentUser.userId,
        username: this.currentUser.username 
      });

      // Get AWS credentials
      const session = await fetchAuthSession();
      const credentials = session.credentials;
      log('AWS credentials retrieved');

      // Initialize Lambda client
      this.lambdaClient = new AWS.Lambda({
        region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      log('Lambda client initialized successfully');
      return true;
    } catch (error) {
      logError('Failed to initialize service:', error);
      return false;
    }
  }

  async invokeLambda(functionName, payload) {
    log(`Invoking Lambda function: ${functionName}`);
    log('Payload:', payload);

    if (!this.lambdaClient) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize AWS services');
      }
    }

    try {
      const params = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
      };

      log('Lambda invocation params:', params);

      const result = await this.lambdaClient.invoke(params).promise();
      log('Lambda raw response:', result);

      // Parse the response
      const response = JSON.parse(result.Payload);
      log('Lambda parsed response:', response);

      if (response.statusCode !== 200) {
        const errorBody = JSON.parse(response.body);
        logError('Lambda function returned error:', errorBody);
        throw new Error(errorBody.error || 'Lambda function failed');
      }

      const successBody = JSON.parse(response.body);
      log('Lambda success response body:', successBody);
      return successBody;
    } catch (error) {
      logError(`Lambda invocation failed for ${functionName}:`, error);
      throw error;
    }
  }

  async registerBattery(serialNumber, batteryId, nickname = '') {
    log('Registering battery:', { serialNumber, batteryId, nickname });

    // Input validation
    if (!serialNumber || !batteryId) {
      logError('Missing required fields:', { serialNumber, batteryId });
      throw new Error('Serial number and battery ID are required');
    }

    // Ensure user is available
    if (!this.currentUser) {
      await this.initialize();
    }

    const payload = {
      body: JSON.stringify({
        userId: this.currentUser.userId,
        serialNumber: serialNumber.trim(),
        batteryId: batteryId.trim(),
        nickname: nickname.trim(),
      }),
    };

    try {
      const response = await this.invokeLambda(LAMBDA_FUNCTIONS.REGISTER_BATTERY, payload);
      log('Battery registration successful:', response);
      return response;
    } catch (error) {
      logError('Battery registration failed:', error);
      throw error;
    }
  }

  async getUserBatteries() {
    log('Fetching user batteries...');

    // Ensure user is available
    if (!this.currentUser) {
      await this.initialize();
    }

    const payload = {
      body: JSON.stringify({
        userId: this.currentUser.userId,
      }),
    };

    try {
      const response = await this.invokeLambda(LAMBDA_FUNCTIONS.GET_USER_BATTERIES, payload);
      log('User batteries retrieved:', response);
      return response.batteries || [];
    } catch (error) {
      logError('Failed to fetch user batteries:', error);
      throw error;
    }
  }

  async deactivateBattery(registrationId) {
    log('Deactivating battery:', { registrationId });

    if (!registrationId) {
      logError('Missing registration ID');
      throw new Error('Registration ID is required');
    }

    // Ensure user is available
    if (!this.currentUser) {
      await this.initialize();
    }

    const payload = {
      body: JSON.stringify({
        userId: this.currentUser.userId,
        registrationId,
        action: 'deactivate',
      }),
    };

    try {
      const response = await this.invokeLambda(LAMBDA_FUNCTIONS.MANAGE_BATTERY, payload);
      log('Battery deactivation successful:', response);
      return response;
    } catch (error) {
      logError('Battery deactivation failed:', error);
      throw error;
    }
  }

  async validateBatteryAccess(batteryId) {
    log('Validating battery access:', { batteryId });

    try {
      const userBatteries = await this.getUserBatteries();
      const hasAccess = userBatteries.some(
        battery => battery.batteryId === batteryId && battery.isActive
      );

      log('Battery access validation result:', { batteryId, hasAccess });
      return hasAccess;
    } catch (error) {
      logError('Battery access validation failed:', error);
      return false;
    }
  }

  // Utility method to get available battery IDs for dropdowns
  async getAvailableBatteryIds() {
    log('Getting available battery IDs for user...');

    try {
      const userBatteries = await this.getUserBatteries();
      const activeBatteries = userBatteries.filter(battery => battery.isActive);
      const batteryIds = activeBatteries.map(battery => battery.batteryId);
      
      log('Available battery IDs:', batteryIds);
      return batteryIds;
    } catch (error) {
      logError('Failed to get available battery IDs:', error);
      return [];
    }
  }

  // Utility method to get battery options for dropdowns
  async getBatteryOptions() {
    log('Getting battery options for dropdowns...');

    try {
      const userBatteries = await this.getUserBatteries();
      const activeBatteries = userBatteries.filter(battery => battery.isActive);
      
      const options = activeBatteries.map(battery => ({
        value: battery.batteryId,
        label: battery.nickname || battery.batteryId,
        serialNumber: battery.serialNumber,
        registrationId: battery.registrationId,
        registrationDate: battery.registrationDate,
      }));

      log('Battery options:', options);
      return options;
    } catch (error) {
      logError('Failed to get battery options:', error);
      return [];
    }
  }
}

// Create singleton instance
const batteryRegistrationService = new BatteryRegistrationService();

export default batteryRegistrationService;

// Named exports for specific functions
export const {
  registerBattery: registerBatteryService,
  getUserBatteries: getUserBatteriesService,
  deactivateBattery: deactivateBatteryService,
  validateBatteryAccess: validateBatteryAccessService,
  getAvailableBatteryIds: getAvailableBatteryIdsService,
  getBatteryOptions: getBatteryOptionsService,
} = batteryRegistrationService;