import AWS from "aws-sdk";
import { fetchAuthSession } from "aws-amplify/auth";
import awsconfig from "../../../aws-exports.js";

// Helper function to safely convert values to numbers
const safeNumberConversion = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (value && typeof value === "object" && value.N) {
    const num = parseFloat(value.N);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Calculate time range based on selection
const calculateTimeRange = (timeRange) => {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  switch (timeRange) {
    case "1month":
      return { startTime: now - 92000, endTime: now }; // 30 days
    case "3months":
      return { startTime: now - 7776000, endTime: now }; // 90 days
    case "6months":
      return { startTime: now - 15552000, endTime: now }; // 180 days
    case "1year":
      return { startTime: now - 31536000, endTime: now }; // 365 days
    default:
      return { startTime: now - 2592000, endTime: now }; // Default to 30 days
  }
};

// Create time chunks for parallel processing
const createTimeChunks = (startTime, endTime, numChunks = 4) => {
  const timePerChunk = Math.floor((endTime - startTime) / numChunks);
  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const chunkStart = startTime + i * timePerChunk;
    // For the last chunk, use endTime to avoid rounding issues
    const chunkEnd =
      i === numChunks - 1 ? endTime : startTime + ((i + 1) * timePerChunk - 1);
    chunks.push({
      startTime: chunkStart,
      endTime: chunkEnd,
      index: i,
      total: numChunks,
    });
  }

  return chunks;
};

// Enhanced function to handle cached data with proper type conversion
const fetchChunkData = async (
  dynamoDB,
  tableName,
  tagID,
  chunk,
  progressCallback
) => {
  let allItems = [];
  let lastEvaluatedKey = null;
  let pageCount = 0;
  let totalItems = 0;

  try {
    console.log(
      `Starting chunk ${chunk.index + 1}/${chunk.total}: ${new Date(
        chunk.startTime * 1000
      ).toISOString()} to ${new Date(chunk.endTime * 1000).toISOString()}`
    );

    do {
      // Create the base query params with proper type handling
      const params = {
        TableName: tableName,
        KeyConditionExpression:
          "TagID = :tagID AND #ts BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
          "#ts": "Timestamp",
        },
        ExpressionAttributeValues: {
          ":tagID": { S: tagID },
          ":startTime": { N: safeNumberConversion(chunk.startTime).toString() },
          ":endTime": { N: safeNumberConversion(chunk.endTime).toString() },
        },
        Limit: 100,
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const data = await dynamoDB.query(params).promise();

      // Process items to ensure proper data types
      const processedItems = data.Items.map((item) => {
        const processedItem = {};
        for (const [key, value] of Object.entries(item)) {
          if (value.N) {
            processedItem[key] = safeNumberConversion(value.N);
          } else if (value.S) {
            processedItem[key] = value.S;
          } else if (value.BOOL !== undefined) {
            processedItem[key] = value.BOOL;
          } else {
            processedItem[key] = value;
          }
        }
        return processedItem;
      });

      allItems = allItems.concat(processedItems);
      lastEvaluatedKey = data.LastEvaluatedKey;
      pageCount++;
      totalItems += data.Items.length;

      console.log(
        `Chunk ${chunk.index + 1}/${
          chunk.total
        }: Page ${pageCount}, Total items: ${totalItems}`
      );

      if (progressCallback) {
        const hasMore = lastEvaluatedKey !== undefined;
        progressCallback({
          chunk: chunk,
          pageCount,
          itemCount: totalItems,
          hasMore,
          status: hasMore ? "in_progress" : "complete",
          message: `Chunk ${chunk.index + 1}/${
            chunk.total
          }: Fetched ${totalItems} records...`,
        });
      }

      if (lastEvaluatedKey) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } while (lastEvaluatedKey);

    console.log(
      `Completed chunk ${chunk.index + 1}/${
        chunk.total
      }: ${totalItems} items in ${pageCount} pages`
    );
    return {
      items: allItems,
      count: totalItems,
      chunk: chunk,
    };
  } catch (error) {
    console.error(`Error in chunk ${chunk.index + 1}/${chunk.total}:`, error);

    if (progressCallback) {
      progressCallback({
        chunk: chunk,
        pageCount,
        itemCount: totalItems,
        hasMore: false,
        status: "error",
        error: error.message,
        message: `Error in chunk ${chunk.index + 1}/${chunk.total}: ${
          error.message
        }`,
      });
    }

    throw error;
  }
};

// Updated data processing with type safety
const processDataForTaskType = (taskType, data) => {
  // Ensure all numeric values are properly converted
  const processedData = data.map((item) => {
    const processedItem = {};
    for (const [key, value] of Object.entries(item)) {
      processedItem[key] =
        typeof value === "string" && !isNaN(value)
          ? safeNumberConversion(value)
          : value;
    }
    return processedItem;
  });

  switch (taskType) {
    case "batteryHealth":
      return {
        voltageStats: {
          min: 0,
          max: 0,
          avg: 0,
          stdDev: 0,
        },
        currentStats: {
          min: 0,
          max: 0,
          avg: 0,
          stdDev: 0,
        },
        temperatureStats: {
          min: 0,
          max: 0,
          avg: 0,
          stdDev: 0,
        },
        cycleCount: 0,
        socHistory: [],
        estimatedAge: 0,
      };
    case "anomalyDetection":
      return {
        recentReadings: [],
        internalResistanceValues: [],
        rateOfChange: {
          voltage: [],
          current: [],
          temperature: [],
        },
        normalOperationBounds: {
          voltage: { min: 0, max: 0 },
          current: { min: 0, max: 0 },
          temperature: { min: 0, max: 0 },
        },
      };
    case "energyOptimization":
      return {
        usagePatterns: {
          hourly: Array(24).fill(0),
          daily: Array(7).fill(0),
        },
        environmentalFactors: [],
        chargingPatterns: [],
        timeSeriesData: [],
      };
    case "predictiveMaintenance":
      return {
        statisticalPatterns: {
          voltage: {
            mean: 0,
            stdDev: 0,
            trend: [],
          },
          current: {
            mean: 0,
            stdDev: 0,
            trend: [],
          },
        },
        cycleInformation: {
          count: 0,
          depthOfDischarge: [],
          chargeDurations: [],
          dischargeDurations: [],
        },
        temperatureExtremes: {
          max: 0,
          min: 100,
          fluctuations: [],
        },
        chargingEfficiency: [],
      };
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
};

// Stream processing with type safety
const streamProcessData = (taskType, chunks, progressCallback) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allItems = chunks.reduce(
        (all, chunk) => all.concat(chunk.items),
        []
      );
      const totalCount = allItems.length;
      const rawSample = allItems.slice(0, 5);

      if (progressCallback) {
        progressCallback({
          stage: "processing",
          status: "complete",
          progress: {
            completedPercentage: 100,
          },
          message: `Completed processing ${totalCount} records for ${taskType}`,
        });
      }

      resolve({
        processedData: processDataForTaskType(taskType, allItems),
        totalCount,
        rawSample,
      });
    }, 1000);
  });
};

// Main function with enhanced error handling
export const collectMLData = async (
  selectedTagId,
  selectedTimeRange,
  taskType,
  progressCallback
) => {
  const startTime = performance.now();
  try {
    if (progressCallback) {
      progressCallback({
        stage: "initializing",
        status: "in_progress",
        message: "Setting up data collection...",
        timing: { start: startTime },
      });
    }

    const session = await fetchAuthSession();
    const credentials = session.credentials;

    const dynamoDB = new AWS.DynamoDB({
      apiVersion: "2012-10-17",
      region: awsconfig.region,
      credentials,
    });

    const { startTime: rangeStart, endTime: rangeEnd } =
      calculateTimeRange(selectedTimeRange);
    console.log(
      `Time range: ${new Date(rangeStart * 1000).toISOString()} to ${new Date(
        rangeEnd * 1000
      ).toISOString()}`
    );

    const numChunks =
      selectedTimeRange === "1year"
        ? 12
        : selectedTimeRange === "6months"
        ? 6
        : selectedTimeRange === "3months"
        ? 4
        : 4;

    const chunks = createTimeChunks(rangeStart, rangeEnd, numChunks);

    if (progressCallback) {
      progressCallback({
        stage: "fetching",
        status: "in_progress",
        message: `Starting data collection with ${numChunks} parallel chunks...`,
        progress: {
          chunks: numChunks,
          completedChunks: 0,
          completedPercentage: 0,
        },
        timing: {
          start: startTime,
          elapsed: performance.now() - startTime,
        },
      });
    }

    const chunkPromises = chunks.map((chunk) =>
      fetchChunkData(
        dynamoDB,
        "CAN_BMS_Data",
        `BAT-${selectedTagId}`,
        chunk,
        (progress) => {
          if (progressCallback) {
            const overallProgress = {
              stage: "fetching",
              status: progress.status,
              message: progress.message,
              progress: {
                chunks: numChunks,
                currentChunk: progress.chunk.index + 1,
                completedChunks:
                  progress.status === "complete"
                    ? progress.chunk.index + 1
                    : progress.chunk.index,
                completedPercentage: Math.floor(
                  (progress.chunk.index * 100 +
                    (progress.status === "complete"
                      ? 100
                      : (progress.itemCount / 100) * 100)) /
                    numChunks
                ),
              },
              timing: {
                start: startTime,
                elapsed: performance.now() - startTime,
              },
            };

            progressCallback(overallProgress);
          }
        }
      )
    );

    console.log(`Waiting for ${numChunks} chunks to complete...`);
    const chunkResults = await Promise.all(chunkPromises);
    const totalItems = chunkResults.reduce(
      (sum, chunk) => sum + chunk.count,
      0
    );

    const fetchCompletionTime = performance.now();
    const fetchDuration = fetchCompletionTime - startTime;

    console.log(
      `All chunks completed. Total items: ${totalItems}. Fetch duration: ${fetchDuration.toFixed(
        2
      )}ms`
    );

    if (progressCallback) {
      progressCallback({
        stage: "processing",
        status: "in_progress",
        message: `Processing ${totalItems} records for ${taskType}...`,
        progress: {
          totalItems,
          completedPercentage: 0,
        },
        timing: {
          start: startTime,
          fetchComplete: fetchCompletionTime,
          fetchDuration,
          elapsed: fetchCompletionTime - startTime,
        },
      });
    }

    console.log(`Starting stream processing for ${taskType}...`);
    const processedResult = await streamProcessData(
      taskType,
      chunkResults,
      progressCallback
    );

    const completionTime = performance.now();
    const totalDuration = completionTime - startTime;
    const processingDuration = completionTime - fetchCompletionTime;

    console.log(
      `Stream processing completed for ${taskType}. Processing duration: ${processingDuration.toFixed(
        2
      )}ms. Total duration: ${totalDuration.toFixed(2)}ms`
    );

    if (progressCallback) {
      progressCallback({
        stage: "completed",
        status: "complete",
        message: `Successfully processed ${totalItems} records for ${taskType}`,
        timing: {
          start: startTime,
          fetchComplete: fetchCompletionTime,
          fetchDuration,
          processingDuration,
          totalDuration,
          end: completionTime,
        },
      });
    }

    return {
      meta: {
        tagId: selectedTagId,
        timeRange: selectedTimeRange,
        dataPoints: totalItems,
        chunks: numChunks,
        startTime: rangeStart,
        endTime: rangeEnd,
        timing: {
          fetchDuration,
          processingDuration,
          totalDuration,
        },
      },
      rawData: chunkResults.reduce((all, chunk) => all.concat(chunk.items), []),
      rawSampleData: processedResult.rawSample,
      processedData: processedResult.processedData,
    };
  } catch (error) {
    console.error("Error collecting ML data:", error);

    if (progressCallback) {
      progressCallback({
        stage: "error",
        status: "error",
        message: `Error: ${error.message}`,
        timing: {
          start: startTime,
          error: performance.now(),
          elapsed: performance.now() - startTime,
        },
      });
    }

    throw error;
  }
};

export default {
  collectMLData,
  calculateTimeRange,
  createTimeChunks,
  fetchChunkData,
  streamProcessData,
};
