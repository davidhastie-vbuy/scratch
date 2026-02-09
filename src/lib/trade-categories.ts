export const TRADE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "carpentry", label: "Carpentry" },
  { value: "painting_decorating", label: "Painting & Decorating" },
  { value: "roofing", label: "Roofing" },
  { value: "landscaping", label: "Landscaping" },
  { value: "plastering", label: "Plastering" },
  { value: "tiling", label: "Tiling" },
  { value: "gas_heating", label: "Gas & Heating" },
  { value: "locksmith", label: "Locksmith" },
  { value: "cleaning", label: "Cleaning" },
  { value: "general_maintenance", label: "General Maintenance" },
  { value: "other", label: "Other" },
] as const;

export type TradeCategory = (typeof TRADE_CATEGORIES)[number]["value"];
