// All available FACTS (parameters/KPIs) for the fraud firewall
export const FACTS = [
  // ── Identity ──
  { name: "CUSTOMER_COUNTRY", desc: "Country name from platform config", type: "STRING", cat: "Identity" },
  { name: "CALLING_PARTY_COUNTRY", desc: "Country associated with calling-party-number", type: "STRING", cat: "Identity" },
  { name: "CALLING_PARTY_COUNTRY_CODE", desc: "Country-code of calling-party-number", type: "INTEGER", cat: "Identity" },
  { name: "CALLED_PARTY_COUNTRY", desc: "Country of called-party-number", type: "STRING", cat: "Identity" },
  { name: "CALLED_PARTY_COUNTRY_CODE", desc: "Country-code of called-party-number", type: "INTEGER", cat: "Identity" },

  // ── Numbers ──
  { name: "RAW_CALLING_PARTY_NUMBER", desc: "Calling party number without normalisation", type: "STRING", cat: "Numbers" },
  { name: "RAW_CALLED_PARTY_NUMBER", desc: "Called party number without normalisation", type: "STRING", cat: "Numbers" },
  { name: "CALLING_PARTY_NUMBER", desc: "Calling party number", type: "STRING", cat: "Numbers" },
  { name: "CALLED_PARTY_NUMBER", desc: "Called party number", type: "STRING", cat: "Numbers" },
  { name: "CALLING_PARTY_NUMBER_LENGTH", desc: "Number of digits in calling-party-number", type: "INTEGER", cat: "Numbers" },
  { name: "ORIGINAL_CALLED_NUMBER", desc: "Original called number", type: "STRING", cat: "Numbers" },
  { name: "ORIGINAL_CALLED_NUMBER_COUNTRY_CODE", desc: "Country code of original called number", type: "INTEGER", cat: "Numbers" },
  { name: "ORIGINAL_CALLED_NUMBER_HOME_OPERATOR", desc: "Home operator of original called number", type: "STRING", cat: "Numbers" },
  { name: "ADDITIONAL_CALLING_PARTY_NUMBER", desc: "Additional calling party number", type: "STRING", cat: "Numbers" },

  // ── Numbering Plan ──
  { name: "NUMBERING_PLAN_MATCH", desc: "Calling party matched the numbering plan", type: "BOOLEAN", cat: "Numbering Plan" },
  { name: "CALLING_PARTY_NUMBER_TYPE", desc: "Calling party number type from numbering plan", type: "STRING", cat: "Numbering Plan" },
  { name: "CALLED_PARTY_NUMBER_TYPE", desc: "Called party number type", type: "STRING", cat: "Numbering Plan" },
  { name: "CALLED_PARTY_PORTING_CODE", desc: "MNP porting code for called party", type: "STRING", cat: "Numbering Plan" },

  // ── Lists ──
  { name: "CALLING_PARTY_WHITELISTED", desc: "Calling party is whitelisted", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLING_PARTY_WHITELIST_SOURCE", desc: "Source of calling party whitelist", type: "ARRAY", cat: "Lists" },
  { name: "CALLED_PARTY_WHITELISTED", desc: "Called party is whitelisted", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLED_PARTY_WHITELIST_SOURCE", desc: "Source of called party whitelist", type: "ARRAY", cat: "Lists" },
  { name: "ORIGINAL_CALLED_NUMBER_WHITELISTED", desc: "Original Called Number is whitelisted", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLISTED", desc: "Calling party is blacklisted", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLIST_SOURCE", desc: "Source of calling party blacklist", type: "STRING", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLIST_CATEGORY", desc: "Rule category which triggered blacklist", type: "STRING", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLIST_REVIEW", desc: "Is calling-party blacklist eligible for review", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLISTED_CALLS", desc: "Call attempts blocked by this blacklist", type: "INTEGER", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLISTED_BNUMS", desc: "Called-parties blocked by this blacklist", type: "INTEGER", cat: "Lists" },
  { name: "CALLING_PARTY_BLACKLIST_RATIO", desc: "Ratio of called-parties to call-attempts blocked", type: "DOUBLE", cat: "Lists" },
  { name: "CALLED_PARTY_BLACKLISTED", desc: "Called party is blacklisted", type: "BOOLEAN", cat: "Lists" },
  { name: "CALLED_PARTY_BLACKLIST_SOURCE", desc: "Source of called party blacklist", type: "STRING", cat: "Lists" },
  { name: "BLACKLIST_TIME_SINCE_CREATED", desc: "Seconds since blacklist was created", type: "INTEGER", cat: "Lists" },

  // ── Signalling ──
  { name: "ANUM_NATURE_OF_ADDRESS", desc: "Calling party nature-of-address from InitialDP", type: "STRING", cat: "Signalling" },
  { name: "BNUM_NATURE_OF_ADDRESS", desc: "Called party nature-of-address from InitialDP", type: "STRING", cat: "Signalling" },
  { name: "BNUM_TYPE_OF_NUMBER", desc: "Called party type-of-number from InitialDP", type: "STRING", cat: "Signalling" },
  { name: "CALLING_PARTY_SRISM_RESULT", desc: "Calling party SEND_SRISM result", type: "STRING", cat: "Signalling" },
  { name: "CALLING_PARTY_EXCHANGE", desc: "Calling party exchange from SRISM lookup", type: "STRING", cat: "Signalling" },
  { name: "CALLING_PARTY_ATI_RESULT", desc: "MAP response for ATI request", type: "STRING", cat: "Signalling" },
  { name: "CALLING_PARTY_ATI_SUBSCRIBER_STATE", desc: "Subscriber state from ATI query", type: "STRING", cat: "Signalling" },
  { name: "ATI_SUCCESS_PCT", desc: "Percent successful ATI responses in past 5 min", type: "INTEGER", cat: "Signalling" },
  { name: "SRISM_ENABLED", desc: "Is SEND_SRISM enabled for home operator", type: "BOOLEAN", cat: "Signalling" },
  { name: "TMT_RESPONSE", desc: "JSON response from TMT service", type: "STRING", cat: "Signalling" },
  { name: "ANUM_ERROR_CODE", desc: "Error code from a-number verification", type: "INT8", cat: "Signalling" },
  { name: "ANUM_ERROR_MESSAGE", desc: "Error message from a-number verification", type: "STRING", cat: "Signalling" },

  // ── Call Routing ──
  { name: "REDIRECTION_COUNTER", desc: "Times call has been redirected", type: "INT8", cat: "Call Routing" },
  { name: "REDIRECTING_INDICATOR", desc: "Indicator for why call was redirected", type: "STRING", cat: "Call Routing" },
  { name: "REDIRECTING_REASON", desc: "Reason call was redirected", type: "STRING", cat: "Call Routing" },
  { name: "ORIGINAL_REDIRECTION_REASON", desc: "Original redirection reason", type: "STRING", cat: "Call Routing" },

  // ── Velocity ──
  { name: "BLACKLISTED_REDIAL_1", desc: "B-nums called before and 1+ times after blacklist", type: "INT8", cat: "Velocity" },
  { name: "BLACKLISTED_REDIAL_2", desc: "B-nums called before and 2+ times after blacklist", type: "INT8", cat: "Velocity" },
  { name: "BLACKLISTED_REDIAL_3", desc: "B-nums called before and 3+ times after blacklist", type: "INT8", cat: "Velocity" },
  { name: "ANUM_AVG_CALLS", desc: "Average call attempts from a-number", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_CALLED_24H", desc: "Unique bnums dialled by anum in 24h", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_CALLS_24H", desc: "Total call attempts by a-number in 24h", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_CALLS_3D", desc: "Total call attempts by a-number in 3 days", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_CALLS_7D", desc: "Total call attempts by a-number in 7 days", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_CALLS_30D", desc: "Total call attempts by a-number in 30 days", type: "INTEGER", cat: "Velocity" },
  { name: "ANUM_DAYS_ACTIVE", desc: "Days since first call record by calling-party", type: "INT8", cat: "Velocity" },
  { name: "BNUM_CALLS_1S", desc: "Call attempts to b-number in past 1s", type: "INT8", cat: "Velocity" },
  { name: "BNUM_CALLS_2S", desc: "Call attempts to b-number in past 2s", type: "INT8", cat: "Velocity" },
  { name: "BNUM_CALLS_5S", desc: "Call attempts to b-number in past 5s", type: "INT8", cat: "Velocity" },
  { name: "BNUM_CALLS_10S", desc: "Call attempts to b-number in past 10s", type: "INT8", cat: "Velocity" },
  { name: "BNUM_CALLS_24H", desc: "Call attempts to b-number since midnight", type: "INTEGER", cat: "Velocity" },
  { name: "BNUM_CALLS_7D", desc: "Call attempts to b-number in 7 days", type: "INTEGER", cat: "Velocity" },
  { name: "BNUM_AVG_CALLS", desc: "Average daily call attempts to b-number", type: "INTEGER", cat: "Velocity" },
  { name: "BNUM_DAYS_ACTIVE", desc: "Days since first call to called-party", type: "INT8", cat: "Velocity" },
  { name: "NUM_CLUSTERS_24H", desc: "Call clusters by anum in 24h", type: "INTEGER", cat: "Velocity" },
  { name: "NUM_CLUSTERS_3D", desc: "Call clusters by anum in 3 days", type: "INTEGER", cat: "Velocity" },
  { name: "NUM_CLUSTERS_7D", desc: "Call clusters by anum in 7 days", type: "INTEGER", cat: "Velocity" },
  { name: "NUM_CLUSTERS_30D", desc: "Call clusters by anum in 30 days", type: "INTEGER", cat: "Velocity" },
  { name: "CALLING_PARTY_CALLS_TO_CALLED_PARTY_24H", desc: "Calls from A to B since midnight", type: "INTEGER", cat: "Velocity" },
  { name: "DUPLICATE", desc: "Duplicate calls same anum/bnum in 1000ms", type: "INT8", cat: "Velocity" },
  { name: "B_RATIO_24H", desc: "Distinct b-numbers / clusters 24h", type: "DOUBLE", cat: "Velocity" },
  { name: "B_RATIO_3D", desc: "Distinct b-numbers / clusters 3d", type: "DOUBLE", cat: "Velocity" },
  { name: "B_RATIO_7D", desc: "Distinct b-numbers / clusters 7d", type: "DOUBLE", cat: "Velocity" },
  { name: "CALLS_TO_NATIONAL_1D", desc: "Calls to national numbers today", type: "INTEGER", cat: "Velocity" },
  { name: "CALLS_TO_INTERNATIONAL_1D", desc: "Calls to international numbers today", type: "INTEGER", cat: "Velocity" },
  { name: "CALLS_TO_INTERNATIONAL_RATIO", desc: "International / total calls ratio", type: "DOUBLE", cat: "Velocity" },

  // ── MTC / Duration Stats (used heavily in post-verification) ──
  { name: "MTC_AVG_DURATION_1D", desc: "Average MTC call duration today (seconds)", type: "DOUBLE", cat: "MTC Stats" },
  { name: "MTC_AVG_DURATION_7D", desc: "Average MTC call duration 7 days (seconds)", type: "DOUBLE", cat: "MTC Stats" },
  { name: "MTC_COMPLETED_PCT_1D", desc: "Percent of MTC calls completed today", type: "DOUBLE", cat: "MTC Stats" },
  { name: "MTC_COMPLETED_PCT_7D", desc: "Percent of MTC calls completed 7 days", type: "DOUBLE", cat: "MTC Stats" },
  { name: "MTC_MAX_DURATION_1D", desc: "Maximum MTC call duration today (seconds)", type: "DOUBLE", cat: "MTC Stats" },
  { name: "MTC_MAX_DURATION_7D", desc: "Maximum MTC call duration 7 days (seconds)", type: "DOUBLE", cat: "MTC Stats" },

  // ── Operator ──
  { name: "HOME_OPERATOR", desc: "Calling party home operator", type: "STRING", cat: "Operator" },
  { name: "TRANSIT_OPERATOR", desc: "Operator from which call was received", type: "STRING", cat: "Operator" },
  { name: "CALLING_PARTY_NP_OPERATOR", desc: "Operator for anum in numbering plan", type: "STRING", cat: "Operator" },
  { name: "CALLED_PARTY_NP_OPERATOR", desc: "Operator for bnum in numbering plan", type: "STRING", cat: "Operator" },
  { name: "CALLED_PARTY_HOME_OPERATOR", desc: "Called party home operator", type: "STRING", cat: "Operator" },
  { name: "HOME_EQ_TRANSIT", desc: "TRUE if home-operator equals transit-operator", type: "BOOLEAN", cat: "Operator" },

  // ── Network ──
  { name: "NODE", desc: "Node on which call was received", type: "STRING", cat: "Network" },
  { name: "ROUTE", desc: "Route on which call was received", type: "STRING", cat: "Network" },
  { name: "SERVICE_KEY", desc: "Service key on which call was received", type: "INTEGER", cat: "Network" },

  // ── Location ──
  { name: "MCC", desc: "Mobile Country Code", type: "INTEGER", cat: "Location" },
  { name: "MNC", desc: "Mobile Network Code", type: "INTEGER", cat: "Location" },
  { name: "LAC", desc: "Location Area Code", type: "INTEGER", cat: "Location" },
  { name: "CELL_ID", desc: "Cell Identity", type: "INTEGER", cat: "Location" },

  // ── MNP ──
  { name: "ANUM_MNP_LOOKUP_SUCCESS", desc: "MNP lookup successful for a-number", type: "BOOLEAN", cat: "MNP" },
  { name: "ANUM_MNP_STATUS", desc: "MNP status for a-number", type: "STRING", cat: "MNP" },
  { name: "BNUM_MNP_LOOKUP_SUCCESS", desc: "MNP lookup successful for b-number", type: "BOOLEAN", cat: "MNP" },
  { name: "BNUM_MNP_STATUS", desc: "MNP status for b-number", type: "STRING", cat: "MNP" },

  // ── Rules ──
  { name: "A_LABEL", desc: "A-number rule triggered", type: "STRING", cat: "Rules" },
  { name: "AV_LABEL", desc: "A-number velocity rule triggered", type: "STRING", cat: "Rules" },
  { name: "B_LABEL", desc: "B-number activity rule triggered", type: "STRING", cat: "Rules" },

  // ── CDR ──
  { name: "CDR_ANUM_DAYS_ACTIVE", desc: "Days since first CDR by calling-party", type: "INTEGER", cat: "CDR" },
  { name: "CDR_BNUM_DAYS_ACTIVE", desc: "Days since first CDR to called-party", type: "INTEGER", cat: "CDR" },
  { name: "CDR_SUBTYPE", desc: "Calling party subscription type", type: "STRING", cat: "CDR" },
  { name: "CDR_CALLS_1D", desc: "CDR calls today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CALLS_3D", desc: "CDR calls 3 days", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CALLS_7D", desc: "CDR calls 7 days", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CALLED_1D", desc: "Distinct CDR b-numbers today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CALLED_3D", desc: "Distinct CDR b-numbers 3d", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CALLED_7D", desc: "Distinct CDR b-numbers 7d", type: "INTEGER", cat: "CDR" },
  { name: "CDR_B_RATIO_1D", desc: "CDR b-numbers/calls ratio today", type: "DOUBLE", cat: "CDR" },
  { name: "CDR_B_RATIO_7D", desc: "CDR b-numbers/calls ratio 7d", type: "DOUBLE", cat: "CDR" },
  { name: "CDR_IMEIS_1D", desc: "Different IMEIs used today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_IMEIS_3D", desc: "Different IMEIs 3d", type: "INTEGER", cat: "CDR" },
  { name: "CDR_IMEIS_7D", desc: "Different IMEIs 7d", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CGI_1D", desc: "Different cell-towers today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_CGI_3D", desc: "Different cell-towers 3d", type: "INTEGER", cat: "CDR" },
  { name: "CDR_MTC_1D", desc: "Calls received today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_MOSMS_1D", desc: "SMS sent today", type: "INTEGER", cat: "CDR" },
  { name: "CDR_MTSMS_1D", desc: "SMS received today", type: "INTEGER", cat: "CDR" },

  // ── Hot Cell ──
  { name: "HOT_CELL_CALLS_1D", desc: "Calls today from hot cell towers", type: "INTEGER", cat: "Hot Cell" },
  { name: "HOT_CELL_CALLS_5D", desc: "Calls 5d from hot cell towers", type: "INTEGER", cat: "Hot Cell" },
  { name: "HOT_CELL_PCT_1D", desc: "Percent calls today from hot cells", type: "DOUBLE", cat: "Hot Cell" },
  { name: "HOT_CELL_PCT_5D", desc: "Percent calls 5d from hot cells", type: "DOUBLE", cat: "Hot Cell" },

  // ── IPRN ──
  { name: "ANUM_IPRN_MATCH", desc: "Calling party matched IPRN table", type: "BOOLEAN", cat: "IPRN" },
  { name: "BNUM_IPRN_MATCH", desc: "Called party matched IPRN table", type: "BOOLEAN", cat: "IPRN" },
  { name: "CALLS_TO_IPRN_24H", desc: "Calls today to IPRN numbers", type: "INTEGER", cat: "IPRN" },

  // ── Device ──
  { name: "IMEI", desc: "IMEI", type: "STRING", cat: "Device" },
  { name: "TAC", desc: "Type Allocation Code", type: "STRING", cat: "Device" },

  // ── Time ──
  { name: "HOUR", desc: "Hour of day (0-23)", type: "INT8", cat: "Time" },
  { name: "DAY", desc: "Day of week", type: "STRING", cat: "Time" },
  { name: "DAY_NUM", desc: "Day number (1=Mon, 7=Sun)", type: "INT8", cat: "Time" },

  // ── System / Tags ──
  { name: "RANDOM", desc: "Random number 1-100", type: "INTEGER", cat: "System" },
  { name: "CALL_DIRECTION", desc: "Direction of call (IN or OUT)", type: "STRING", cat: "System" },
  { name: "RECORD_TYPE", desc: "Record type", type: "STRING", cat: "System" },
  { name: "XDR_DURATION", desc: "XDR duration", type: "DOUBLE", cat: "System" },
  { name: "SUSPEND_COUNT", desc: "Times call has been suspended", type: "INT8", cat: "System" },
  { name: "REQUEST_BCSM", desc: "Request BCSM Continue For Call", type: "STRING", cat: "System" },
  { name: "TAGS", desc: "Tags applied to call (NPV results, labels)", type: "ARRAY", cat: "System" },
];

export const FACTS_TEXT = FACTS.map(
  (f) => `${f.name} (${f.type}) [${f.cat}]: ${f.desc}`
).join("\n");
