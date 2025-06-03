/**
 * queries.js - Optimized query functions for CAN_BMS_Data_Optimized table
 *
 * This module provides functions for efficient querying of battery data using
 * the optimized table structure with time bucket indexes and includes consolidated
 * data fetching functionality.
 */

import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "./aws-exports.js";

// Table name
const TABLE_NAME = "CAN_BMS_Data_Optimized";

// Helper function to convert DynamoDB format to app format
const convertDynamoDBFormat = (item) => {
  if (!item) return item;

  // If the item is already in the correct format, return it
  if (!item.N && !item.S && !item.BOOL) {
    return item;
  }

  // Convert from DynamoDB format
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
      // Already in simple format
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

/**
 * Get the latest reading for a battery
 */
export const getLatestReading = async (docClient, batteryId) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "TagID = :tid",
      ExpressionAttributeValues: {
        ":tid": batteryId,
      },
      Limit: 1,
      ScanIndexForward: false, // Descending order (newest first)
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
    console.error(
      `Error getting latest reading for ${batteryId}:`,
      error.message
    );
    throw error;
  }
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

    const params = {
      TableName: TABLE_NAME,
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
    console.error(
      `Error getting last minute data for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Get data from the last hour using hour bucket index
 */
export const getLastHourData = async (
  docClient,
  batteryId,
  attributes = null
) => {
  try {
    const date = new Date();
    const hourStr = `${date.getFullYear()}${String(
      date.getMonth() + 1
    ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(
      date.getHours()
    ).padStart(2, "0")}`;
    const hourBucket = `${batteryId}#HOUR_${hourStr}`;

    const params = {
      TableName: TABLE_NAME,
      IndexName: "HourlyBucketIndex",
      KeyConditionExpression: "TagID_TimeWindow_HOUR = :bucket",
      ExpressionAttributeValues: {
        ":bucket": hourBucket,
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
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    console.error(
      `Error getting last hour data for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Get data from the current day using day bucket index
 */
export const getLastDayData = async (
  docClient,
  batteryId,
  attributes = null
) => {
  try {
    const date = new Date();
    const dayStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(date.getDate()).padStart(2, "0")}`;
    const dayBucket = `${batteryId}#DAY_${dayStr}`;

    const params = {
      TableName: TABLE_NAME,
      IndexName: "DailyBucketIndex",
      KeyConditionExpression: "TagID_TimeWindow_DAY = :bucket",
      ExpressionAttributeValues: {
        ":bucket": dayBucket,
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
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    console.error(
      `Error getting last day data for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Get data from the current month using month bucket index
 */
export const getLastMonthData = async (
  docClient,
  batteryId,
  attributes = null
) => {
  try {
    const date = new Date();
    const monthStr = `${date.getFullYear()}${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthBucket = `${batteryId}#MONTH_${monthStr}`;

    const params = {
      TableName: TABLE_NAME,
      IndexName: "MonthlyBucketIndex",
      KeyConditionExpression: "TagID_TimeWindow_MONTH = :bucket",
      ExpressionAttributeValues: {
        ":bucket": monthBucket,
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
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    console.error(
      `Error getting last month data for ${batteryId}:`,
      error.message
    );
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
    const params = {
      TableName: TABLE_NAME,
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
    return result.Items.map(convertDynamoDBFormat);
  } catch (error) {
    console.error(
      `Error getting time range data for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Get the last 7 days of data using multiple day bucket queries in parallel
 */
export const getLast7DaysData = async (
  docClient,
  batteryId,
  attributes = null
) => {
  try {
    const dayBuckets = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = `${date.getFullYear()}${String(
        date.getMonth() + 1
      ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
      dayBuckets.push(`${batteryId}#DAY_${dayStr}`);
    }

    const queryPromises = dayBuckets.map((bucket) => {
      const params = {
        TableName: TABLE_NAME,
        IndexName: "DailyBucketIndex",
        KeyConditionExpression: "TagID_TimeWindow_DAY = :bucket",
        ExpressionAttributeValues: {
          ":bucket": bucket,
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

      return docClient.query(params).promise();
    });

    const results = await Promise.all(queryPromises);
    const allItems = results.flatMap((result) => result.Items || []);
    return allItems.map(convertDynamoDBFormat);
  } catch (error) {
    console.error(
      `Error getting last 7 days data for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Main data fetching function - consolidated from DataFetcher.js
 */
export const fetchData = async (selectedTagId, selectedTimeRange) => {
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
        fetchedData = await getLastHourData(docClient, batteryId);
        break;
      case "8hours":
        const eightHoursAgo = Math.floor(Date.now() / 1000) - 28800;
        const currentTime = Math.floor(Date.now() / 1000);
        fetchedData = await getTimeRangeData(
          docClient,
          batteryId,
          eightHoursAgo,
          currentTime
        );
        break;
      case "1day":
        fetchedData = await getLastDayData(docClient, batteryId);
        break;
      case "7days":
        fetchedData = await getLast7DaysData(docClient, batteryId);
        break;
      case "1month":
        fetchedData = await getLastMonthData(docClient, batteryId);
        break;
      default:
        fetchedData = await getLastHourData(docClient, batteryId);
    }

    if (!fetchedData || fetchedData.length === 0) {
      console.warn(
        `No data found for ${batteryId} in time range ${selectedTimeRange}`
      );
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
      Pack: {
        numParallelNodes: null,
        numNodes: null,
        thresholdOverCurrent: null,
        modes: null,
        totalBattVoltage: null,
        totalLoadVoltage: null,
        totalCurrent: null,
        serialNumber: null,
        state: null,
        events: null,
      },
      Cell: {
        maxCellVoltage: null,
        minCellVoltage: null,
        maxCellVoltageCellNo: null,
        minCellVoltageCellNo: null,
        maxCellVoltageNode: null,
        minCellVoltageNode: null,
        thresholdOverVoltage: null,
        thresholdUnderVoltage: null,
        criticalOverVoltThreshold: null,
        criticalUnderVoltThreshold: null,
        balanceThresholdVoltage: null,
      },
      Temperature: {
        maxCellTemp: null,
        minCellTemp: null,
        maxCellTempNode: null,
        minCellTempNode: null,
        thresholdOverTemp: null,
        thresholdUnderTemp: null,
      },
      SOC: {
        socPercent: null,
        socAh: null,
        balanceSOCPercent: null,
        balanceSOCAh: null,
      },
    };

    // Process fetched data
    fetchedData.forEach((item) => {
      // Process Node0 data
      for (let i = 0; i < 14; i++) {
        const cellKey = `Node00Cell${i < 10 ? `0${i}` : i}`;
        if (item[cellKey] !== undefined && item[cellKey] !== null) {
          structuredData.Node0.voltage.cellVoltages[i].push(
            roundToTwoDecimals(item[cellKey])
          );
        }
      }

      // Process Node0 temperature keys
      for (let i = 0; i < 6; i++) {
        const tempKey = `Node00Temp${i < 10 ? `0${i}` : i}`;
        if (item[tempKey] !== undefined && item[tempKey] !== null) {
          if (!structuredData.Node0.temperature[tempKey]) {
            structuredData.Node0.temperature[tempKey] = [];
          }
          structuredData.Node0.temperature[tempKey].push(
            roundToTwoDecimals(item[tempKey])
          );
        }
      }

      // Process Node1 data
      for (let i = 0; i < 14; i++) {
        const cellKey = `Node01Cell${i < 10 ? `0${i}` : i}`;
        if (item[cellKey] !== undefined && item[cellKey] !== null) {
          structuredData.Node1.voltage.cellVoltages[i].push(
            roundToTwoDecimals(item[cellKey])
          );
        }
      }

      // Process Node1 temperature keys
      for (let i = 0; i < 6; i++) {
        const tempKey = `Node01Temp${i < 10 ? `0${i}` : i}`;
        if (item[tempKey] !== undefined && item[tempKey] !== null) {
          if (!structuredData.Node1.temperature[tempKey]) {
            structuredData.Node1.temperature[tempKey] = [];
          }
          structuredData.Node1.temperature[tempKey].push(
            roundToTwoDecimals(item[tempKey])
          );
        }
      }

      // Process Pack-Level Data
      if (item.TotalBattVoltage !== undefined) {
        structuredData.Pack = {
          numParallelNodes:
            item.PackNumParallelNodes || structuredData.Pack.numParallelNodes,
          numNodes: item.PackNumNodes || structuredData.Pack.numNodes,
          thresholdOverCurrent:
            item.PackThresholdOverCurrent !== undefined
              ? roundToTwoDecimals(item.PackThresholdOverCurrent)
              : structuredData.Pack.thresholdOverCurrent,
          modes: item.PackModes || structuredData.Pack.modes,
          totalBattVoltage:
            item.TotalBattVoltage !== undefined
              ? roundToTwoDecimals(item.TotalBattVoltage)
              : structuredData.Pack.totalBattVoltage,
          totalLoadVoltage:
            item.TotalLoadVoltage !== undefined
              ? roundToTwoDecimals(item.TotalLoadVoltage)
              : structuredData.Pack.totalLoadVoltage,
          totalCurrent:
            item.TotalCurrent !== undefined
              ? roundToTwoDecimals(item.TotalCurrent)
              : structuredData.Pack.totalCurrent,
          serialNumber: item.SerialNumber || structuredData.Pack.serialNumber,
          state: item.State || structuredData.Pack.state,
          events: item.Events || structuredData.Pack.events,
        };
      }

      // Process Cell-Level Data
      if (
        item.MaximumCellVoltage !== undefined ||
        item.MinimumCellVoltage !== undefined
      ) {
        structuredData.Cell = {
          maxCellVoltage:
            item.MaximumCellVoltage !== undefined
              ? roundToTwoDecimals(item.MaximumCellVoltage)
              : structuredData.Cell.maxCellVoltage,
          minCellVoltage:
            item.MinimumCellVoltage !== undefined
              ? roundToTwoDecimals(item.MinimumCellVoltage)
              : structuredData.Cell.minCellVoltage,
          maxCellVoltageCellNo:
            item.MaximumCellVoltageCellNo ||
            structuredData.Cell.maxCellVoltageCellNo,
          minCellVoltageCellNo:
            item.MinimumCellVoltageCellNo ||
            structuredData.Cell.minCellVoltageCellNo,
          maxCellVoltageNode:
            item.MaximumCellVoltageNode ||
            structuredData.Cell.maxCellVoltageNode,
          minCellVoltageNode:
            item.MinimumCellVoltageNode ||
            structuredData.Cell.minCellVoltageNode,
          thresholdOverVoltage:
            item.CellThresholdOverVoltage !== undefined
              ? roundToTwoDecimals(item.CellThresholdOverVoltage)
              : structuredData.Cell.thresholdOverVoltage,
          thresholdUnderVoltage:
            item.CellThresholdUnderVoltage !== undefined
              ? roundToTwoDecimals(item.CellThresholdUnderVoltage)
              : structuredData.Cell.thresholdUnderVoltage,
          criticalOverVoltThreshold:
            item.CellCriticalOverVoltThreshold !== undefined
              ? roundToTwoDecimals(item.CellCriticalOverVoltThreshold)
              : structuredData.Cell.criticalOverVoltThreshold,
          criticalUnderVoltThreshold:
            item.CellCriticalUnderVoltThreshold !== undefined
              ? roundToTwoDecimals(item.CellCriticalUnderVoltThreshold)
              : structuredData.Cell.criticalUnderVoltThreshold,
          balanceThresholdVoltage:
            item.CellBalanceThresholdVoltage !== undefined
              ? roundToTwoDecimals(item.CellBalanceThresholdVoltage)
              : structuredData.Cell.balanceThresholdVoltage,
        };
      }

      // Process Temperature Data
      if (item.MaxCellTemp !== undefined || item.MinCellTemp !== undefined) {
        structuredData.Temperature = {
          maxCellTemp:
            item.MaxCellTemp !== undefined
              ? roundToTwoDecimals(item.MaxCellTemp)
              : structuredData.Temperature.maxCellTemp,
          minCellTemp:
            item.MinCellTemp !== undefined
              ? roundToTwoDecimals(item.MinCellTemp)
              : structuredData.Temperature.minCellTemp,
          maxCellTempNode:
            item.MaxCellTempNode || structuredData.Temperature.maxCellTempNode,
          minCellTempNode:
            item.MinCellTempNode || structuredData.Temperature.minCellTempNode,
          thresholdOverTemp:
            item.TempThresholdOverTemp !== undefined
              ? roundToTwoDecimals(item.TempThresholdOverTemp)
              : structuredData.Temperature.thresholdOverTemp,
          thresholdUnderTemp:
            item.TempThresholdUnderTemp !== undefined
              ? roundToTwoDecimals(item.TempThresholdUnderTemp)
              : structuredData.Temperature.thresholdUnderTemp,
        };
      }

      // Process SOC Data
      if (item.SOCPercent !== undefined || item.SOCAh !== undefined) {
        structuredData.SOC = {
          socPercent:
            item.SOCPercent !== undefined
              ? roundToTwoDecimals(item.SOCPercent)
              : structuredData.SOC.socPercent,
          socAh:
            item.SOCAh !== undefined
              ? roundToTwoDecimals(item.SOCAh)
              : structuredData.SOC.socAh,
          balanceSOCPercent:
            item.BalanceSOCPercent !== undefined
              ? roundToTwoDecimals(item.BalanceSOCPercent)
              : structuredData.SOC.balanceSOCPercent,
          balanceSOCAh:
            item.BalanceSOCAh !== undefined
              ? roundToTwoDecimals(item.BalanceSOCAh)
              : structuredData.SOC.balanceSOCAh,
        };
      }
    });

    return structuredData;
  } catch (error) {
    console.error("Error in fetchData:", error.message);
    throw error;
  }
};

// Battery anomalies functions
export const getBatteryAnomalies = async (docClient, batteryId, limit = 50) => {
  try {
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
    } catch (queryError) {
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
    console.error("Error fetching battery anomalies:", error.message);
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
    const scanParams = {
      TableName: "BatteryAnomalies_EC2",
      Limit: limit,
    };

    const result = await docClient.scan(scanParams).promise();

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
    console.error("Error fetching all battery anomalies:", error.message);
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
    const params = {
      TableName: "BatteryAnomalies_EC2",
      ProjectionExpression: "tag_id",
    };

    const result = await docClient.scan(params).promise();
    const uniqueIds = [...new Set(result.Items.map((item) => item.tag_id))];

    return {
      success: true,
      data: uniqueIds.sort(),
      count: uniqueIds.length,
    };
  } catch (error) {
    console.error("Error fetching available battery IDs:", error.message);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0,
    };
  }
};

// Legacy function names for backward compatibility
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

export const getLatestReadingMinimal = async (docClient, batteryId) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "TagID = :tid",
      ExpressionAttributeValues: {
        ":tid": batteryId,
      },
      ProjectionExpression: "TagID, #ts, Events, DeviceId",
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
      },
      Limit: 1,
      ScanIndexForward: false,
    };

    const result = await docClient.query(params).promise();

    if (result.Items.length > 0) {
      const item = result.Items[0];

      return {
        TagID: item.TagID,
        Timestamp: { N: item.Timestamp.toString() },
        Events: { N: item.Events.toString() },
        DeviceId: { N: item.DeviceId.toString() },
      };
    }

    return null;
  } catch (error) {
    console.error(
      `Error getting minimal latest reading for ${batteryId}:`,
      error.message
    );
    throw error;
  }
};
