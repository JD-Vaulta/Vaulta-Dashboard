// src/components/GraphQLDiagnostic.js
import React, { useState } from "react";
import { generateClient } from "@aws-amplify/api";
import { fetchAuthSession } from "@aws-amplify/auth";

const client = generateClient();

const GraphQLDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message, data = null) => {
    setResults((prev) => [
      ...prev,
      { test, status, message, data, timestamp: new Date().toISOString() },
    ]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    setLoading(true);

    try {
      // Test 1: Authentication
      addResult("Auth Test", "running", "Testing authentication...");
      const session = await fetchAuthSession();
      if (session && session.userSub) {
        addResult(
          "Auth Test",
          "success",
          `✅ Authenticated as: ${session.userSub}`,
          {
            userId: session.userSub,
            identityId: session.identityId,
          }
        );
      } else {
        addResult("Auth Test", "error", "❌ No valid session found");
        setLoading(false);
        return;
      }

      // Test 2: Basic GraphQL Connection
      addResult(
        "GraphQL Connection",
        "running",
        "Testing basic GraphQL connection..."
      );
      try {
        const basicResult = await client.graphql({
          query: `query { __typename }`,
        });
        addResult(
          "GraphQL Connection",
          "success",
          "✅ GraphQL endpoint is reachable",
          basicResult
        );
      } catch (error) {
        addResult(
          "GraphQL Connection",
          "error",
          `❌ GraphQL connection failed: ${error.message}`,
          error
        );
        setLoading(false);
        return;
      }

      // Test 3: Schema Introspection
      addResult("Schema Check", "running", "Checking available types...");
      try {
        const schemaResult = await client.graphql({
          query: `
            query {
              __schema {
                types {
                  name
                  kind
                }
              }
            }
          `,
        });
        const types = schemaResult.data.__schema.types
          .filter((type) => !type.name.startsWith("__"))
          .map((type) => type.name);
        addResult(
          "Schema Check",
          "success",
          `✅ Found ${types.length} custom types`,
          types
        );
      } catch (error) {
        addResult(
          "Schema Check",
          "warning",
          `⚠️ Schema introspection failed: ${error.message}`,
          error
        );
      }

      // Test 4: Check for UserDocument type and its fields
      addResult(
        "UserDocument Type",
        "running",
        "Checking UserDocument type and fields..."
      );
      try {
        const typeResult = await client.graphql({
          query: `
            query {
              __type(name: "UserDocument") {
                name
                fields {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          `,
        });
        if (typeResult.data.__type) {
          const fields = typeResult.data.__type.fields.map((f) => f.name);
          addResult(
            "UserDocument Type",
            "success",
            `✅ UserDocument type exists with ${fields.length} fields`,
            {
              fields: fields,
              details: typeResult.data.__type.fields,
            }
          );
        } else {
          addResult(
            "UserDocument Type",
            "error",
            "❌ UserDocument type not found - check your schema deployment"
          );
        }
      } catch (error) {
        addResult(
          "UserDocument Type",
          "error",
          `❌ Error checking UserDocument type: ${error.message}`,
          error
        );
      }

      // Test 5: Check for specific input types
      addResult(
        "Input Types Check",
        "running",
        "Checking for CreateUserDocumentInput type..."
      );
      try {
        const inputTypeResult = await client.graphql({
          query: `
            query {
              __type(name: "CreateUserDocumentInput") {
                name
                inputFields {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          `,
        });
        if (inputTypeResult.data.__type) {
          const inputFields = inputTypeResult.data.__type.inputFields.map(
            (f) => f.name
          );
          addResult(
            "Input Types Check",
            "success",
            `✅ CreateUserDocumentInput exists with fields: ${inputFields.join(
              ", "
            )}`,
            inputTypeResult.data.__type
          );
        } else {
          addResult(
            "Input Types Check",
            "error",
            "❌ CreateUserDocumentInput type not found"
          );
        }
      } catch (error) {
        addResult(
          "Input Types Check",
          "error",
          `❌ Error checking input types: ${error.message}`,
          error
        );
      }

      // Test 6: Check for specific mutations
      addResult(
        "Mutations Check",
        "running",
        "Checking for createUserDocument mutation..."
      );
      try {
        const mutationsResult = await client.graphql({
          query: `
            query {
              __schema {
                mutationType {
                  fields {
                    name
                    args {
                      name
                      type {
                        name
                        kind
                        ofType {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
        });
        const mutations =
          mutationsResult.data.__schema.mutationType?.fields || [];
        const createMutation = mutations.find(
          (m) => m.name === "createUserDocument"
        );
        const updateMutation = mutations.find(
          (m) => m.name === "updateUserDocument"
        );
        const deleteMutation = mutations.find(
          (m) => m.name === "deleteUserDocument"
        );

        const documentMutations = mutations.filter(
          (m) =>
            m.name.toLowerCase().includes("document") ||
            m.name.toLowerCase().includes("userdocument")
        );

        addResult(
          "Mutations Check",
          "success",
          `Found ${documentMutations.length} document mutations. ` +
            `createUserDocument: ${createMutation ? "✅" : "❌"}, ` +
            `updateUserDocument: ${updateMutation ? "✅" : "❌"}, ` +
            `deleteUserDocument: ${deleteMutation ? "✅" : "❌"}`,
          {
            allDocumentMutations: documentMutations.map((m) => m.name),
            createUserDocument: createMutation,
            updateUserDocument: updateMutation,
            deleteUserDocument: deleteMutation,
          }
        );
      } catch (error) {
        addResult(
          "Mutations Check",
          "error",
          `❌ Error checking mutations: ${error.message}`,
          error
        );
      }

      // Test 7: Check for specific queries
      addResult(
        "Queries Check",
        "running",
        "Checking for listUserDocuments and related queries..."
      );
      try {
        const queriesResult = await client.graphql({
          query: `
            query {
              __schema {
                queryType {
                  fields {
                    name
                    args {
                      name
                      type {
                        name
                        kind
                      }
                    }
                  }
                }
              }
            }
          `,
        });
        const queries = queriesResult.data.__schema.queryType?.fields || [];
        const listQuery = queries.find((q) => q.name === "listUserDocuments");
        const getQuery = queries.find((q) => q.name === "getUserDocument");
        const byUserIdQuery = queries.find(
          (q) => q.name === "userDocumentsByUserId"
        );

        const documentQueries = queries.filter(
          (q) =>
            q.name.toLowerCase().includes("document") ||
            q.name.toLowerCase().includes("userdocument")
        );

        addResult(
          "Queries Check",
          "success",
          `Found ${documentQueries.length} document queries. ` +
            `listUserDocuments: ${listQuery ? "✅" : "❌"}, ` +
            `getUserDocument: ${getQuery ? "✅" : "❌"}, ` +
            `userDocumentsByUserId: ${byUserIdQuery ? "✅" : "❌"}`,
          {
            allDocumentQueries: documentQueries.map((q) => q.name),
            listUserDocuments: listQuery,
            getUserDocument: getQuery,
            userDocumentsByUserId: byUserIdQuery,
          }
        );
      } catch (error) {
        addResult(
          "Queries Check",
          "error",
          `❌ Error checking queries: ${error.message}`,
          error
        );
      }

      // Test 8: Try actual listUserDocuments query with different approaches
      addResult(
        "List Documents Test",
        "running",
        "Testing listUserDocuments query with different approaches..."
      );
      try {
        let listResult = null;
        let queryUsed = "";

        // Try approach 1: Standard filter
        try {
          queryUsed = "Standard listUserDocuments with isActive filter";
          listResult = await client.graphql({
            query: `
              query ListUserDocuments($filter: ModelUserDocumentFilterInput) {
                listUserDocuments(filter: $filter) {
                  items {
                    id
                    userId
                    filename
                    originalFilename
                    documentType
                    fileSize
                    uploadDate
                    isActive
                  }
                }
              }
            `,
            variables: {
              filter: {
                isActive: { eq: true },
              },
            },
          });
        } catch (firstError) {
          // Try approach 2: No filter
          try {
            queryUsed = "Simple listUserDocuments without filter";
            listResult = await client.graphql({
              query: `
                query ListUserDocuments {
                  listUserDocuments {
                    items {
                      id
                      userId
                      filename
                      originalFilename
                      documentType
                      fileSize
                      uploadDate
                      isActive
                    }
                  }
                }
              `,
            });
          } catch (secondError) {
            // Try approach 3: By index if it exists
            try {
              queryUsed = "userDocumentsByUserId index query";
              listResult = await client.graphql({
                query: `
                  query UserDocumentsByUserId($userId: String!) {
                    userDocumentsByUserId(userId: $userId) {
                      items {
                        id
                        userId
                        filename
                        originalFilename
                        documentType
                        fileSize
                        uploadDate
                        isActive
                      }
                    }
                  }
                `,
                variables: {
                  userId: session.userSub,
                },
              });
            } catch (thirdError) {
              throw thirdError;
            }
          }
        }

        if (listResult) {
          const items =
            listResult.data?.listUserDocuments?.items ||
            listResult.data?.userDocumentsByUserId?.items ||
            [];
          addResult(
            "List Documents Test",
            "success",
            `✅ Query successful using: ${queryUsed}. Found ${items.length} documents`,
            { queryUsed, items: items.slice(0, 3) } // Only show first 3 for brevity
          );
        }
      } catch (error) {
        addResult(
          "List Documents Test",
          "error",
          `❌ All list query attempts failed: ${error.message}`,
          error
        );
      }

      // Test 9: Try createUserDocument mutation (non-destructive test)
      addResult(
        "Create Document Test",
        "running",
        "Testing createUserDocument mutation availability..."
      );
      try {
        // First, just test the mutation structure without actually creating
        const mutationTest = await client.graphql({
          query: `
            query {
              __schema {
                mutationType {
                  fields(includeDeprecated: true) {
                    name
                    args {
                      name
                      type {
                        name
                        kind
                        ofType {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
        });

        const createMutation =
          mutationTest.data.__schema.mutationType.fields.find(
            (f) => f.name === "createUserDocument"
          );
        if (createMutation) {
          addResult(
            "Create Document Test",
            "success",
            "✅ createUserDocument mutation exists and is available",
            { mutation: createMutation }
          );
        } else {
          addResult(
            "Create Document Test",
            "error",
            "❌ createUserDocument mutation not found in schema. This explains the upload failure.",
            {
              availableMutations:
                mutationTest.data.__schema.mutationType.fields.map(
                  (f) => f.name
                ),
            }
          );
        }
      } catch (error) {
        addResult(
          "Create Document Test",
          "error",
          `❌ Error testing create mutation: ${error.message}`,
          error
        );
      }
    } catch (error) {
      addResult(
        "General Error",
        "error",
        `❌ Unexpected error: ${error.message}`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#4caf50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "running":
        return "#2196f3";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "running":
        return "🔄";
      default:
        return "ℹ️";
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>GraphQL Diagnostic Tool</h2>
      <p>
        This tool will help identify issues with your GraphQL schema and
        authentication.
      </p>

      <button
        onClick={runDiagnostics}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#ccc" : "#1259c3",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Running Diagnostics..." : "Run Diagnostics"}
      </button>

      <div>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#f9f9f9",
              border: `2px solid ${getStatusColor(result.status)}`,
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
                color: getStatusColor(result.status),
                fontWeight: "bold",
              }}
            >
              <span style={{ marginRight: "10px" }}>
                {getStatusIcon(result.status)}
              </span>
              {result.test}
            </div>
            <div style={{ marginBottom: "10px" }}>{result.message}</div>
            {result.data && (
              <details style={{ fontSize: "0.9em", color: "#666" }}>
                <summary style={{ cursor: "pointer", marginBottom: "5px" }}>
                  Show Details
                </summary>
                <pre
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: "10px",
                    borderRadius: "4px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
            <div style={{ fontSize: "0.8em", color: "#999", marginTop: "5px" }}>
              {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
          }}
        >
          <h3>Common Issues & Solutions:</h3>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#d32f2f", margin: "10px 0" }}>
              🔥 Most Likely Issue: Schema Not Deployed
            </h4>
            <p>
              Based on your error, the most likely cause is that your GraphQL
              schema hasn't been properly deployed:
            </p>
            <ol style={{ lineHeight: "1.8" }}>
              <li>
                <strong>Run deployment:</strong> <code>amplify push</code> or{" "}
                <code>amplify api update</code>
              </li>
              <li>
                <strong>Check status:</strong> <code>amplify status</code>
              </li>
              <li>
                <strong>Verify in AWS Console:</strong> Check your AppSync API
              </li>
              <li>
                <strong>Regenerate types:</strong> <code>amplify codegen</code>
              </li>
            </ol>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#f57c00", margin: "10px 0" }}>
              ⚠️ Auth Rules Issues
            </h4>
            <p>
              Your schema has complex auth rules that might be preventing
              mutation generation:
            </p>
            <ul style={{ lineHeight: "1.6" }}>
              <li>
                <strong>Field-level auth:</strong> Too many <code>@auth</code>{" "}
                rules on individual fields might interfere with mutation
                generation
              </li>
              <li>
                <strong>Owner rule:</strong> Make sure the <code>owner</code>{" "}
                field is being set correctly
              </li>
              <li>
                <strong>Simplify for testing:</strong> Try temporarily removing
                field-level auth rules and only keep the type-level rule
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#388e3c", margin: "10px 0" }}>
              ✅ Quick Fixes to Try
            </h4>
            <ol style={{ lineHeight: "1.8" }}>
              <li>
                <strong>Simple schema test:</strong> Create a minimal
                UserDocument type without complex auth rules
              </li>
              <li>
                <strong>Check owner field:</strong> Add an explicit{" "}
                <code>owner: String @auth(rules: [allow: owner])</code> field
              </li>
              <li>
                <strong>Verify enum:</strong> Make sure the DocumentType enum is
                properly defined
              </li>
              <li>
                <strong>Index issues:</strong> The <code>@index</code>{" "}
                directives might be causing problems - try removing them
                temporarily
              </li>
            </ol>
          </div>

          <div>
            <h4 style={{ color: "#1976d2", margin: "10px 0" }}>
              🔧 Alternative Schema
            </h4>
            <p>If issues persist, try this simplified schema:</p>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "0.9em",
                overflow: "auto",
              }}
            >
              {`type UserDocument @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  userId: String!
  filename: String!
  originalFilename: String!
  documentType: DocumentType!
  fileSize: Int!
  mimeType: String!
  s3Key: String!
  uploadDate: AWSDateTime!
  lastAccessed: AWSDateTime
  isActive: Boolean!
  owner: String @auth(rules: [{ allow: owner }])
}

enum DocumentType {
  LICENSE PERMIT SHIPPING CERTIFICATE WARRANTY
  INSTALLATION MAINTENANCE COMPLIANCE INSURANCE
  CUSTOMS OTHER
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphQLDiagnostic;
