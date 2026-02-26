// Maps CSV column names (lowercase) to FACT names (uppercase) and classifies data types
// Columns not in this map are kept as metadata (call_date, decision, rule, etc.)

export const COLUMN_MAP = {
  // Identity
  calling_party_country: { fact: "CALLING_PARTY_COUNTRY", type: "categorical" },
  calling_party_country_code: { fact: "CALLING_PARTY_COUNTRY_CODE", type: "numeric" },
  called_party_country: { fact: "CALLED_PARTY_COUNTRY", type: "categorical" },
  called_party_country_code: { fact: "CALLED_PARTY_COUNTRY_CODE", type: "numeric" },

  // Numbers
  calling_party_nbr: { fact: "CALLING_PARTY_NUMBER", type: "id" },
  called_party_nbr: { fact: "CALLED_PARTY_NUMBER", type: "id" },
  raw_calling_party_nbr: { fact: "RAW_CALLING_PARTY_NUMBER", type: "id" },
  raw_called_party_nbr: { fact: "RAW_CALLED_PARTY_NUMBER", type: "id" },
  original_called_number: { fact: "ORIGINAL_CALLED_NUMBER", type: "id" },
  additional_calling_party_number: { fact: "ADDITIONAL_CALLING_PARTY_NUMBER", type: "id" },

  // Numbering Plan
  calling_party_np_match: { fact: "NUMBERING_PLAN_MATCH", type: "boolean" },
  calling_party_number_type: { fact: "CALLING_PARTY_NUMBER_TYPE", type: "categorical" },
  called_party_number_type: { fact: "CALLED_PARTY_NUMBER_TYPE", type: "categorical" },
  np_porting_code: { fact: "CALLED_PARTY_PORTING_CODE", type: "categorical" },

  // Lists
  calling_party_whitelist: { fact: "CALLING_PARTY_WHITELISTED", type: "boolean" },
  calling_party_whitelist_type: { fact: "CALLING_PARTY_WHITELIST_SOURCE", type: "categorical" },
  called_party_blacklist: { fact: "CALLED_PARTY_BLACKLISTED", type: "boolean" },
  called_party_blacklist_source: { fact: "CALLED_PARTY_BLACKLIST_SOURCE", type: "categorical" },
  calling_party_blacklist: { fact: "CALLING_PARTY_BLACKLISTED", type: "boolean" },
  calling_party_blacklist_type: { fact: "CALLING_PARTY_BLACKLIST_SOURCE", type: "categorical" },
  calling_party_blacklist_reviewed: { fact: "CALLING_PARTY_BLACKLIST_REVIEW", type: "boolean" },

  // Signalling
  calling_party_noa: { fact: "ANUM_NATURE_OF_ADDRESS", type: "categorical" },
  srism_enabled: { fact: "SRISM_ENABLED", type: "boolean" },
  srism_result: { fact: "CALLING_PARTY_SRISM_RESULT", type: "categorical" },
  calling_party_exchange: { fact: "CALLING_PARTY_EXCHANGE", type: "categorical" },
  calling_party_ati_result: { fact: "CALLING_PARTY_ATI_RESULT", type: "categorical" },
  calling_party_ati_subscriber_state: { fact: "CALLING_PARTY_ATI_SUBSCRIBER_STATE", type: "categorical" },

  // Call Routing
  redirection_counter: { fact: "REDIRECTION_COUNTER", type: "numeric" },
  redirecting_indicator: { fact: "REDIRECTING_INDICATOR", type: "categorical" },
  redirecting_reason: { fact: "REDIRECTING_REASON", type: "categorical" },
  original_redirection_reason: { fact: "ORIGINAL_REDIRECTION_REASON", type: "categorical" },

  // Velocity
  anum_calls_24h: { fact: "ANUM_CALLS_24H", type: "numeric" },
  anum_called_24h: { fact: "ANUM_CALLED_24H", type: "numeric" },
  anum_calls_3d: { fact: "ANUM_CALLS_3D", type: "numeric" },
  anum_calls_7d: { fact: "ANUM_CALLS_7D", type: "numeric" },
  anum_calls_30d: { fact: "ANUM_CALLS_30D", type: "numeric" },
  anum_called_3d: { fact: "ANUM_CALLED_3D", type: "numeric" },
  anum_called_7d: { fact: "ANUM_CALLED_7D", type: "numeric" },
  anum_called_30d: { fact: "ANUM_CALLED_30D", type: "numeric" },
  anum_to_bnum_24h: { fact: "CALLING_PARTY_CALLS_TO_CALLED_PARTY_24H", type: "numeric" },
  anum_previous_bnum: { fact: "ANUM_PREVIOUS_BNUM", type: "numeric" },
  bnum_distinct_anum_10s: { fact: "BNUM_CALLS_1S", type: "numeric" },
  bnum_distinct_anum_30s: { fact: "BNUM_CALLS_2S", type: "numeric" },
  bnum_distinct_anum_24h: { fact: "BNUM_CALLS_24H", type: "numeric" },
  bnum_calls_24h: { fact: "BNUM_CALLS_24H_RAW", type: "numeric" },
  duplicate: { fact: "DUPLICATE", type: "numeric" },
  anum_clusters_24h: { fact: "NUM_CLUSTERS_24H", type: "numeric" },
  anum_clusters_3d: { fact: "NUM_CLUSTERS_3D", type: "numeric" },
  anum_clusters_7d: { fact: "NUM_CLUSTERS_7D", type: "numeric" },
  anum_clusters_30d: { fact: "NUM_CLUSTERS_30D", type: "numeric" },

  // Operator
  calling_party_home_operator: { fact: "HOME_OPERATOR", type: "categorical" },
  interconnect_operator: { fact: "TRANSIT_OPERATOR", type: "categorical" },
  called_party_home_operator: { fact: "CALLED_PARTY_HOME_OPERATOR", type: "categorical" },

  // Network
  node: { fact: "NODE", type: "categorical" },
  route: { fact: "ROUTE", type: "categorical" },
  service_key: { fact: "SERVICE_KEY", type: "numeric" },

  // Location
  mcc: { fact: "MCC", type: "numeric" },
  mnc: { fact: "MNC", type: "numeric" },
  lac: { fact: "LAC", type: "numeric" },
  cell_id: { fact: "CELL_ID", type: "numeric" },

  // MNP
  anum_mnp_lookup_attempted: { fact: "ANUM_MNP_LOOKUP_SUCCESS", type: "boolean" },
  anum_mnp_status: { fact: "ANUM_MNP_STATUS", type: "categorical" },

  // Rules/Labels
  a_label: { fact: "A_LABEL", type: "categorical" },
  b_label: { fact: "B_LABEL", type: "categorical" },

  // System
  suspend_count: { fact: "SUSPEND_COUNT", type: "numeric" },
};

// Metadata columns (not FACTS but useful for analysis context)
export const METADATA_COLS = [
  "call_date", "call_time", "call_ts", "decision", "rule",
  "first_call", "last_call", "complete_ts", "disconnect_time",
  "protocol", "calling_party_verify", "calling_party_location_nbr",
  "release_category", "timeout", "longitude", "latitude",
  "hlr_response", "calling_party_imsi", "srism_ts", "srism_duration",
  "called_party_always_continue", "regional_zone", "interconnect_type",
  "ati_enabled", "ati_rate_limited", "psi_enabled", "psi_rate_limited",
  "srism_prefix_match", "srism_rate_limited",
  "calling_party_blacklist_removed", "calling_party_blacklist_remove_rule",
  "calling_party_known", "calling_party_known_source",
  "calling_party_unknown", "calling_party_risklist", "calling_party_risklist_source",
];

// Get all numeric FACT column names for stats computation
export function getNumericCols() {
  return Object.entries(COLUMN_MAP)
    .filter(([, v]) => v.type === "numeric")
    .map(([csv, v]) => ({ csv, fact: v.fact }));
}

// Get all categorical FACT column names
export function getCategoricalCols() {
  return Object.entries(COLUMN_MAP)
    .filter(([, v]) => v.type === "categorical")
    .map(([csv, v]) => ({ csv, fact: v.fact }));
}

// Get all boolean columns
export function getBooleanCols() {
  return Object.entries(COLUMN_MAP)
    .filter(([, v]) => v.type === "boolean")
    .map(([csv, v]) => ({ csv, fact: v.fact }));
}
