// src/pages/warranty/components/DocumentManager.js
import React, { useState } from "react";
import { useDocuments } from "../../../hooks/useDocuments.js";
import { DOCUMENT_CATEGORIES } from "../../../utils/documentCategories.js";

const DocumentManager = () => {
  const {
    documents,
    loading,
    uploadProgress,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    error,
    clearError,
    refreshDocuments,
  } = useDocuments();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const filteredDocuments = documents.filter(
    (doc) => selectedCategory === "ALL" || doc.documentType === selectedCategory
  );

  const handleFileUpload = async (files, documentType = "OTHER") => {
    clearError();
    setUploadingFiles(true);

    try {
      for (const file of files) {
        // Basic client-side validation
        if (file.type !== "application/pdf") {
          alert(`Skipping "${file.name}": Only PDF files are allowed`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`Skipping "${file.name}": File size must be less than 10MB`);
          continue;
        }

        console.log(`Uploading ${file.name} as ${documentType}`);
        const result = await uploadDocument(file, documentType);

        if (!result.success) {
          console.error(`Failed to upload ${file.name}:`, result.error);
        } else {
          console.log(`Successfully uploaded ${file.name}`);
        }
      }
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalStorageUsed = () => {
    const totalBytes = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    return formatFileSize(totalBytes);
  };

  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            margin: 0,
          }}
        >
          Document Management
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "0.8rem", color: "#666" }}>
            {documents.length} documents • {getTotalStorageUsed()} used
          </span>
          <button
            onClick={refreshDocuments}
            disabled={loading}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "15px",
            color: "#721c24",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>{error}</span>
          <button
            onClick={clearError}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#721c24",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0 5px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        style={{
          backgroundColor: dragOver ? "#e3f2fd" : "#fff",
          border: dragOver ? "2px dashed #1259c3" : "2px dashed #ccc",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
          transition: "all 0.3s ease",
          opacity: uploadingFiles ? 0.7 : 1,
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
          {uploadingFiles ? "⏳" : "📁"}
        </div>
        <p style={{ marginBottom: "10px", color: "#666" }}>
          {uploadingFiles
            ? "Uploading files to AWS S3..."
            : "Drag & drop PDF files here, or click to select"}
        </p>

        {/* Document Type Selector */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ fontSize: "0.9rem", color: "#666", marginRight: "10px" }}
          >
            Document Type:
          </label>
          <select
            id="upload-document-type"
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.9rem",
            }}
            defaultValue="OTHER"
          >
            {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        <input
          type="file"
          multiple
          accept=".pdf"
          disabled={uploadingFiles}
          onChange={(e) => {
            const files = Array.from(e.target.files);
            const selectedType = document.getElementById(
              "upload-document-type"
            ).value;
            handleFileUpload(files, selectedType);
          }}
          style={{ display: "none" }}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{
            backgroundColor: uploadingFiles ? "#ccc" : "#1259c3",
            color: "white",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: uploadingFiles ? "not-allowed" : "pointer",
            display: "inline-block",
            border: "none",
          }}
        >
          {uploadingFiles ? "Uploading..." : "Select Files"}
        </label>
        <p style={{ fontSize: "0.8rem", color: "#999", marginTop: "5px" }}>
          PDF files only, max 10MB each • Stored securely in AWS S3
        </p>
      </div>

      {/* Category Filter */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label style={{ fontSize: "0.9rem", color: "#666" }}>Filter:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            fontSize: "0.9rem",
          }}
        >
          <option value="ALL">All Documents ({documents.length})</option>
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => {
            const count = documents.filter(
              (doc) => doc.documentType === key
            ).length;
            return (
              <option key={key} value={key}>
                {category.icon} {category.label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "10px", color: "#333" }}>
            Upload Progress
          </h3>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div
              key={fileId}
              style={{
                backgroundColor: "#fff",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "8px",
                border: "1px solid #e0e0e0",
                boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                  Uploading to AWS S3...
                </span>
                <span style={{ fontSize: "0.9rem", color: "#4caf50" }}>
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: progress === 100 ? "#4caf50" : "#1259c3",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents List */}
      {loading && documents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>
          <div style={{ fontSize: "1rem", color: "#666" }}>
            Loading documents from AWS...
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#fff",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📄</div>
          <div
            style={{ fontSize: "1.1rem", color: "#333", marginBottom: "8px" }}
          >
            {selectedCategory === "ALL"
              ? "No documents uploaded yet"
              : `No ${DOCUMENT_CATEGORIES[
                  selectedCategory
                ]?.label.toLowerCase()} found`}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            Upload your first document using the area above
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredDocuments.map((document) => {
            const category =
              DOCUMENT_CATEGORIES[document.documentType] ||
              DOCUMENT_CATEGORIES.OTHER;
            return (
              <div
                key={document.id}
                style={{
                  backgroundColor: "#fff",
                  padding: "16px",
                  borderRadius: "10px",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #e0e0e0",
                  transition: "transform 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0px 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0px 2px 8px rgba(0,0,0,0.08)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2rem",
                      marginRight: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {category.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        marginBottom: "4px",
                        wordBreak: "break-word",
                        lineHeight: "1.3",
                      }}
                    >
                      {document.originalFilename}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: category.color,
                        marginBottom: "4px",
                        fontWeight: "500",
                      }}
                    >
                      {category.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      {formatFileSize(document.fileSize)} • Uploaded{" "}
                      {formatDate(document.uploadDate)}
                    </div>
                    {document.lastAccessed && (
                      <div style={{ fontSize: "0.75rem", color: "#999" }}>
                        Last accessed {formatDate(document.lastAccessed)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => downloadDocument(document)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      flex: 1,
                      fontWeight: "500",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#45a049")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#4caf50")
                    }
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete "${document.originalFilename}"?\n\nThis action cannot be undone.`
                        )
                      ) {
                        deleteDocument(document.id);
                      }
                    }}
                    style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#da190b")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#f44336")
                    }
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Storage Info */}
      {documents.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              🔒 Securely stored in AWS S3 bucket:{" "}
              <code>authapp-document-storage</code>
            </span>
            <span style={{ fontSize: "0.8rem", color: "#999" }}>
              All files are private and encrypted
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
