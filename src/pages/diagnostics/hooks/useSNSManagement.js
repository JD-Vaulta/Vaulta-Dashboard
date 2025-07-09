import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  SNSClient,
  ListTopicsCommand,
  SubscribeCommand,
  ListSubscriptionsCommand,
  UnsubscribeCommand,
} from "@aws-sdk/client-sns";

export const useSNSManagement = (user, setSubscriptionStatus) => {
  const [userEmail, setUserEmail] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  // Get user email
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        if (user && user.attributes && user.attributes.email) {
          setUserEmail(user.attributes.email);
        } else if (user && user.username && user.username.includes("@")) {
          setUserEmail(user.username);
        } else {
          try {
            const { fetchUserAttributes } = await import("aws-amplify/auth");
            const userAttributes = await fetchUserAttributes();
            if (userAttributes && userAttributes.email) {
              setUserEmail(userAttributes.email);
            } else {
              throw new Error("No email in user attributes");
            }
          } catch (attrError) {
            try {
              const { getCurrentUser } = await import("aws-amplify/auth");
              const userData = await getCurrentUser();
              if (
                userData &&
                userData.username &&
                userData.username.includes("@")
              ) {
                setUserEmail(userData.username);
              } else {
                throw new Error("No email format username in current user");
              }
            } catch (currentUserError) {
              throw new Error("Could not retrieve user email from any source");
            }
          }
        }
      } catch (error) {
        console.error("Failed to get user email:", error);
        setFetchError(
          `Error retrieving your email: ${error.message}. Please refresh or try again later.`
        );
      }
    };

    getUserEmail();
  }, [user]);

  // Create SNS client
  const createSNSClient = async () => {
    const { credentials } = await fetchAuthSession();
    return new SNSClient({
      region: process.env.REACT_APP_AWS_REGION || "ap-southeast-2",
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });
  };

  // Fetch available SNS topics
  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoadingTopics(true);
      setFetchError(null);

      try {
        const client = await createSNSClient();
        let allTopics = [];
        let nextToken = undefined;

        do {
          const input = nextToken ? { NextToken: nextToken } : {};
          const command = new ListTopicsCommand(input);
          const response = await client.send(command);

          if (response.Topics) {
            allTopics = [...allTopics, ...response.Topics];
          }
          nextToken = response.NextToken;
        } while (nextToken);

        if (allTopics.length === 0) {
          throw new Error("No SNS topics found in your AWS account");
        }

        const formattedTopics = allTopics.map((topic) => {
          const name = topic.TopicArn.split(":").pop();
          return {
            name: name,
            arn: topic.TopicArn,
            description: `Receive notifications from ${name}`,
          };
        });

        setAvailableTopics(formattedTopics);
        if (formattedTopics.length > 0) {
          setSelectedTopic(formattedTopics[0].arn);
        }
      } catch (error) {
        console.error("Failed to fetch SNS topics:", error);
        setFetchError(`Error loading SNS topics: ${error.message}`);
        setAvailableTopics([]);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    fetchTopics();
  }, []);

  // Handle subscribe
  const handleSubscribe = async () => {
    if (!userEmail) {
      setSubscriptionStatus("Cannot subscribe: Your email is not available");
      return;
    }

    if (!selectedTopic) {
      setSubscriptionStatus("Please select a topic to subscribe to");
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus("");

    try {
      const client = await createSNSClient();
      const input = {
        Protocol: "email",
        TopicArn: selectedTopic,
        Endpoint: userEmail,
        ReturnSubscriptionArn: true,
      };

      const command = new SubscribeCommand(input);
      const response = await client.send(command);

      if (response.SubscriptionArn) {
        const topicName = availableTopics.find(
          (topic) => topic.arn === selectedTopic
        )?.name;
        setSubscriptionStatus(
          `Successfully subscribed to "${topicName}"! Please check your email (${userEmail}) to confirm the subscription.`
        );
      } else {
        throw new Error(
          "Failed to create subscription - no subscription ARN returned"
        );
      }
    } catch (error) {
      console.error("Subscription error:", error);
      if (error.name === "AuthorizationErrorException") {
        setSubscriptionStatus(
          "Authorization error: You don't have permission to subscribe to this topic."
        );
      } else if (error.name === "InvalidParameterException") {
        setSubscriptionStatus("Error: Invalid parameters for subscription.");
      } else if (error.name === "NotFoundException") {
        setSubscriptionStatus("Error: The selected topic was not found.");
      } else if (error.name === "FilterPolicyLimitExceededException") {
        setSubscriptionStatus(
          "Error: Subscription filter policy limit exceeded."
        );
      } else {
        setSubscriptionStatus(`Failed to subscribe: ${error.message}`);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    if (!userEmail) {
      setSubscriptionStatus(
        "User email not available. Cannot fetch subscriptions."
      );
      return;
    }

    setIsLoadingSubscriptions(true);

    try {
      const client = await createSNSClient();
      let allSubscriptions = [];
      let nextToken = undefined;

      do {
        const input = nextToken ? { NextToken: nextToken } : {};
        const command = new ListSubscriptionsCommand(input);
        const response = await client.send(command);

        if (response.Subscriptions) {
          const userSubs = response.Subscriptions.filter(
            (sub) => sub.Protocol === "email" && sub.Endpoint === userEmail
          );
          allSubscriptions = [...allSubscriptions, ...userSubs];
        }
        nextToken = response.NextToken;
      } while (nextToken);

      const formattedSubscriptions = allSubscriptions.map((sub) => {
        const topicName = sub.TopicArn.split(":").pop();
        const endpoint = sub.Endpoint;
        const status = sub.SubscriptionArn.includes("PendingConfirmation")
          ? "Pending Confirmation"
          : "Confirmed";

        return {
          topicName,
          topicArn: sub.TopicArn,
          endpoint,
          status,
          subscriptionArn: sub.SubscriptionArn,
        };
      });

      setUserSubscriptions(formattedSubscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      setSubscriptionStatus(`Error loading subscriptions: ${error.message}`);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  // Handle unsubscribe
  const handleUnsubscribe = async (subscriptionArn) => {
    if (subscriptionArn.includes("PendingConfirmation")) {
      setSubscriptionStatus(
        "Cannot unsubscribe from pending confirmations. Please check your email to confirm or ignore to cancel."
      );
      return;
    }

    setIsUnsubscribing(true);
    setSubscriptionStatus("");

    try {
      const client = await createSNSClient();
      const input = { SubscriptionArn: subscriptionArn };
      const command = new UnsubscribeCommand(input);
      await client.send(command);

      setSubscriptionStatus("Successfully unsubscribed!");
      fetchSubscriptions();
    } catch (error) {
      console.error("Unsubscribe error:", error);
      if (error.name === "AuthorizationErrorException") {
        setSubscriptionStatus(
          "Authorization error: You don't have permission to unsubscribe from this topic."
        );
      } else if (error.name === "InvalidParameterException") {
        setSubscriptionStatus("Error: Invalid subscription ARN.");
      } else if (error.name === "NotFoundException") {
        setSubscriptionStatus(
          "Error: The subscription was not found. It may have already been deleted."
        );
        fetchSubscriptions();
      } else {
        setSubscriptionStatus(`Failed to unsubscribe: ${error.message}`);
      }
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return {
    userEmail,
    availableTopics,
    selectedTopic,
    setSelectedTopic,
    isLoadingTopics,
    isSubscribing,
    fetchError,
    userSubscriptions,
    isLoadingSubscriptions,
    isUnsubscribing,
    handleSubscribe,
    handleUnsubscribe,
    fetchSubscriptions,
  };
};
