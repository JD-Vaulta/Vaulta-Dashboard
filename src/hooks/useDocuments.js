// src/hooks/useDocuments.js
import { useState, useEffect } from "react";
import { uploadData, getUrl, remove, list } from "@aws-amplify/storage";
import { generateClient } from "@aws-amplify/api";
import { fetchAuthSession } from "@aws-amplify/auth";
import { v4 as uuidv4 } from "uuid";

// Initialize GraphQL client
const client = generateClient();

// GraphQL operations
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

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);

  const getCurrentUser = async () => {
    try {
      const session = await fetchAuthSession();
      return {
        userId: session.userSub,
        identityId: session.identityId,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      throw new Error("User not authenticated");
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();

      const result = await client.graphql({
        query: listUserDocuments,
        variables: {
          filter: {
            userId: { eq: user.userId },
            isActive: { eq: true },
          },
        },
      });

      const activeDocuments = result.data.listUserDocuments.items.sort(
        (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
      );

      setDocuments(activeDocuments);
    } catch (error) {
      console.error("Error loading documents:", error);
      setError("Failed to load documents: " + error.message);
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

      // Save metadata to DynamoDB
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
      };

      console.log("Saving document metadata:", documentInput);

      const dbResult = await client.graphql({
        query: createUserDocument,
        variables: { input: documentInput },
      });

      console.log("Document metadata saved:", dbResult);

      // Refresh documents list
      await loadDocuments();

      return { success: true, fileId, result: uploadResult };
    } catch (error) {
      console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
      return { success: false, error: error.message };
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

  const downloadDocument = async (document) => {
    try {
      setError(null);

      console.log("Downloading document:", document.s3Key);

      // Update last accessed time
      await client.graphql({
        query: updateUserDocument,
        variables: {
          input: {
            id: document.id,
            lastAccessed: new Date().toISOString(),
          },
        },
      });

      // Get signed URL for download using Amplify Storage v6
      const getUrlResult = await getUrl({
        key: document.s3Key,
        options: {
          expiresIn: 300, // 5 minutes
        },
      });

      console.log("Generated download URL");

      // Create temporary link and trigger download
      const link = document.createElement("a");
      link.href = getUrlResult.url.toString();
      link.download = document.originalFilename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error("Download error:", error);
      setError(`Download failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      setError(null);

      // Find the document to get S3 key
      const documentToDelete = documents.find((doc) => doc.id === documentId);
      if (!documentToDelete) {
        throw new Error("Document not found");
      }

      console.log("Deleting document:", documentToDelete.s3Key);

      // Mark document as inactive in database
      await client.graphql({
        query: updateUserDocument,
        variables: {
          input: {
            id: documentId,
            isActive: false,
          },
        },
      });

      // Optionally remove from S3 (uncomment if you want to physically delete)
      // await remove({ key: documentToDelete.s3Key });

      // Refresh documents list
      await loadDocuments();

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      setError(`Delete failed: ${error.message}`);
      return { success: false, error: error.message };
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

  // Load documents on mount and when user changes
  useEffect(() => {
    loadDocuments();
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
  };
};
