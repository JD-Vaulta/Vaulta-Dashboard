export const getWarrantyInfo = (bmsData) => {
  const currentData = bmsData?.lastMinuteData?.[0] || {};

  return {
    serialNumber: currentData.SerialNumber?.N || "BMS-2023-00145",
    purchaseDate: "2023-06-15",
    warrantyPeriod: "5 years",
    expiryDate: "2028-06-15",
    status: "Active",
    coverageType: "Full Coverage",
    remainingCycles: 4000,
    manufacturer: "Vaulta Systems",
  };
};
