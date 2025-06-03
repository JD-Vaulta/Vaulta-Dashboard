// battery_performance_explorer.js
// Script to query multiple batteries and compare performance metrics
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Configure AWS
const AWS_REGION = "ap-southeast-2"; // Using your region
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Constants
const TABLE_NAME = "CAN_BMS_Data_Optimized";
const BATTERY_IDS = ["BAT-0x480", "BAT-0x400"]; // The two main battery IDs
const MAX_PAGES_PER_QUERY = 5; // Limit pages to avoid excessive costs during testing
const PAGE_SIZE = 500; // Items per page

// Performance metrics tracking
const metrics = {
  latestReadings: {},
  dayBuckets: {},
  monthBuckets: {},
  timeRanges: {},
};

// Function to measure query execution time
async function measureQueryTime(queryName, batteryId, queryFn) {
  console.log(`\n---- Running Query: ${queryName} (${batteryId}) ----`);

  const startTime = Date.now();
  let result;

  try {
    result = await queryFn();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Calculate items per page for paginated queries
    let totalItems = 0;
    let numPages = 0;

    if (result.pages) {
      // If this is a paginated result
      numPages = result.pages.length;
      totalItems = result.pages.reduce(
        (sum, page) => sum + (page.Items ? page.Items.length : 0),
        0
      );

      console.log(
        `Query completed in ${executionTime} ms (${numPages} pages, ${totalItems} total items)`
      );

      // Show items distribution across pages
      for (let i = 0; i < result.pages.length; i++) {
        const page = result.pages[i];
        console.log(
          `  Page ${i + 1}: ${page.Items ? page.Items.length : 0} items`
        );
      }
    } else {
      // Single page result
      totalItems = result.Items ? result.Items.length : 0;
      numPages = 1;
      console.log(
        `Query completed in ${executionTime} ms (${totalItems} items)`
      );
    }

    // Print sample info (first item only)
    const firstItem = result.pages
      ? result.pages[0]?.Items?.[0] || null
      : result.Items?.[0] || null;

    if (firstItem) {
      console.log("Sample data:");
      console.log(`  TagID: ${firstItem.TagID}`);
      console.log(
        `  Timestamp: ${firstItem.Timestamp} (${new Date(
          firstItem.Timestamp * 1000
        ).toISOString()})`
      );
      console.log(`  TotalBattVoltage: ${firstItem.TotalBattVoltage || "N/A"}`);
    } else {
      console.log("No items found");
    }

    // Return performance metrics
    return {
      batteryId,
      queryName,
      executionTime,
      numPages,
      totalItems,
      itemsPerSecond: totalItems / (executionTime / 1000),
    };
  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.error(`Query failed after ${executionTime} ms`);
    console.error(`Error: ${error.message}`);

    return {
      batteryId,
      queryName,
      executionTime,
      error: error.message,
      numPages: 0,
      totalItems: 0,
      itemsPerSecond: 0,
    };
  }
}

// Query 1: Get latest reading for a battery
async function getLatestReading(batteryId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "TagID = :tid",
    ExpressionAttributeNames: {
      "#ts": "Timestamp",
      "#tv": "TotalBattVoltage",
    },
    ProjectionExpression: "TagID, #ts, #tv",
    ExpressionAttributeValues: {
      ":tid": batteryId,
    },
    Limit: 1,
    ScanIndexForward: false, // Descending order (newest first)
  };

  const command = new QueryCommand(params);
  return docClient.send(command);
}

// Query 2: Get paginated data for a specific day
async function getDayData(batteryId, date) {
  // Extract year, month, day from date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const dayBucket = `${batteryId}#DAY_${year}${month}${day}`;

  // Process with pagination
  return queryWithPagination(
    "DailyBucketIndex",
    "TagID_TimeWindow_DAY = :bucket",
    { ":bucket": dayBucket }
  );
}

// Query 3: Get paginated data for a specific month
async function getMonthData(batteryId, yearMonth) {
  const monthBucket = `${batteryId}#MONTH_${yearMonth}`;

  // Process with pagination
  return queryWithPagination(
    "MonthlyBucketIndex",
    "TagID_TimeWindow_MONTH = :bucket",
    { ":bucket": monthBucket }
  );
}

// Query 4: Get paginated data for a time range
async function getTimeRangeData(batteryId, startTime, endTime) {
  // Process with pagination
  return queryWithPagination(
    null, // No GSI, use base table
    "TagID = :tid AND #ts BETWEEN :start AND :end",
    {
      ":tid": batteryId,
      ":start": startTime,
      ":end": endTime,
    }
  );
}

// Helper function for paginated queries
async function queryWithPagination(indexName, keyCondition, expressionValues) {
  let pages = [];
  let lastEvaluatedKey = null;
  let pageCount = 0;

  do {
    pageCount++;

    // Build params
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeNames: {
        "#ts": "Timestamp",
        "#tv": "TotalBattVoltage",
      },
      ProjectionExpression: "TagID, #ts, #tv",
      ExpressionAttributeValues: expressionValues,
      Limit: PAGE_SIZE,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    // Add index if specified
    if (indexName) {
      params.IndexName = indexName;
    }

    // Execute query
    const command = new QueryCommand(params);
    const result = await docClient.send(command);

    // Store page result
    pages.push(result);

    // Update pagination key
    lastEvaluatedKey = result.LastEvaluatedKey;

    // Limit pages during testing
    if (pageCount >= MAX_PAGES_PER_QUERY) {
      console.log(
        `Reached maximum page limit (${MAX_PAGES_PER_QUERY}). Stopping pagination.`
      );
      break;
    }
  } while (lastEvaluatedKey);

  return { pages };
}

// Find existing day buckets
async function findExistingDayBuckets(batteryId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "TagID = :tid",
    ProjectionExpression: "TagID_TimeWindow_DAY",
    ExpressionAttributeValues: {
      ":tid": batteryId,
    },
    Limit: 100,
  };

  const command = new QueryCommand(params);
  const result = await docClient.send(command);

  // Extract unique day buckets
  const dayBuckets = new Set();
  if (result.Items && result.Items.length > 0) {
    for (const item of result.Items) {
      if (item.TagID_TimeWindow_DAY) {
        dayBuckets.add(item.TagID_TimeWindow_DAY);
      }
    }
  }

  return Array.from(dayBuckets);
}

// Find existing month buckets
async function findExistingMonthBuckets(batteryId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "TagID = :tid",
    ProjectionExpression: "TagID_TimeWindow_MONTH",
    ExpressionAttributeValues: {
      ":tid": batteryId,
    },
    Limit: 100,
  };

  const command = new QueryCommand(params);
  const result = await docClient.send(command);

  // Extract unique month buckets
  const monthBuckets = new Set();
  if (result.Items && result.Items.length > 0) {
    for (const item of result.Items) {
      if (item.TagID_TimeWindow_MONTH) {
        monthBuckets.add(item.TagID_TimeWindow_MONTH);
      }
    }
  }

  return Array.from(monthBuckets);
}

// Test suite for one battery
async function runBatteryTests(batteryId) {
  console.log(`\n===== Running Tests for ${batteryId} =====`);

  // Test 1: Get latest reading (fast point query)
  metrics.latestReadings[batteryId] = await measureQueryTime(
    "Latest Reading",
    batteryId,
    async () => getLatestReading(batteryId)
  );

  // Find existing day buckets
  console.log(`\nFinding existing day buckets for ${batteryId}...`);
  const dayBuckets = await findExistingDayBuckets(batteryId);
  console.log(`Found ${dayBuckets.length} day buckets:`);
  dayBuckets.slice(0, 5).forEach((bucket) => console.log(`  ${bucket}`));

  // Find existing month buckets
  console.log(`\nFinding existing month buckets for ${batteryId}...`);
  const monthBuckets = await findExistingMonthBuckets(batteryId);
  console.log(`Found ${monthBuckets.length} month buckets:`);
  monthBuckets.forEach((bucket) => console.log(`  ${bucket}`));

  // Test 2: Query one day bucket (if available)
  if (dayBuckets.length > 0) {
    const dayBucket = dayBuckets[0];
    const datePart = dayBucket.split("#DAY_")[1];
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    const date = new Date(year, month, day);

    metrics.dayBuckets[batteryId] = await measureQueryTime(
      "Day Bucket",
      batteryId,
      async () => getDayData(batteryId, date)
    );
  }

  // Test 3: Query one month bucket (if available)
  if (monthBuckets.length > 0) {
    const monthBucket = monthBuckets[0];
    const yearMonth = monthBucket.split("#MONTH_")[1];

    metrics.monthBuckets[batteryId] = await measureQueryTime(
      "Month Bucket",
      batteryId,
      async () => getMonthData(batteryId, yearMonth)
    );
  }

  // Test 4: Query a specific time range
  // Get latest reading to find time range
  const latestResult = await getLatestReading(batteryId);
  if (latestResult.Items && latestResult.Items.length > 0) {
    const latestTimestamp = latestResult.Items[0].Timestamp;
    // Get data for the past 24 hours
    const oneDayAgo = latestTimestamp - 24 * 60 * 60;

    metrics.timeRanges[batteryId] = await measureQueryTime(
      "Time Range (Last 24 Hours)",
      batteryId,
      async () => getTimeRangeData(batteryId, oneDayAgo, latestTimestamp)
    );
  }
}

// Main function
async function main() {
  console.log("===== DynamoDB Performance Explorer =====");
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Battery IDs: ${BATTERY_IDS.join(", ")}`);
  console.log(`Region: ${AWS_REGION}`);
  console.log("Page Size: ${PAGE_SIZE}, Max Pages: ${MAX_PAGES_PER_QUERY}");
  console.log("=========================================");

  // Run tests for each battery ID
  for (const batteryId of BATTERY_IDS) {
    await runBatteryTests(batteryId);
  }

  // Print performance summary
  console.log("\n===== Performance Summary =====");

  // Latest Readings
  console.log("\n----- Latest Reading Queries -----");
  for (const batteryId in metrics.latestReadings) {
    const m = metrics.latestReadings[batteryId];
    console.log(
      `${batteryId}: ${m.executionTime}ms, ${
        m.totalItems
      } items, ${m.itemsPerSecond.toFixed(2)} items/second`
    );
  }

  // Day Buckets
  console.log("\n----- Day Bucket Queries -----");
  for (const batteryId in metrics.dayBuckets) {
    const m = metrics.dayBuckets[batteryId];
    console.log(
      `${batteryId}: ${m.executionTime}ms, ${m.totalItems} items (${
        m.numPages
      } pages), ${m.itemsPerSecond.toFixed(2)} items/second`
    );
  }

  // Month Buckets
  console.log("\n----- Month Bucket Queries -----");
  for (const batteryId in metrics.monthBuckets) {
    const m = metrics.monthBuckets[batteryId];
    console.log(
      `${batteryId}: ${m.executionTime}ms, ${m.totalItems} items (${
        m.numPages
      } pages), ${m.itemsPerSecond.toFixed(2)} items/second`
    );
  }

  // Time Ranges
  console.log("\n----- Time Range Queries (24h) -----");
  for (const batteryId in metrics.timeRanges) {
    const m = metrics.timeRanges[batteryId];
    console.log(
      `${batteryId}: ${m.executionTime}ms, ${m.totalItems} items (${
        m.numPages
      } pages), ${m.itemsPerSecond.toFixed(2)} items/second`
    );
  }

  console.log("\n===== Query Performance Recommendations =====");
  console.log("1. Latest data: Use direct queries on primary key (fastest)");
  console.log("2. Day-specific data: Use day bucket GSI for best performance");
  console.log(
    "3. Month-level data: Use monthly bucket GSI to reduce scan time"
  );
  console.log("4. Custom time ranges: Use direct timestamp range queries");
  console.log(
    "5. Across batteries: Run queries in parallel for multiple batteries"
  );
}

// Run the tests
main()
  .then(() => console.log("\nPerformance tests completed successfully"))
  .catch((err) => console.error("Error running performance tests:", err));
