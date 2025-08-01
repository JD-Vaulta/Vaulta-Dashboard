// src/hooks/useDocuments.js
import { useState, useEffect } from "react";
import { uploadData, getUrl, remove, list } from "@aws-amplify/storage";
import { generateClient } from "@aws-amplify/api";
import { fetchAuthSession } from "@aws-amplify/auth";
import { v4 as uuidv4 } from "uuid";

// Initialize GraphQL client
const client = generateClient();

// GraphQL operations - Using correct Amplify-generated names
const createUserDocument = `
  mutation CreateUserDocument($input: CreateUserDocumentInput!) {
    createUserDocument(input: $input) {
      id
      userId
      filename
      originalFilename
      documentType
      fileSize
      mimeType
      s3Key
      uploadDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

const listUserDocuments = `
  query ListUserDocuments($filter: ModelUserDocumentFilterInput) {
    listUserDocuments(filter: $filter) {
      items {
        id
        userId
        filename
        originalFilename
        documentType
        fileSize
        mimeType
        s3Key
        uploadDate
        lastAccessed
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

const updateUserDocument = `
  mutation UpdateUserDocument($input: UpdateUserDocumentInput!) {
    updateUserDocument(input: $input) {
      id
      isActive
      lastAccessed
      updatedAt
    }
  }
`;

// Alternative queries to try if the above don't work
const alternativeQueries = {
  // Try with different naming conventions
  listByOwner: `
    query ListUserDocumentsByUserId($userId: String!, $filter: ModelUserDocumentFilterInput) {
      listUserDocuments(filter: $filter) {
        items {
          id
          userId
          filename
          originalFilename
          documentType
          fileSize
          mimeType
          s3Key
          uploadDate
          lastAccessed
          isActive
          createdAt
          updatedAt
          owner
        }
      }
    }
  `,

  // Try querying by index
  byUserId: `
    query UserDocumentsByUserId($userId: String!, $sortDirection: ModelSortDirection, $filter: ModelUserDocumentFilterInput) {
      userDocumentsByUserId(userId: $userId, sortDirection: $sortDirection, filter: $filter) {
        items {
          id
          userId
          filename
          originalFilename
          documentType
          fileSize
          mimeType
          s3Key
          uploadDate
          lastAccessed
          isActive
          createdAt
          updatedAt
        }
      }
    }
  `,
};

// Helper function to extract GraphQL errors
const extractGraphQLErrors = (error) => {
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((err) => err.message || err.toString()).join("; ");
  }
  if (error?.message) {
    return error.message;
  }
  return error?.toString() || "Unknown error occurred";
};

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);

  const getCurrentUser = async () => {
    try {
      const session = await fetchAuthSession();
      if (!session || !session.userSub) {
        throw new Error("No valid session found");
      }
      return {
        userId: session.userSub,
        identityId: session.identityId,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      throw new Error("User not authenticated: " + extractGraphQLErrors(error));
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();

      console.log("Loading documents for user:", user.userId);

      let result = null;
      let queryAttempt = 1;

      // Try different query approaches due to complex auth rules
      try {
        console.log(
          `Query attempt ${queryAttempt}: Standard listUserDocuments`
        );
        result = await client.graphql({
          query: listUserDocuments,
          variables: {
            filter: {
              isActive: { eq: true },
            },
          },
        });
        console.log("✅ Standard query successful");
      } catch (firstError) {
        console.log(
          "❌ Standard query failed:",
          extractGraphQLErrors(firstError)
        );
        queryAttempt = 2;

        try {
          console.log(`Query attempt ${queryAttempt}: Using byUserId index`);
          result = await client.graphql({
            query: alternativeQueries.byUserId,
            variables: {
              userId: user.userId,
              sortDirection: "DESC",
              filter: {
                isActive: { eq: true },
              },
            },
          });
          console.log("✅ Index query successful");
        } catch (secondError) {
          console.log(
            "❌ Index query failed:",
            extractGraphQLErrors(secondError)
          );
          queryAttempt = 3;

          try {
            console.log(
              `Query attempt ${queryAttempt}: Simple listUserDocuments without userId filter`
            );
            result = await client.graphql({
              query: listUserDocuments,
              variables: {
                filter: {
                  isActive: { eq: true },
                },
              },
            });
            console.log("✅ Simple query successful");
          } catch (thirdError) {
            console.log("❌ All query attempts failed");
            throw thirdError;
          }
        }
      }

      console.log("GraphQL result:", result);

      if (result.errors) {
        throw result;
      }

      // Extract documents from different possible result structures
      let activeDocuments = [];
      if (result.data?.listUserDocuments?.items) {
        activeDocuments = result.data.listUserDocuments.items;
      } else if (result.data?.userDocumentsByUserId?.items) {
        activeDocuments = result.data.userDocumentsByUserId.items;
      }

      // Filter by current user (in case auth rules don't handle this)
      activeDocuments = activeDocuments.filter(
        (doc) => doc.userId === user.userId && doc.isActive === true
      );

      const sortedDocuments = activeDocuments.sort(
        (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
      );

      setDocuments(sortedDocuments);
      console.log("Loaded documents:", sortedDocuments.length);
    } catch (error) {
      console.error("Error loading documents:", error);
      const errorMessage = extractGraphQLErrors(error);
      setError("Failed to load documents: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    const errors = [];

    // Check file type
    if (file.type !== "application/pdf") {
      errors.push("Only PDF files are allowed");
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      errors.push("File size must be less than 10MB");
    }

    // Check filename length
    if (file.name.length > 255) {
      errors.push("Filename is too long");
    }

    return errors;
  };

  const sanitizeFilename = (filename) => {
    // Remove or replace special characters, keep only alphanumeric, dots, hyphens, underscores
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  };

  const uploadDocument = async (file, documentType = "OTHER") => {
    let fileId = null;
    try {
      const user = await getCurrentUser();

      // Validate file
      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      fileId = uuidv4();
      const fileExtension = file.name.split(".").pop() || "pdf";
      const sanitizedOriginalName = sanitizeFilename(file.name);
      const filename = `${fileId}.${fileExtension}`;

      // S3 key structure: documents/{documentType}/{filename}
      const s3Key = `documents/${documentType}/${filename}`;

      // Start upload progress tracking
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
      setError(null);

      console.log("Starting upload to S3 key:", s3Key);

      // Upload to S3 using Amplify Storage v6
      const uploadTask = uploadData({
        key: s3Key,
        data: file,
        options: {
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const percentage = Math.round(
                (transferredBytes / totalBytes) * 100
              );
              setUploadProgress((prev) => ({ ...prev, [fileId]: percentage }));
            }
          },
        },
      });

      const uploadResult = await uploadTask.result;
      console.log("Upload completed:", uploadResult);

      // Prepare document input - Add owner field for Amplify auth
      const documentInput = {
        userId: user.userId,
        filename: filename,
        originalFilename: sanitizedOriginalName,
        documentType: documentType,
        fileSize: file.size,
        mimeType: file.type,
        s3Key: s3Key,
        uploadDate: new Date().toISOString(),
        isActive: true,
        owner: user.userId, // Add explicit owner field for Amplify auth
      };

      console.log("Saving document metadata:", documentInput);

      // Try the mutation
      let dbResult = null;
      try {
        dbResult = await client.graphql({
          query: createUserDocument,
          variables: { input: documentInput },
        });
        console.log("✅ Create mutation successful");
      } catch (mutationError) {
        console.error("❌ Create mutation failed:", mutationError);

        // If mutation fails, we still have the file in S3
        // Let's try to provide helpful error information
        const errorMessage = extractGraphQLErrors(mutationError);

        if (
          errorMessage.includes("UnknownType") ||
          errorMessage.includes("FieldUndefined")
        ) {
          throw new Error(
            `Database schema issue: ${errorMessage}\n\nThe file was uploaded to S3 successfully, but couldn't save metadata. Please check your GraphQL schema deployment.`
          );
        } else if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("Access denied")
        ) {
          throw new Error(
            `Permission issue: ${errorMessage}\n\nPlease check your authentication and authorization settings.`
          );
        } else {
          throw new Error(`Database error: ${errorMessage}`);
        }
      }

      console.log("GraphQL create result:", dbResult);

      if (dbResult?.errors) {
        throw dbResult;
      }

      console.log("Document metadata saved successfully");

      // Refresh documents list
      await loadDocuments();

      return { success: true, fileId, result: uploadResult };
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = extractGraphQLErrors(error);
      setError(`Upload failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      // Clear upload progress after a delay
      if (fileId) {
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);
      }
    }
  };

  const downloadDocument = async (doc) => {
    try {
      setError(null);

      console.log("Downloading document:", doc.s3Key);

      // Update last accessed time (with error handling)
      try {
        await client.graphql({
          query: updateUserDocument,
          variables: {
            input: {
              id: doc.id,
              lastAccessed: new Date().toISOString(),
            },
          },
        });
      } catch (updateError) {
        console.warn("Failed to update last accessed time:", updateError);
        // Don't fail the download if we can't update the timestamp
      }

      // Get signed URL for download using Amplify Storage v6
      const getUrlResult = await getUrl({
        key: doc.s3Key,
        options: {
          expiresIn: 300, // 5 minutes
        },
      });

      console.log("Generated download URL");

      // Create temporary link and trigger download
      const link = window.document.createElement("a");
      link.href = getUrlResult.url.toString();
      link.download = doc.originalFilename;
      link.target = "_blank";
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage = extractGraphQLErrors(error);
      setError(`Download failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      setError(null);

      // Find the document to get S3 key
      const documentToDelete = documents.find((doc) => doc.id === documentId);
      if (!documentToDelete) {
        throw new Error("Document not found in local state");
      }

      console.log("Deleting document:", documentToDelete.s3Key);

      // Mark document as inactive in database
      const result = await client.graphql({
        query: updateUserDocument,
        variables: {
          input: {
            id: documentId,
            isActive: false,
          },
        },
      });

      if (result.errors) {
        throw result;
      }

      // Optionally remove from S3 (uncomment if you want to physically delete)
      // await remove({ key: documentToDelete.s3Key });

      console.log("Document marked as inactive successfully");

      // Refresh documents list
      await loadDocuments();

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = extractGraphQLErrors(error);
      setError(`Delete failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

  const getDocumentsByType = (documentType) => {
    return documents.filter((doc) => doc.documentType === documentType);
  };

  const getDocumentStats = () => {
    const stats = {
      total: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      byType: {},
    };

    documents.forEach((doc) => {
      if (!stats.byType[doc.documentType]) {
        stats.byType[doc.documentType] = { count: 0, size: 0 };
      }
      stats.byType[doc.documentType].count++;
      stats.byType[doc.documentType].size += doc.fileSize;
    });

    return stats;
  };

  // Test GraphQL connection
  const testConnection = async () => {
    try {
      const user = await getCurrentUser();
      console.log("✅ Authentication working:", user);

      // Test a simple GraphQL query
      const result = await client.graphql({
        query: `query { __typename }`,
      });
      console.log("✅ GraphQL connection working:", result);

      return true;
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      setError("Connection test failed: " + extractGraphQLErrors(error));
      return false;
    }
  };

  // Load documents on mount and when user changes
  useEffect(() => {
    // Test connection first, then load documents
    testConnection().then((success) => {
      if (success) {
        loadDocuments();
      }
    });
  }, []);

  return {
    documents,
    loading,
    uploadProgress,
    error,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refreshDocuments: loadDocuments,
    getDocumentsByType,
    getDocumentStats,
    clearError: () => setError(null),
    testConnection, // Export for debugging
  };
};
