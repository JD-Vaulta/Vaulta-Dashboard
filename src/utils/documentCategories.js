// src/utils/documentCategories.js

export const DOCUMENT_CATEGORIES = {
  LICENSE: {
    label: "Licenses",
    icon: "📄",
    description: "Professional and business licenses",
    color: "#2196F3",
    examples: ["Business License", "Professional License", "Operating License"],
  },
  PERMIT: {
    label: "Carry Permits",
    icon: "✅",
    description: "Carry permits and authorizations",
    color: "#4CAF50",
    examples: ["Carry Permit", "Installation Permit", "Transport Permit"],
  },
  SHIPPING: {
    label: "Shipping Documents",
    icon: "🚢",
    description: "International shipping and customs documents",
    color: "#FF9800",
    examples: [
      "Bill of Lading",
      "Customs Declaration",
      "Export License",
      "Import License",
    ],
  },
  CERTIFICATE: {
    label: "Certificates",
    icon: "🏆",
    description: "Certification and compliance documents",
    color: "#9C27B0",
    examples: [
      "Safety Certificate",
      "Quality Certificate",
      "Compliance Certificate",
    ],
  },
  WARRANTY: {
    label: "Warranty Documents",
    icon: "🛡️",
    description: "Product warranties and guarantees",
    color: "#F44336",
    examples: ["Product Warranty", "Extended Warranty", "Service Agreement"],
  },
  INSTALLATION: {
    label: "Installation Records",
    icon: "🔧",
    description: "Installation and setup documentation",
    color: "#607D8B",
    examples: [
      "Installation Report",
      "Setup Instructions",
      "Configuration Details",
    ],
  },
  MAINTENANCE: {
    label: "Maintenance Records",
    icon: "⚙️",
    description: "Service and maintenance logs",
    color: "#795548",
    examples: ["Service Report", "Maintenance Log", "Repair Record"],
  },
  COMPLIANCE: {
    label: "Compliance Documents",
    icon: "📋",
    description: "Regulatory compliance documents",
    color: "#3F51B5",
    examples: [
      "Safety Compliance",
      "Environmental Compliance",
      "Regulatory Filing",
    ],
  },
  INSURANCE: {
    label: "Insurance Documents",
    icon: "🛡️",
    description: "Insurance policies and claims",
    color: "#009688",
    examples: ["Insurance Policy", "Claim Form", "Coverage Certificate"],
  },
  CUSTOMS: {
    label: "Customs Documents",
    icon: "🏛️",
    description: "Customs and border control documents",
    color: "#E91E63",
    examples: [
      "Customs Declaration",
      "Duty Payment Receipt",
      "Import/Export Declaration",
    ],
  },
  OTHER: {
    label: "Other Documents",
    icon: "📁",
    description: "Miscellaneous documents",
    color: "#757575",
    examples: ["General Documents", "Miscellaneous Files"],
  },
};

// Helper function to get category info by key
export const getCategoryInfo = (categoryKey) => {
  return DOCUMENT_CATEGORIES[categoryKey] || DOCUMENT_CATEGORIES.OTHER;
};

// Helper function to get all category keys
export const getCategoryKeys = () => {
  return Object.keys(DOCUMENT_CATEGORIES);
};

// Helper function to get categories as array
export const getCategoriesArray = () => {
  return Object.entries(DOCUMENT_CATEGORIES).map(([key, value]) => ({
    key,
    ...value,
  }));
};

// Helper function to validate document type
export const isValidDocumentType = (documentType) => {
  return Object.keys(DOCUMENT_CATEGORIES).includes(documentType);
};

// Helper function to get category options for select dropdown
export const getCategoryOptions = () => {
  return Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => ({
    value: key,
    label: `${category.icon} ${category.label}`,
    description: category.description,
  }));
};
