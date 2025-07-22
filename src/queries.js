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

// Helper function to safely extract value from DynamoDB format
const safeExtractValue = (value) => {
  if (value === null || value === undefined) return null;
  // If it's a DynamoDB format object with N, S, etc.
  if (typeof value === "object" && value.N) return parseFloat(value.N);
  if (typeof value === "object" && value.S) return value.S;
  // Otherwise return the value directly
  return value;
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

// Process raw DynamoDB data into structured format with progressive optimization
const processDataItems = (items, isProgressive = false) => {
  log(LOG_LEVELS.DEBUG, `Processing ${items.length} data items${isProgressive ? ' (progressive)' : ''}`);

  const structuredData = {
    Node0: {
      voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
      temperature: {},
    },
    Node1: {
      voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
      temperature: {},
    },
    Pack: {
      totalBattVoltage: 0,
      totalLoadVoltage: 0,
      totalCurrent: 0,
    },
    Cell: {
      maxCellVoltage: 0,
      minCellVoltage: 0,
      thresholdOverVoltage: 0,
      thresholdUnderVoltage: 0,
    },
    Temperature: {
      maxCellTemp: 0,
      minCellTemp: 0,
      thresholdOverTemp: 0,
      thresholdUnderTemp: 0,
      maxCellTempNode: 0,
      minCellTempNode: 0,
    },
    SOC: {
      socPercent: 0,
      balanceSOCPercent: 0,
    },
  };

  if (items.length === 0) {
    return structuredData;
  }

  // Sort items by timestamp
  items.sort((a, b) => {
    const timestampA = safeExtractValue(a.Timestamp) || 0;
    const timestampB = safeExtractValue(b.Timestamp) || 0;
    return timestampA - timestampB;
  });

  // Initialize temperature sensor tracking
  const tempSensors = {
    Node0: new Set(),
    Node1: new Set()
  };

  // For progressive loading, we may want to sample the data to prevent overwhelming the UI
  let processItems = items;
  if (isProgressive && items.length > 2000) {
    // Sample every nth item for progressive display to keep UI responsive
    const step = Math.ceil(items.length / 2000);
    processItems = items.filter((_, index) => index % step === 0);
    log(LOG_LEVELS.DEBUG, `Progressive sampling: using ${processItems.length} of ${items.length} items`);
  }

  // Process each item
  processItems.forEach((item, index) => {
    // Extract pack data from latest item (always use latest values)
    if (index === processItems.length - 1) {
      structuredData.Pack.totalBattVoltage = safeExtractValue(item.TotalBattVoltage) || 0;
      structuredData.Pack.totalLoadVoltage = safeExtractValue(item.TotalLoadVoltage) || 0;
      structuredData.Pack.totalCurrent = safeExtractValue(item.TotalCurrent) || 0;

      // Cell data
      structuredData.Cell.maxCellVoltage = safeExtractValue(item.MaximumCellVoltage) || 0;
      structuredData.Cell.minCellVoltage = safeExtractValue(item.MinimumCellVoltage) || 0;
      structuredData.Cell.thresholdOverVoltage = safeExtractValue(item.CellThresholdOverVoltage) || 0;
      structuredData.Cell.thresholdUnderVoltage = safeExtractValue(item.CellThresholdUnderVoltage) || 0;

      // Temperature data
      structuredData.Temperature.maxCellTemp = safeExtractValue(item.MaxCellTemp) || 0;
      structuredData.Temperature.minCellTemp = safeExtractValue(item.MinCellTemp) || 0;
      structuredData.Temperature.thresholdOverTemp = safeExtractValue(item.TempThresholdOverTemp) || 0;
      structuredData.Temperature.thresholdUnderTemp = safeExtractValue(item.TempThresholdUnderTemp) || 0;
      structuredData.Temperature.maxCellTempNode = safeExtractValue(item.MaxCellTempNode) || 0;
      structuredData.Temperature.minCellTempNode = safeExtractValue(item.MinCellTempNode) || 0;

      // SOC data
      structuredData.SOC.socPercent = safeExtractValue(item.SOCPercent) || 0;
      structuredData.SOC.balanceSOCPercent = safeExtractValue(item.BalanceSOCPercent) || 0;
    }

    // Process Node 0 cell voltages
    for (let cellIndex = 0; cellIndex < 14; cellIndex++) {
      const cellKey = `Node00Cell${cellIndex.toString().padStart(2, '0')}`;
      const cellValue = safeExtractValue(item[cellKey]);
      if (cellValue !== null && cellValue !== undefined && cellValue > 0) {
        structuredData.Node0.voltage.cellVoltages[cellIndex].push(cellValue);
      }
    }

    // Process Node 1 cell voltages
    for (let cellIndex = 0; cellIndex < 14; cellIndex++) {
      const cellKey = `Node01Cell${cellIndex.toString().padStart(2, '0')}`;
      const cellValue = safeExtractValue(item[cellKey]);
      if (cellValue !== null && cellValue !== undefined && cellValue > 0) {
        structuredData.Node1.voltage.cellVoltages[cellIndex].push(cellValue);
      }
    }

    // Process Node 0 temperatures
    for (let tempIndex = 0; tempIndex < 10; tempIndex++) {
      const tempKey = `Node00Temp${tempIndex.toString().padStart(2, '0')}`;
      const tempValue = safeExtractValue(item[tempKey]);
      if (tempValue !== null && tempValue !== undefined && tempValue > 0) {
        const sensorName = `Temp${tempIndex.toString().padStart(2, '0')}`;
        if (!structuredData.Node0.temperature[sensorName]) {
          structuredData.Node0.temperature[sensorName] = [];
        }
        structuredData.Node0.temperature[sensorName].push(tempValue);
        tempSensors.Node0.add(sensorName);
      }
    }

    // Process Node 1 temperatures
    for (let tempIndex = 0; tempIndex < 10; tempIndex++) {
      const tempKey = `Node01Temp${tempIndex.toString().padStart(2, '0')}`;
      const tempValue = safeExtractValue(item[tempKey]);
      if (tempValue !== null && tempValue !== undefined && tempValue > 0) {
        const sensorName = `Temp${tempIndex.toString().padStart(2, '0')}`;
        if (!structuredData.Node1.temperature[sensorName]) {
          structuredData.Node1.temperature[sensorName] = [];
        }
        structuredData.Node1.temperature[sensorName].push(tempValue);
        tempSensors.Node1.add(sensorName);
      }
    }
  });

  log(LOG_LEVELS.DEBUG, `Processed data structure:`, {
    node0CellArrays: structuredData.Node0.voltage.cellVoltages.filter(arr => arr.length > 0).length,
    node1CellArrays: structuredData.Node1.voltage.cellVoltages.filter(arr => arr.length > 0).length,
    node0TempSensors: tempSensors.Node0.size,
    node1TempSensors: tempSensors.Node1.size,
    totalItems: processItems.length,
    originalItems: items.length,
    isProgressive: isProgressive
  });

  return structuredData;
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
 * Get data with pagination support
 */
export const getDataWithPagination = async (
  docClient,
  batteryId,
  startTime,
  endTime,
  progressCallback = null,
  attributes = null
) => {
  try {
    log(LOG_LEVELS.INFO, `Getting paginated data for battery: ${batteryId}`, {
      startTime: new Date(startTime * 1000).toISOString(),
      endTime: new Date(endTime * 1000).toISOString(),
      duration: `${(endTime - startTime) / 60} minutes`,
      batteryId: batteryId
    });

    let allItems = [];
    let lastEvaluatedKey = null;
    let pageCount = 0;
    const maxPages = 50; // Prevent infinite loops

    do {
      pageCount++;
      
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
        Limit: 1000, // DynamoDB's default limit
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

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

      log(LOG_LEVELS.DEBUG, `Fetching page ${pageCount} with params:`, { 
        hasLastKey: !!lastEvaluatedKey,
        limit: params.Limit,
        batteryId: params.ExpressionAttributeValues[":tid"],
        startTime: new Date(params.ExpressionAttributeValues[":start"] * 1000).toISOString(),
        endTime: new Date(params.ExpressionAttributeValues[":end"] * 1000).toISOString()
      });

      const result = await docClient.query(params).promise();
      
      allItems = allItems.concat(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;

      log(LOG_LEVELS.INFO, `Page ${pageCount}: fetched ${result.Items.length} items, total: ${allItems.length}`);

      // Call progress callback with partial data for PROGRESSIVE PLOTTING
      if (progressCallback && allItems.length > 0) {
        const partialData = processDataItems(allItems, true); // Use progressive mode
        progressCallback({
          current: pageCount,
          total: Math.max(pageCount + (lastEvaluatedKey ? 5 : 0), pageCount), // Estimate total pages
          message: `Fetched ${allItems.length} records (Page ${pageCount}) - Progressive plotting...`,
          partialData: partialData // This enables real-time chart updates
        });
      }

    } while (lastEvaluatedKey && pageCount < maxPages);

    log(LOG_LEVELS.INFO, `Completed pagination: ${allItems.length} total items in ${pageCount} pages`);

    return allItems.map(convertDynamoDBFormat);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting paginated data for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Get data from the last minute for a specific battery
 */
export const getLastMinuteData = async (
  docClient,
  batteryId,
  attributes = null,
  progressCallback = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneMinuteAgo = now - 60;
    
    log(LOG_LEVELS.INFO, `Getting last minute data for battery: ${batteryId}`, {
      startTime: new Date(oneMinuteAgo * 1000).toISOString(),
      endTime: new Date(now * 1000).toISOString(),
      batteryId: batteryId
    });
    
    return await getDataWithPagination(
      docClient,
      batteryId,
      oneMinuteAgo,
      now,
      progressCallback,
      attributes
    );
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last minute data for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Get data from the last day for a specific device
 */
export const getLastDayData = async (
  docClient,
  batteryId,
  attributes = null,
  progressCallback = null
) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    
    log(LOG_LEVELS.INFO, `Getting last day data for battery: ${batteryId}`, {
      startTime: new Date(oneDayAgo * 1000).toISOString(),
      endTime: new Date(now * 1000).toISOString(),
      batteryId: batteryId
    });
    
    return await getDataWithPagination(
      docClient,
      batteryId,
      oneDayAgo,
      now,
      progressCallback,
      attributes
    );
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting last day data for ${batteryId}:`, error);
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
  attributes = null,
  progressCallback = null
) => {
  try {
    return await getDataWithPagination(
      docClient,
      batteryId,
      startTime,
      endTime,
      progressCallback,
      attributes
    );
  } catch (error) {
    log(LOG_LEVELS.ERROR, `Error getting time range data for ${batteryId}:`, error);
    throw error;
  }
};

/**
 * Main data fetching function - consolidated with proper data processing
 */
export const fetchData = async (selectedTagId, selectedTimeRange, progressCallback = null) => {
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

    // Construct the full battery ID with BAT- prefix to match DynamoDB TagID format
    const batteryId = `BAT-${selectedTagId}`;
    
    log(LOG_LEVELS.INFO, `Constructed batteryId: ${batteryId} from selectedTagId: ${selectedTagId}`);
    let fetchedData = [];

    // Update progress
    if (progressCallback) {
      progressCallback({
        current: 0,
        total: 100,
        message: `Initializing query for ${batteryId}...`,
        partialData: null
      });
    }

    // Use the optimized queries based on time range
    switch (selectedTimeRange) {
      case "1min":
        fetchedData = await getLastMinuteData(docClient, batteryId, null, progressCallback);
        break;
      case "5min":
        const fiveMinAgo = Math.floor(Date.now() / 1000) - 300;
        const now = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          fiveMinAgo,
          now,
          null,
          progressCallback
        );
        break;
      case "1hour":
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const currentTime = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          oneHourAgo,
          currentTime,
          null,
          progressCallback
        );
        break;
      case "8hours":
        const eightHoursAgo = Math.floor(Date.now() / 1000) - 28800;
        const currentTimeEight = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          eightHoursAgo,
          currentTimeEight,
          null,
          progressCallback
        );
        break;
      case "1day":
        fetchedData = await getLastDayData(docClient, batteryId, null, progressCallback);
        break;
      case "7days":
        const sevenDaysAgo = Math.floor(Date.now() / 1000) - 604800;
        const currentTimeSeven = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          sevenDaysAgo,
          currentTimeSeven,
          null,
          progressCallback
        );
        break;
      case "1month":
        const oneMonthAgo = Math.floor(Date.now() / 1000) - 2592000;
        const currentTimeMonth = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          oneMonthAgo,
          currentTimeMonth,
          null,
          progressCallback
        );
        break;
      default:
        const defaultOneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const defaultCurrentTime = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          defaultOneHourAgo,
          defaultCurrentTime,
          null,
          progressCallback
        );
    }

    log(LOG_LEVELS.INFO, `Fetched ${fetchedData.length} items for ${batteryId}`);

    if (!fetchedData || fetchedData.length === 0) {
      log(LOG_LEVELS.WARN, `No data found for ${batteryId} in time range ${selectedTimeRange}`, {
        batteryId: batteryId,
        selectedTagId: selectedTagId,
        timeRange: selectedTimeRange,
        queryType: "Primary Key Query"
      });
      
      // Try to get the latest reading to verify if the battery exists at all
      try {
        log(LOG_LEVELS.INFO, `Attempting to get latest reading for ${batteryId} to verify battery exists...`);
        const latestReading = await getLatestReading(docClient, batteryId);
        if (latestReading) {
          log(LOG_LEVELS.INFO, `Battery ${batteryId} exists with latest timestamp: ${latestReading.Timestamp}`, {
            latestTimestamp: new Date(parseInt(latestReading.Timestamp?.N || latestReading.Timestamp) * 1000).toISOString()
          });
        } else {
          log(LOG_LEVELS.WARN, `Battery ${batteryId} does not exist in database at all`);
        }
      } catch (latestError) {
        log(LOG_LEVELS.ERROR, `Error checking if battery exists: ${latestError.message}`);
      }
      
      const emptyStructure = {
        error: `No data found for battery ${selectedTagId} in the last ${selectedTimeRange}. Check console for debug info.`,
        batteryId,
        timeRange: selectedTimeRange,
        debug: {
          originalTagId: selectedTagId,
          constructedBatteryId: batteryId,
          queryType: "DynamoDB Primary Key Query"
        },
        Node0: {
          voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
          temperature: {},
        },
        Node1: {
          voltage: { cellVoltages: Array.from({ length: 14 }, () => []) },
          temperature: {},
        },
        Pack: { totalBattVoltage: 0, totalLoadVoltage: 0, totalCurrent: 0 },
        Cell: { maxCellVoltage: 0, minCellVoltage: 0, thresholdOverVoltage: 0, thresholdUnderVoltage: 0 },
        Temperature: { maxCellTemp: 0, minCellTemp: 0, thresholdOverTemp: 0, thresholdUnderTemp: 0, maxCellTempNode: 0, minCellTempNode: 0 },
        SOC: { socPercent: 0, balanceSOCPercent: 0 },
      };

      if (progressCallback) {
        progressCallback({
          current: 100,
          total: 100,
          message: "No data found",
          partialData: emptyStructure
        });
      }

      return emptyStructure;
    }

    // Process the fetched data into structured format (final processing - no sampling)
    if (progressCallback) {
      progressCallback({
        current: 90,
        total: 100,
        message: "Final processing - optimizing for display...",
        partialData: null
      });
    }

    const structuredData = processDataItems(fetchedData, false); // Final processing without sampling

    log(LOG_LEVELS.INFO, `Successfully processed data for ${batteryId}`, {
      totalItems: fetchedData.length,
      node0Cells: structuredData.Node0.voltage.cellVoltages.filter(arr => arr.length > 0).length,
      node1Cells: structuredData.Node1.voltage.cellVoltages.filter(arr => arr.length > 0).length,
    });

    if (progressCallback) {
      progressCallback({
        current: 100,
        total: 100,
        message: "Complete!",
        partialData: structuredData
      });
    }

    return structuredData;
  } catch (error) {
    log(LOG_LEVELS.ERROR, "Error in fetchData:", error);
    
    if (progressCallback) {
      progressCallback({
        current: 0,
        total: 100,
        message: `Error: ${error.message}`,
        partialData: null
      });
    }
    
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

// Debug function to test battery connectivity
export const testBatteryConnection = async (selectedTagId) => {
  try {
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
    
    console.log("=== BATTERY CONNECTION TEST ===");
    console.log("Selected Tag ID:", selectedTagId);
    console.log("Constructed Battery ID:", batteryId);
    
    // Test 1: Get latest reading
    try {
      const latestReading = await getLatestReading(docClient, batteryId);
      if (latestReading) {
        console.log("✅ Latest reading found:", {
          timestamp: new Date(parseInt(latestReading.Timestamp?.N || latestReading.Timestamp) * 1000).toISOString(),
          hasData: true
        });
      } else {
        console.log("❌ No latest reading found");
      }
    } catch (error) {
      console.log("❌ Error getting latest reading:", error.message);
    }
    
    // Test 2: Get last 5 minutes of data
    try {
      const fiveMinAgo = Math.floor(Date.now() / 1000) - 300;
      const now = Math.floor(Date.now() / 1000);
      const recentData = await getTimeRangeData(docClient, batteryId, fiveMinAgo, now);
      console.log("📊 Recent data (last 5 min):", recentData.length, "records");
    } catch (error) {
      console.log("❌ Error getting recent data:", error.message);
    }
    
    // Test 3: Try without BAT- prefix (in case the database structure is different)
    try {
      const latestReadingWithoutPrefix = await getLatestReading(docClient, selectedTagId);
      if (latestReadingWithoutPrefix) {
        console.log("✅ Data found WITHOUT BAT- prefix:", selectedTagId);
      } else {
        console.log("❌ No data found without BAT- prefix");
      }
    } catch (error) {
      console.log("❌ Error testing without prefix:", error.message);
    }
    
    console.log("=== END BATTERY TEST ===");
    
  } catch (error) {
    console.error("❌ Battery connection test failed:", error);
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