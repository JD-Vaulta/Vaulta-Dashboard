import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import AWS from "aws-sdk";
import awsconfig from "./aws-exports.js";
import { getLatestReading, getLastMinuteData } from "./queries.js";

const useDynamoDB = () => {
  const [tableMetadata] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const session = await fetchAuthSession();
        const credentials = session.credentials;

        // Use DocumentClient for easier data handling
        const docClient = new AWS.DynamoDB.DocumentClient({
          apiVersion: "2012-08-10",
          region: awsconfig.region,
          credentials,
        });

        fetchUserDetails(session);
        await fetchData(docClient, "BAT-0x480");
      } catch (error) {
        console.error("Error fetching AWS credentials:", error);
        setErrorMessage("Failed to fetch AWS credentials.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const fetchUserDetails = (session) => {
    try {
      const user = session?.identityId || null;
      if (user) {
        setUserDetails({
          userPoolId: awsconfig.userPoolId,
          region: awsconfig.region,
          appClientId: awsconfig.clientID,
          identityId: user,
        });
      } else {
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserDetails(null);
    }
  };

  const fetchData = async (docClient, batteryId) => {
    try {
      // Get the latest minute of data for the battery
      const lastMinuteData = await getLastMinuteData(docClient, batteryId);

      // If we have data, use it; otherwise fetch just the latest reading
      if (lastMinuteData && lastMinuteData.length > 0) {
        console.log("Got last minute data:", lastMinuteData);
        setData({ lastMinuteData });
      } else {
        // Fallback to just getting the latest reading
        console.log("No minute data, fetching latest reading...");
        const latestReading = await getLatestReading(docClient, batteryId);

        if (latestReading) {
          console.log("Got latest reading:", latestReading);
          setData({ lastMinuteData: [latestReading] });
        } else {
          console.warn("No data available for battery:", batteryId);
          setData({ lastMinuteData: [] });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Failed to fetch data.");
      setData(null);
    }
  };

  return { tableMetadata, errorMessage, userDetails, data, isLoading };
};

export default useDynamoDB;
