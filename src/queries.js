/**
 * queries.js - Optimized query functions for both BMS and PackController data
 */

import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "./aws-exports.js";

// Table names
const BMS_TABLE_NAME = "CAN_BMS_Data_Optimized";
const PACK_CONTROLLER_TABLE_NAME = "CAN_PackController_Data";

// Logging configuration
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;

const log = (level, message, data = null) => {
  if (level <= CURRENT_LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
    
    if (data) {
      console.log(`[${timestamp}] [${levelName}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${levelName}] ${message}`);
    }
  }
};

// Helper function to convert DynamoDB format to app format
const convertDynamoDBFormat = (item) => {
  if (!item) return item;

  if (!item.N && !item.S && !item.BOOL) {
    return item;
  }

  const converted = {};
  for (const [key, value] of Object.entries(item)) {
    if (value?.N !== undefined) {
      converted[key] = { N: value.N };
    } else if (value?.S !== undefined) {
      converted[key] = { S: value.S };
    } else if (value?.BOOL !== undefined) {
      converted[key] = { BOOL: value.BOOL };
    } else if (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      converted[key] = value;
    } else {
      converted[key] = value;
    }
  }
  return converted;
};

// Helper function to round a value to 2 decimal places
const roundToTwoDecimals = (value) => {
  if (typeof value === "number") {
    return parseFloat(value.toFixed(2));
  }
  return value;
};

// Initialize DynamoDB DocumentClient
export const initDynamoDB = async () => {
  try {
    const { credentials } = await fetchAuthSession();
    
    AWS.config.update({
      region: awsconfig.aws_project_region,
      credentials: AWS.Credentials(credentials),
    });

    return new AWS.DynamoDB.DocumentClient();
  } catch (error) {
    console.error("Error initializing DynamoDB:", error);
    throw error;
  }
};

// ============ BMS DATA FUNCTIONS ============

/**
 * Get the latest reading for a battery
 */
export const getLatestReading = async (docClient, batteryId) => {
  try {
    log(LOG_LEVELS.INFO, `Getting latest reading for battery: ${batteryId}`);
    
    const params = {
      TableName: BMS_TABLE_NAME,
      KeyConditionExpression: "TagID = :tid",
      ExpressionAttributeValues: {
        ":tid": batteryId,
      },
      Limit: 1,
      ScanIndexForward: false,
    };

    const result = await docClient.query(params).promise();
    
    if (result.Items.length > 0) {
      const item = result.Items[0];
      const convertedItem = {};

      for (const [key, value] of Object.entries(item)) {
        if (typeof value === "number") {
          convertedItem[key] = { N: value.toString() };
        } else if (typeof value === "string" && key !== "TagID") {
          if (!isNaN(value)) {
            convertedItem[key] = { N: value };
          } else {
            convertedItem[key] = { S: value };
          }
        } else {
          convertedItem[key] = value;
        }
      }

      return convertedItem;
    }

    return null;
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting latest reading for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Get data from the last day for a specific device
 */
export const getLastDayData = async (
  docClient,
  deviceId,
  attributes = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const dayKey = `${deviceId}_DAY`;

    const params = {
      TableName: BMS_TABLE_NAME,
      IndexName: "DayIndex",
      KeyConditionExpression: "TagID_TimeWindow_DAY = :dayKey AND #ts > :time",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":dayKey": dayKey,
        ":time": oneDayAgo,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp" && attr !== "TagID_TimeWindow_DAY") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last day data for ${deviceId}:`, error);
    throw error;
  }
};

// ============ PACK CONTROLLER DATA FUNCTIONS ============

/**
 * Get the latest PackController reading
 */
export const getLatestPackControllerReading = async (docClient, deviceId) => {
  try {
    log(LOG_LEVELS.INFO, `Getting latest PackController reading for device: ${deviceId}`);
    
    const params = {
      TableName: PACK_CONTROLLER_TABLE_NAME,
      IndexName: "LatestIndex",
      KeyConditionExpression: "LATEST = :latest AND #ts > :minTime",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":latest": "LATEST",
        ":minTime": 0,
        ":tid": deviceId,
      },
      FilterExpression: "TagID = :tid",
      Limit: 1,
      ScanIndexForward: false,
    };

    const result = await docClient.query(params).promise();

    if (result.Items.length > 0) {
      return convertDynamoDBFormat(result.Items[0]);
    }

    return null;
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting latest PackController reading for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get PackController data from the last day
 */
export const getLastDayPackControllerData = async (
  docClient,
  deviceId,
  attributes = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const dayKey = `${deviceId}_DAY`;

    const params = {
      TableName: PACK_CONTROLLER_TABLE_NAME,
      IndexName: "DayIndex",
      KeyConditionExpression: "TagID_TimeWindow_DAY = :dayKey AND #ts > :time",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":dayKey": dayKey,
        ":time": oneDayAgo,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp" && attr !== "TagID_TimeWindow_DAY") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last day PackController data for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get PackController data from the last week
 */
export const getLastWeekPackControllerData = async (
  docClient,
  deviceId,
  attributes = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 604800;
    const monthKey = `${deviceId}_MONTH`;

    const params = {
      TableName: PACK_CONTROLLER_TABLE_NAME,
      IndexName: "MonthIndex",
      KeyConditionExpression: "TagID_TimeWindow_MONTH = :monthKey AND #ts > :time",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":monthKey": monthKey,
        ":time": oneWeekAgo,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp" && attr !== "TagID_TimeWindow_MONTH") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last week PackController data for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get PackController data from the last month
 */
export const getLastMonthPackControllerData = async (
  docClient,
  deviceId,
  attributes = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneMonthAgo = now - 2592000; // 30 days
    const monthKey = `${deviceId}_MONTH`;

    const params = {
      TableName: PACK_CONTROLLER_TABLE_NAME,
      IndexName: "MonthIndex",
      KeyConditionExpression: "TagID_TimeWindow_MONTH = :monthKey AND #ts > :time",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":monthKey": monthKey,
        ":time": oneMonthAgo,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp" && attr !== "TagID_TimeWindow_MONTH") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last month PackController data for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get PackController alarm history
 */
export const getPackControllerAlarmHistory = async (
  docClient,
  deviceId,
  timeRange = "1day"
) => {
  try {
    log(LOG_LEVELS.INFO, `Getting PackController alarm history for device: ${deviceId}, timeRange: ${timeRange}`);
    
    let getData;
    switch (timeRange) {
      case "1day":
        getData = getLastDayPackControllerData;
        break;
      case "1week":
        getData = getLastWeekPackControllerData;
        break;
      case "1month":
        getData = getLastMonthPackControllerData;
        break;
      default:
        getData = getLastDayPackControllerData;
    }

    // Get alarm-related attributes
    const alarmAttributes = [
      "VictronAlarmContactor", "VictronAlarmShortCircuit", "VictronAlarmCellHighTempCharge",
      "VictronAlarmHighCurrent", "VictronAlarmCellLowTemp", "VictronAlarmBmsInternal",
      "VictronAlarmCellHighTemp", "VictronAlarmCellHighVoltage", "VictronAlarmCellLowVoltage",
      "VictronAlarmCellImbalance", "VictronAlarmChargeHighCurrent", "VictronAlarmGeneral",
      "VictronAlarmCellLowTempCharge", "VictronWarningCellLowTemp", "VictronWarningContactor",
      "VictronWarningGeneral", "VictronWarningCellHighTemp", "VictronWarningSystemStatus",
      "VictronWarningChargeHighCurrent", "VictronWarningHighCurrent", "VictronWarningCellLowVoltage",
      "VictronWarningBmsInternal", "VictronWarningCellChargeLowTemp", "VictronWarningShortCircuit",
      "VictronWarningCellHighVoltage", "VictronWarningCellImbalance", "VictronWarningCellChargeHighTemp",
      "ProtectionChargeOverCurrent", "ProtectionDischargeOverCurrent", "ProtectionSystemError",
      "ProtectionCellUnderVoltage", "ProtectionCellOverVoltage", "ProtectionCellUnderTemperature",
      "ProtectionCellOverTemperature", "AlarmCellLowVoltage", "AlarmCellHighVoltage",
      "AlarmCellLowTemperature", "AlarmInternalCommunicationFail", "AlarmDischargeHighCurrent",
      "AlarmChargeHighCurrent", "AlarmCellHighTemperature"
    ];

    const data = await getData(docClient, deviceId, alarmAttributes);
    
    // Process alarm data
    const alarmHistory = [];
    data.forEach(item => {
      const timestamp = parseInt(item.Timestamp?.N || item.Timestamp) * 1000;
      
      alarmAttributes.forEach(alarmKey => {
        const value = parseInt(item[alarmKey]?.N || item[alarmKey] || 0);
        if (value > 0) {
          alarmHistory.push({
            timestamp,
            alarmType: alarmKey,
            value,
            severity: getSeverityLevel(alarmKey),
            description: getAlarmDescription(alarmKey)
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    alarmHistory.sort((a, b) => b.timestamp - a.timestamp);

    return alarmHistory;
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting PackController alarm history for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get alarm severity level
 */
const getSeverityLevel = (alarmKey) => {
  if (alarmKey.includes("Critical") || alarmKey.includes("Protection")) {
    return "critical";
  } else if (alarmKey.includes("Alarm")) {
    return "high";
  } else if (alarmKey.includes("Warning")) {
    return "medium";
  }
  return "low";
};

/**
 * Get alarm description
 */
const getAlarmDescription = (alarmKey) => {
  const descriptions = {
    VictronAlarmContactor: "Contactor alarm",
    VictronAlarmShortCircuit: "Short circuit detected",
    VictronAlarmCellHighTempCharge: "Cell high temperature during charge",
    VictronAlarmHighCurrent: "High current alarm",
    VictronAlarmCellLowTemp: "Cell low temperature alarm",
    VictronAlarmBmsInternal: "BMS internal alarm",
    VictronAlarmCellHighTemp: "Cell high temperature alarm",
    VictronAlarmCellHighVoltage: "Cell high voltage alarm",
    VictronAlarmCellLowVoltage: "Cell low voltage alarm",
    VictronAlarmCellImbalance: "Cell imbalance alarm",
    VictronAlarmChargeHighCurrent: "Charge high current alarm",
    VictronAlarmGeneral: "General alarm",
    VictronAlarmCellLowTempCharge: "Cell low temperature during charge",
    VictronWarningCellLowTemp: "Cell low temperature warning",
    VictronWarningContactor: "Contactor warning",
    VictronWarningGeneral: "General warning",
    VictronWarningCellHighTemp: "Cell high temperature warning",
    VictronWarningSystemStatus: "System status warning",
    VictronWarningChargeHighCurrent: "Charge high current warning",
    VictronWarningHighCurrent: "High current warning",
    VictronWarningCellLowVoltage: "Cell low voltage warning",
    VictronWarningBmsInternal: "BMS internal warning",
    VictronWarningCellChargeLowTemp: "Cell charge low temperature warning",
    VictronWarningShortCircuit: "Short circuit warning",
    VictronWarningCellHighVoltage: "Cell high voltage warning",
    VictronWarningCellImbalance: "Cell imbalance warning",
    VictronWarningCellChargeHighTemp: "Cell charge high temperature warning",
    ProtectionChargeOverCurrent: "Charge over-current protection",
    ProtectionDischargeOverCurrent: "Discharge over-current protection",
    ProtectionSystemError: "System error protection",
    ProtectionCellUnderVoltage: "Cell under-voltage protection",
    ProtectionCellOverVoltage: "Cell over-voltage protection",
    ProtectionCellUnderTemperature: "Cell under-temperature protection",
    ProtectionCellOverTemperature: "Cell over-temperature protection",
    AlarmCellLowVoltage: "Cell low voltage alarm",
    AlarmCellHighVoltage: "Cell high voltage alarm",
    AlarmCellLowTemperature: "Cell low temperature alarm",
    AlarmInternalCommunicationFail: "Internal communication failure",
    AlarmDischargeHighCurrent: "Discharge high current alarm",
    AlarmChargeHighCurrent: "Charge high current alarm",
    AlarmCellHighTemperature: "Cell high temperature alarm"
  };
  
  return descriptions[alarmKey] || alarmKey.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Get data from the last minute for a specific battery
 */
export const getLastMinuteData = async (
  docClient,
  batteryId,
  attributes = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneMinuteAgo = now - 60;
    
    log(LOG_LEVELS.INFO, `Getting last minute data for battery: ${batteryId}`, {
      startTime: new Date(oneMinuteAgo * 1000).toISOString(),
      endTime: new Date(now * 1000).toISOString()
    });

    const params = {
      TableName: BMS_TABLE_NAME,
      KeyConditionExpression: "TagID = :tid AND #ts > :time",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":tid": batteryId,
        ":time": oneMinuteAgo,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    
    log(LOG_LEVELS.DEBUG, `Last minute query returned ${result.Items.length} items`);

    return result.Items.map((item) => {
      const convertedItem = {};
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === "number") {
          convertedItem[key] = { N: value.toString() };
        } else if (typeof value === "string" && key !== "TagID") {
          if (!isNaN(value)) {
            convertedItem[key] = { N: value };
          } else {
            convertedItem[key] = { S: value };
          }
        } else {
          convertedItem[key] = value;
        }
      }
      return convertedItem;
    });
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last minute data for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Get data for a custom time range
 */
export const getTimeRangeData = async (
  docClient,
  batteryId,
  startTime,
  endTime,
  attributes = null
) => {
  try {
    log(LOG_LEVELS.INFO, `Getting time range data for battery: ${batteryId}`, {
      startTime: new Date(startTime * 1000).toISOString(),
      endTime: new Date(endTime * 1000).toISOString(),
      duration: `${(endTime - startTime) / 60} minutes`
    });

    const params = {
      TableName: BMS_TABLE_NAME,
      KeyConditionExpression: "TagID = :tid AND #ts BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      ExpressionAttributeValues: {
        ":tid": batteryId,
        ":start": startTime,
        ":end": endTime,
      },
    };

    if (attributes && attributes.length > 0) {
      const attrNames = {};
      attributes.forEach((attr, index) => {
        if (attr !== "TagID" && attr !== "Timestamp") {
          attrNames[`#attr${index}`] = attr;
        }
      });

      if (Object.keys(attrNames).length > 0) {
        params.ExpressionAttributeNames = {
          ...params.ExpressionAttributeNames,
          ...attrNames,
        };

        const projectionItems = ["TagID", "#ts"];
        Object.keys(attrNames).forEach((key) => {
          projectionItems.push(key);
        });

        params.ProjectionExpression = projectionItems.join(", ");
      }
    }

    const result = await docClient.query(params).promise();
    
    log(LOG_LEVELS.DEBUG, `Time range query returned ${result.Items.length} items`);
    
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting time range data for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Main data fetching function - consolidated from DataFetcher.js
 */
export const fetchData = async (selectedTagId, selectedTimeRange) => {
  try {
    log(LOG_LEVELS.INFO, `Starting fetchData for TagId: ${selectedTagId}, TimeRange: ${selectedTimeRange}`);
    
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error("No credentials available");
    }

    const docClient = new AWS.DynamoDB.DocumentClient({
      apiVersion: "2012-10-17",
      region: awsconfig.region || awsconfig.aws_project_region,
      credentials,
    });

    const batteryId = `BAT-${selectedTagId}`;
    let fetchedData = [];

    // Use the optimized queries based on time range
    switch (selectedTimeRange) {
      case "1min":
        fetchedData = await getLastMinuteData(docClient, batteryId);
        break;
      case "5min":
        const fiveMinAgo = Math.floor(Date.now() / 1000) - 300;
        const now = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          fiveMinAgo,
          now
        );
        break;
      case "1hour":
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const currentTime = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          oneHourAgo,
          currentTime
        );
        break;
      case "8hours":
        const eightHoursAgo = Math.floor(Date.now() / 1000) - 28800;
        const currentTimeEight = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          eightHoursAgo,
          currentTimeEight
        );
        break;
      case "1day":
        fetchedData = await getLastDayData(docClient, batteryId);
        break;
      case "1month":
        const oneMonthAgo = Math.floor(Date.now() / 1000) - 2592000;
        const currentTimeMonth = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          oneMonthAgo,
          currentTimeMonth
        );
        break;
      default:
        const defaultOneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const defaultCurrentTime = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          defaultOneHourAgo,
          defaultCurrentTime
        );
    }

    log(LOG_LEVELS.INFO, `Fetched ${fetchedData.length} items for ${batteryId}`);

    if (!fetchedData || fetchedData.length === 0) {
      log(LOG_LEVELS.WARN, `No data found for ${batteryId} in time range ${selectedTimeRange}`);
      return {
        error: "No data found",
        batteryId,
        timeRange: selectedTimeRange,
        Node0: {
          voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
          temperature: {},
        },
        Node1: {
          voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
          temperature: {},
        },
        Pack: {},
        Cell: {},
        Temperature: {},
        SOC: {},
      };
    }

    // Initialize structured data
    const structuredData = {
      Node0: {
        voltage: {
          cellVoltages: Array.from({ length: 14 }, () => []),
        },
        temperature: {},
      },
      Node1: {
        voltage: {
          cellVoltages: Array.from({ length: 14 }, () => []),
        },
        temperature: {},
      },
      Pack: {},
      Cell: {},
      Temperature: {},
      SOC: {},
    };

    // Process fetched data (simplified for brevity)
    fetchedData.forEach((item) => {
      // Process data items as needed
      // This is a simplified version - you may need to add your specific processing logic
    });

    log(LOG_LEVELS.INFO, `Successfully processed data for ${batteryId}`);
    return structuredData;
  } catch (error) {
    log(LOG_LEVELS.ERROR, "Error in fetchData:", error);
    throw error;
  }
};

// Battery anomalies functions
export const getBatteryAnomalies = async (docClient, batteryId, limit = 50) => {
  try {
    log(LOG_LEVELS.INFO, `Getting battery anomalies for: ${batteryId}, limit: ${limit}`);
    
    const queryParams = {
      TableName: "BatteryAnomalies_EC2",
      IndexName: "tag_id-timestamp-index",
      KeyConditionExpression: "tag_id = :batteryId",
      ExpressionAttributeValues: {
        ":batteryId": batteryId,
      },
      ScanIndexForward: false,
      Limit: limit,
    };

    const scanParams = {
      TableName: "BatteryAnomalies_EC2",
      FilterExpression: "tag_id = :batteryId",
      ExpressionAttributeValues: {
        ":batteryId": batteryId,
      },
      Limit: limit,
    };

    let result;
    try {
      result = await docClient.query(queryParams).promise();
      log(LOG_LEVELS.DEBUG, `Anomalies query returned ${result.Items.length} items`);
    } catch (queryError) {
      log(LOG_LEVELS.WARN, `Query failed, falling back to scan`, queryError);
      result = await docClient.scan(scanParams).promise();
    }

    const formattedAnomalies = result.Items.map((item) => ({
      id: item.id,
      timestamp: parseInt(item.timestamp) * 1000,
      anomaly_score: parseFloat(item.anomaly_score),
      detection_time: item.detection_time,
      MaxCellTemp: parseFloat(item.MaxCellTemp),
      MaximumCellVoltage: parseFloat(item.MaximumCellVoltage),
      MinCellTemp: parseFloat(item.MinCellTemp),
      MinimumCellVoltage: parseFloat(item.MinimumCellVoltage),
      SOCAh: parseFloat(item.SOCAh),
      SOCPercent: parseFloat(item.SOCPercent),
      tag_id: item.tag_id,
      TotalBattVoltage: parseFloat(item.TotalBattVoltage),
      TotalCurrent: parseFloat(item.TotalCurrent),
    }));

    formattedAnomalies.sort((a, b) => b.timestamp - a.timestamp);

    return {
      success: true,
      data: formattedAnomalies,
      count: formattedAnomalies.length,
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, "Error fetching battery anomalies:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0,
    };
  }
};

export const getAllBatteryAnomalies = async (docClient, limit = 50) => {
  try {
    log(LOG_LEVELS.INFO, `Getting all battery anomalies, limit: ${limit}`);
    
    const scanParams = {
      TableName: "BatteryAnomalies_EC2",
      Limit: limit,
    };

    const result = await docClient.scan(scanParams).promise();
    
    log(LOG_LEVELS.DEBUG, `All anomalies scan returned ${result.Items.length} items`);

    const formattedAnomalies = result.Items.map((item) => ({
      id: item.id,
      timestamp: parseInt(item.timestamp) * 1000,
      anomaly_score: parseFloat(item.anomaly_score),
      detection_time: item.detection_time,
      MaxCellTemp: parseFloat(item.MaxCellTemp),
      MaximumCellVoltage: parseFloat(item.MaximumCellVoltage),
      MinCellTemp: parseFloat(item.MinCellTemp),
      MinimumCellVoltage: parseFloat(item.MinimumCellVoltage),
      SOCAh: parseFloat(item.SOCAh),
      SOCPercent: parseFloat(item.SOCPercent),
      tag_id: item.tag_id,
      TotalBattVoltage: parseFloat(item.TotalBattVoltage),
      TotalCurrent: parseFloat(item.TotalCurrent),
    }));

    formattedAnomalies.sort((a, b) => b.timestamp - a.timestamp);

    return {
      success: true,
      data: formattedAnomalies,
      count: formattedAnomalies.length,
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, "Error fetching all battery anomalies:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0,
    };
  }
};

export const getAvailableBatteryIds = async (docClient) => {
  try {
    log(LOG_LEVELS.INFO, `Getting available battery IDs`);
    
    const params = {
      TableName: "BatteryAnomalies_EC2",
      ProjectionExpression: "tag_id",
    };

    const result = await docClient.scan(params).promise();
    const uniqueIds = [...new Set(result.Items.map((item) => item.tag_id))];
    
    log(LOG_LEVELS.DEBUG, `Found ${uniqueIds.length} unique battery IDs`);

    return {
      success: true,
      data: uniqueIds.sort(),
      count: uniqueIds.length,
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, "Error fetching available battery IDs:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0,
    };
  }
};

// Legacy function names for backward compatibility
export const getLatestReadingMinimal = async (docClient, batteryId) => {
  return getLatestReading(docClient, batteryId);
};

export const getLastInsertedData = async (docClient, tableName, tagID) => {
  return getLatestReading(docClient, tagID);
};

export const getDataByTagAndTimestamp = async (
  docClient,
  tableName,
  tagID,
  startTime,
  endTime
) => {
  return getTimeRangeData(docClient, tagID, startTime, endTime);
};

export const getDataByTimestamp = async (
  docClient,
  tableName,
  tagID,
  timestamp
) => {
  return getTimeRangeData(docClient, tagID, timestamp, timestamp);
};