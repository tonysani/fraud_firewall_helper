// Complete Silknet / Six Degrees RVS Fraud Firewall Rules
//
// PIPELINE: PRE-VERIFICATION → POST-VERIFICATION (Rules)
//
// ACTION TYPES:
//   SYSTEM:    Initialise Call, Lookup Blacklist, Make Recommendation, Send Srism
//   ALLOW:     Continue (let call proceed)
//   DETECT:    Anumber Blacklist (add to blacklist)
//   BLOCK:     Release (send INAP Release to drop call)
//   MAINTAIN:  Remove Blacklist (false positive correction)
//   INTEL:     Send Blockchain (report to Fraud Intelligence Blockchain)

export const RULE_STAGES = {
  PRE:  { label: "Pre-Verification", color: "#2563eb", desc: "Evaluated before verification — blacklist checks, early detection, signalling" },
  POST: { label: "Post-Verification", color: "#7c3aed", desc: "Evaluated after verification — whitelist allow, blocking, advanced detection, blockchain reporting" },
};

export const RULE_STATES = [
  { id: "New", desc: "Call entry point", order: 0 },
  { id: "Initialised", desc: "Pipeline initialised", order: 1 },
  { id: "Lookup Blacklist", desc: "Blacklist lookup", order: 2 },
  { id: "Searching Blacklist", desc: "Evaluating rules", order: 3 },
  { id: "Calling Srism", desc: "Awaiting SRISM", order: 4 },
  { id: "Active", desc: "Post-verification rules", order: 5 },
];

export const ACTION_TYPES = {
  "Initialise Call":    { type: "SYSTEM",  color: "#4f46e5", icon: "⚙️", desc: "Initialises call processing pipeline" },
  "Lookup Blacklist":   { type: "SYSTEM",  color: "#4f46e5", icon: "🔍", desc: "Triggers blacklist lookup for A and B numbers" },
  "Make Recommendation":{ type: "SYSTEM",  color: "#2563eb", icon: "💡", desc: "Passes recommendation to next stage" },
  "Send Srism":         { type: "SYSTEM",  color: "#7c3aed", icon: "📡", desc: "Sends SS7 SRISM to check roaming status" },
  "Continue":           { type: "ALLOW",   color: "#16a34a", icon: "✅", desc: "Allow call to continue (whitelist / pass)" },
  "Anumber Blacklist":  { type: "DETECT",  color: "#dc2626", icon: "🚫", desc: "Adds calling number to blacklist" },
  "Release":            { type: "BLOCK",   color: "#e11d48", icon: "✋", desc: "Sends INAP Release to drop/block the call" },
  "Remove Blacklist":   { type: "MAINTAIN",color: "#059669", icon: "♻️", desc: "Removes number from blacklist" },
  "Send Blockchain":    { type: "INTEL",   color: "#ca8a04", icon: "⛓", desc: "Reports to Fraud Intelligence Blockchain" },
};

export const RULE_CATEGORIES = {
  System:         { color: "#4f46e5", icon: "⚙️", desc: "System / pipeline rules" },
  Simboxing:      { color: "#ea580c", icon: "📦", desc: "SIM box / bypass fraud" },
  Int2ndCall:     { color: "#2563eb", icon: "2️⃣", desc: "International 2nd call" },
  Wangiri:        { color: "#d97706", icon: "📞", desc: "Wangiri callback fraud" },
  FlashCalls:     { color: "#b45309", icon: "⚡", desc: "Flash call / OTP bypass" },
  IRSF:           { color: "#db2777", icon: "💰", desc: "Int. Revenue Share Fraud" },
  "CLI Spoofing": { color: "#7c3aed", icon: "🎭", desc: "CLI spoofing / invalid CLI" },
  Refile:         { color: "#6d28d9", icon: "🔀", desc: "Refiled / spoofed routing" },
  NumLength:      { color: "#0e7490", icon: "📏", desc: "Invalid number length" },
  "A Number Whitelist": { color: "#16a34a", icon: "✅", desc: "A-number whitelist allow" },
  "B Number Whitelist": { color: "#059669", icon: "✅", desc: "B-number whitelist allow" },
  "PRIVACY REQUEST":    { color: "#2563eb", icon: "🔒", desc: "Privacy / data removal" },
  RVS_Simbox:     { color: "#ea580c", icon: "📦", desc: "RVS simbox blacklist handling" },
  RVSUI:          { color: "#596577", icon: "🖥", desc: "Manual RVS UI blacklist" },
  SilknetAPI:     { color: "#0d9488", icon: "🔗", desc: "Silknet API blacklist sync" },
};

export const SAMPLE_RULES = [
  // ═══════════════════════════════════════════════════════════
  // PRE-VERIFICATION RULES
  // ═══════════════════════════════════════════════════════════

  // ── System / Pipeline ──
  { id: 1, stage: "PRE", state: "New", name: "Initialise Call", conditions: null, action: "Initialise Call", arguments: null, category: "System", enabled: true,
    description: "Entry point — initialises the call processing pipeline for all incoming calls." },
  { id: 2, stage: "PRE", state: "Initialised", name: "Lookup Blacklist", conditions: null, action: "Lookup Blacklist", arguments: null, category: "System", enabled: true,
    description: "Checks both A-number and B-number against the blacklist database." },

  // ── Blacklist Maintenance ──
  { id: 3, stage: "PRE", state: "Searching Blacklist", name: "RVS Redial Remove", conditions: "CALLING_PARTY_BLACKLIST_SOURCE = RVS AND CALLING_PARTY_BLACKLIST_REVIEW = true AND BLACKLISTED_REDIAL_2 = 1", action: "Remove Blacklist", arguments: { comments: "BLACKLISTED_REDIAL_2 = 1" }, category: "System", enabled: true,
    description: "Auto-removes numbers blacklisted by RVS that have redialed at least once and are eligible for review. Redial suggests legitimate subscriber." },
  { id: 4, stage: "PRE", state: "Searching Blacklist", name: "RVS Low Ratio Remove", conditions: "CALLING_PARTY_BLACKLIST_SOURCE = RVS AND CALLING_PARTY_BLACKLIST_REVIEW = true AND CALLING_PARTY_BLACKLISTED_CALLS > 9 AND CALLING_PARTY_BLACKLIST_RATIO < 0.85", action: "Remove Blacklist", arguments: { comments: "CALLING_PARTY_BLACKLISTED_CALLS > 9 AND CALLING_PARTY_BLACKLIST_RATIO < 0.85" }, category: "System", enabled: true,
    description: "Removes from blacklist if >9 blocked attempts but calls go to same few B-numbers (ratio < 0.85). Normal customer usage pattern." },

  // ── System Recommendations ──
  { id: 5, stage: "PRE", state: "Searching Blacklist", name: "A-Number Blacklist Check", conditions: "CALLING_PARTY_BLACKLISTED = true", action: "Make Recommendation", arguments: null, category: "System", enabled: true,
    description: "System rule — if A-number is blacklisted, passes recommendation to active rule stage." },
  { id: 6, stage: "PRE", state: "Searching Blacklist", name: "B-Number Blacklist Check", conditions: "CALLED_PARTY_BLACKLISTED = true", action: "Make Recommendation", arguments: null, category: "System", enabled: true,
    description: "System rule — if B-number is blacklisted, passes recommendation to active rule stage." },

  // ── Simboxing ──
  { id: 7, stage: "PRE", state: "Searching Blacklist", name: "Simbox AV15-15", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND AV_LABEL = \"AV15-15\"", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "Georgian mobile making 15 calls in 15 seconds. Impossible human behavior — automated simbox termination." },
  { id: 8, stage: "PRE", state: "Searching Blacklist", name: "Simbox AV20-19", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND AV_LABEL = \"AV20-19\"", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "Georgian mobile making 20 calls in 19 seconds. Machine-driven routing typical of simbox operations." },
  { id: 9, stage: "PRE", state: "Searching Blacklist", name: "Simbox New SIM Clusters", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND NUM_CLUSTERS_24H > 29 AND B_RATIO_24H > 0.96 AND ANUM_DAYS_ACTIVE < 5", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "New Georgian SIMs (active <5 days) with >29 clusters/24h and B-ratio >0.96. Simbox setup testing." },
  { id: 10, stage: "PRE", state: "Searching Blacklist", name: "Simbox High Diversity", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND NUM_CLUSTERS_24H > 35 AND B_RATIO_24H > 0.97", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "Georgian number >35 clusters/24h with >97% unique B-numbers. Mass outbound bypass traffic." },
  { id: 11, stage: "PRE", state: "Searching Blacklist", name: "Simbox Multi-Day", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND NUM_CLUSTERS_24H > 4 AND B_RATIO_24H > 0.99 AND NUM_CLUSTERS_3D > 19 AND B_RATIO_3D > 0.98 AND ANUM_DAYS_ACTIVE < 5", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "New Georgian mobiles with multi-day sustained pattern: >4 clusters/24h, >19/3d, >99%/98% unique B-numbers." },
  { id: 12, stage: "PRE", state: "Searching Blacklist", name: "Simbox Sustained Volume", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND CALLING_PARTY_NUMBER_TYPE = Mobile AND NUM_CLUSTERS_24H > 10 AND B_RATIO_24H > 0.92 AND NUM_CLUSTERS_3D > 25 AND B_RATIO_3D > 0.95", action: "Anumber Blacklist", arguments: null, category: "Simboxing", enabled: true,
    description: "Georgian mobiles >10 clusters/24h and >25/3d with high B-ratios. Sustained diversity over multiple days." },

  // ── Int 2nd Call ──
  { id: 13, stage: "PRE", state: "Searching Blacklist", name: "Int 2nd Call (Updated)", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_24H < 3 AND ANUM_CALLS_7D < 3 AND CDR_ANUM_DAYS_ACTIVE < 30 AND B_RATIO_24H > 0.52 AND NUM_CLUSTERS_24H > 0", action: "Anumber Blacklist", arguments: { source: "2ndCall_BL", duration: 86400 }, category: "Int2ndCall", enabled: true,
    description: "International calls not previously seen, making 2nd call after 1st-call block to different B-number. Blacklisted 24h." },
  { id: 14, stage: "PRE", state: "Searching Blacklist", name: "Int 2nd Call (Standard)", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_24H < 2 AND ANUM_CALLS_7D < 2 AND CDR_ANUM_DAYS_ACTIVE < 30 AND B_RATIO_24H > 0.52 AND NUM_CLUSTERS_24H > 0", action: "Anumber Blacklist", arguments: { source: "2ndCall_BL", duration: 86400 }, category: "Int2ndCall", enabled: true,
    description: "International calls not previously seen, making 2nd call after 1st-call block to different B-number. Blacklisted 24h." },

  // ── Wangiri (Pre) ──
  { id: 15, stage: "PRE", state: "Searching Blacklist", name: "Wangiri Silknet Target", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND NUM_CLUSTERS_24H > 50 AND B_RATIO_24H > 0.95 AND ANUM_DAYS_ACTIVE < 5 AND CALLED_PARTY_HOME_OPERATOR = Silknet AND CALLED_PARTY_NUMBER_TYPE != MSRN AND CALLING_PARTY_NUMBER_LENGTH > 7", action: "Anumber Blacklist", arguments: { source: "Wangiri", duration: 432000 }, category: "Wangiri", enabled: true,
    description: "Foreign numbers >50 bursts/24h, >95% unique B-numbers, new SIMs targeting Silknet. Wangiri — blacklisted 5 days." },

  // ── FlashCalls (Pre) ──
  { id: 16, stage: "PRE", state: "Searching Blacklist", name: "Flash Call Burst", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND NUM_CLUSTERS_24H > 20 AND B_RATIO_24H > 0.97 AND ANUM_DAYS_ACTIVE < 3", action: "Anumber Blacklist", arguments: { source: "FLASHRVS", duration: 432000 }, category: "FlashCalls", enabled: true,
    description: "Foreign numbers >20 bursts/24h, >97% unique B-numbers, active <3 days. Flash call — blacklisted 5 days." },
  { id: 17, stage: "PRE", state: "Searching Blacklist", name: "Flash Call Duration", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_30D > 5 AND MTC_AVG_DURATION_7D < 7", action: "Anumber Blacklist", arguments: { source: "FLASHRVS_GEN_DUR", duration: 432000 }, category: "FlashCalls", enabled: true,
    description: "Foreign numbers 5+ calls/30d, avg duration <7s. Duration-based flash call detection — blacklisted 5 days." },
  { id: 18, stage: "PRE", state: "Searching Blacklist", name: "Flash Call Local Route", conditions: "TRANSIT_OPERATOR = \"Silknet Fixed\" AND HOME_OPERATOR = Magticom AND ANUM_DAYS_ACTIVE < 3 AND CALLING_PARTY_NUMBER_TYPE = Mobile", action: "Anumber Blacklist", arguments: { source: "FLASHRVS_LOC", duration: 432000 }, category: "FlashCalls", enabled: true,
    description: "Magticom numbers via Silknet interconnect, active <3 days. Local route flash call — blacklisted 5 days." },

  // ── IRSF (Pre) ──
  { id: 19, stage: "PRE", state: "Searching Blacklist", name: "IRSF Pumping", conditions: "CALLED_PARTY_COUNTRY_CODE != 995 AND CALLING_PARTY_CALLS_TO_CALLED_PARTY_24H > 8 AND CALLS_TO_INTERNATIONAL_1D > 15 AND BNUM_DAYS_ACTIVE < 10 AND BNUM_NATURE_OF_ADDRESS = International", action: "Anumber Blacklist", arguments: { source: "IRSFRVS", duration: 432000 }, category: "IRSF", enabled: true,
    description: "Non-Georgian called numbers, >8 calls to same/24h, >15 international/day, target <10 days. IRSF pumping — blacklisted 5 days." },
  { id: 20, stage: "PRE", state: "Searching Blacklist", name: "IRSF Satellite", conditions: "CALLED_PARTY_COUNTRY_CODE != 995 AND CALLING_PARTY_CALLS_TO_CALLED_PARTY_24H > 5 AND BNUM_CALLS_24H > 10 AND CALLED_PARTY_NUMBER_TYPE = Satellite AND BNUM_NATURE_OF_ADDRESS = International", action: "Anumber Blacklist", arguments: { source: "IRSFRVS", duration: 432000 }, category: "IRSF", enabled: true,
    description: "Non-Georgian calls to Satellite numbers (>5 to same, >10 total/24h). IRSF via satellite — blacklisted 5 days." },

  // ── Signalling / Catch-all ──
  { id: 21, stage: "PRE", state: "Searching Blacklist", name: "Silknet SRISM Check", conditions: "SRISM_ENABLED = true AND CALLING_PARTY_NUMBER_TYPE = Mobile AND TRANSIT_OPERATOR = \"Silknet Fixed\" AND HOME_OPERATOR = Silknet", action: "Send Srism", arguments: null, category: "System", enabled: true,
    description: "Sends SRISM to check if Silknet mobile is roaming." },
  { id: 22, stage: "PRE", state: "Searching Blacklist", name: "Default Recommendation", conditions: null, action: "Make Recommendation", arguments: null, category: "System", enabled: true,
    description: "Default catch-all — passes recommendation to active rule stage." },
  { id: 23, stage: "PRE", state: "Calling Srism", name: "SRISM Response Handler", conditions: "CALL_DIRECTION = IN", action: "Make Recommendation", arguments: null, category: "System", enabled: true,
    description: "Handles SRISM response for inbound calls, passes recommendation onward." },

  // ═══════════════════════════════════════════════════════════
  // POST-VERIFICATION RULES (Active Rules)
  // ═══════════════════════════════════════════════════════════

  // ── Whitelists ──
  { id: 100, stage: "POST", state: "Active", name: "A-Number Whitelist", conditions: "CALLING_PARTY_WHITELISTED = true", action: "Continue", arguments: null, category: "A Number Whitelist", enabled: true,
    description: "Allows calls to continue if A-number appears on a whitelist." },
  { id: 101, stage: "POST", state: "Active", name: "Privacy Whitelist", conditions: "CALLING_PARTY_WHITELISTED = true AND CALLING_PARTY_WHITELIST_SOURCE = PRIVACY", action: "Continue", arguments: null, category: "PRIVACY REQUEST", enabled: true,
    description: "Whitelist for customers requesting personal data removal from detection. Requires fraud team approval." },
  { id: 102, stage: "POST", state: "Active", name: "RVSUI Whitelist", conditions: "CALLING_PARTY_WHITELISTED = true AND CALLING_PARTY_WHITELIST_SOURCE = RVSUI", action: "Continue", arguments: null, category: "A Number Whitelist", enabled: true,
    description: "Allows calls to continue if A-number added to whitelist via RVS UI." },
  { id: 103, stage: "POST", state: "Active", name: "B-Number Whitelist", conditions: "CALLED_PARTY_WHITELISTED = true", action: "Continue", arguments: null, category: "B Number Whitelist", enabled: true,
    description: "Allows calls to continue if B-number appears on a whitelist." },

  // ── Blacklist-source blocking ──
  { id: 104, stage: "POST", state: "Active", name: "Silknet Simbox Block", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = Silknet", action: "Release", arguments: null, category: "Simboxing", enabled: true,
    description: "Blocks all calls from numbers blacklisted by Silknet for simbox/fraud activity. INAP Release." },
  { id: 105, stage: "POST", state: "Active", name: "Wangiri BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = Wangiri", action: "Release", arguments: null, category: "Wangiri", enabled: true,
    description: "Blocks numbers blacklisted via UI with source Wangiri." },
  { id: 106, stage: "POST", state: "Active", name: "SilknetAPI BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = SilknetAPI", action: "Release", arguments: null, category: "SilknetAPI", enabled: true,
    description: "Releases calls from numbers blacklisted by Silknet API — real-time sync with network-level blocking." },
  { id: 107, stage: "POST", state: "Active", name: "FLASHRVS BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = FLASHRVS", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Releases numbers blacklisted by FlashRVS rules in pre-verification." },
  { id: 108, stage: "POST", state: "Active", name: "ManFlash BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = ManFlash", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Releases numbers blacklisted from manual script for flash calling." },
  { id: 109, stage: "POST", state: "Active", name: "RVSUI BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = RVSUI", action: "Release", arguments: null, category: "RVSUI", enabled: true,
    description: "Releases calls manually added to RVS blacklist for post-verification handling." },
  { id: 110, stage: "POST", state: "Active", name: "IRSFRVS BL Release", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = IRSFRVS", action: "Release", arguments: null, category: "IRSF", enabled: true,
    description: "Releases calls from IRSF control blacklist detected in pre-verification." },

  // ── In-test rules (Continue instead of Release) ──
  { id: 111, stage: "POST", state: "Active", name: "FlashDur BL Test", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = FLASHRVS_GEN_DUR", action: "Continue", arguments: null, category: "FlashCalls", enabled: true,
    description: "IN TEST: Allows continuation for numbers blacklisted by duration-based flash call rule. Testing before enabling block." },
  { id: 112, stage: "POST", state: "Active", name: "FlashLoc BL Test", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = FLASHRVS_LOC", action: "Continue", arguments: null, category: "FlashCalls", enabled: true,
    description: "IN TEST: Allows continuation for Magti interconnect flash call blacklist. Testing before enabling block." },
  { id: 113, stage: "POST", state: "Active", name: "RVS Simbox BL Test", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = RVS", action: "Continue", arguments: null, category: "RVS_Simbox", enabled: true,
    description: "IN TEST: Allows continuation for RVS simbox blacklisted numbers. Testing mode." },
  { id: 114, stage: "POST", state: "Active", name: "Wangiri MSRN Allow", conditions: "CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = Wangiri AND CALLED_PARTY_NUMBER_TYPE != MSRN", action: "Continue", arguments: null, category: "Wangiri", enabled: true,
    description: "Allows continuation where number is blacklisted under Wangiri but called party is not MSRN (legitimate routing)." },

  // ── Refile / SRISM-based detection ──
  { id: 115, stage: "POST", state: "Active", name: "Refile Unknown Sub", conditions: "CALLING_PARTY_SRISM_RESULT = unknownSubscriber AND TRANSIT_OPERATOR = \"Silknet Fixed\" AND HOME_OPERATOR = Silknet AND CALLING_PARTY_NUMBER_TYPE = Mobile", action: "Release", arguments: null, category: "Refile", enabled: true,
    description: "Silknet numbers over international-in route where number is not allocated. Spoofing with Silknet numbers." },
  { id: 116, stage: "POST", state: "Active", name: "Refile Not Roaming", conditions: "CALLING_PARTY_SRISM_RESULT = ok AND TRANSIT_OPERATOR = \"Silknet Fixed\" AND HOME_OPERATOR = Silknet AND CALLING_PARTY_NUMBER_TYPE = Mobile AND REDIRECTION_COUNTER = 0 AND CALLING_PARTY_EXCHANGE =~ \"^995[0-9]*$\"", action: "Release", arguments: null, category: "Refile", enabled: true,
    description: "Silknet numbers over international-in route where SRISM shows not roaming. Spoofed Silknet numbers." },

  // ── Route bypass ──
  { id: 117, stage: "POST", state: "Active", name: "Silknet Out Continue", conditions: "TRANSIT_OPERATOR = \"Silknet Out\"", action: "Continue", arguments: null, category: "System", enabled: true,
    description: "Continue call for Silknet Out routes." },

  // ── CLI Spoofing / NPV ──
  { id: 118, stage: "POST", state: "Active", name: "NPV Invalid Range", conditions: "CALLING_PARTY_COUNTRY != Georgia AND TAGS = \"NPV_ANUM:invalid-range\" AND CALLING_PARTY_NUMBER_LENGTH > 7", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "Blocks foreign A-numbers from unallocated ranges (invalid per NPV Data Service) with length >7 digits." },
  { id: 119, stage: "POST", state: "Active", name: "NPV Invalid Length", conditions: "TAGS = \"NPV_ANUM:invalid-length\" AND CALLING_PARTY_NUMBER_LENGTH > 9 AND CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\"", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "IN TEST: Foreign A-numbers with invalid length per NPV plan. Length >9 to avoid blocking Georgian fixed." },
  { id: 120, stage: "POST", state: "Active", name: "NPV Invalid Length (Type)", conditions: "TAGS = \"NPV_ANUM:invalid-length\" AND CALLING_PARTY_NUMBER_TYPE != Fixed", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "IN TEST: Foreign A-numbers with invalid length per NPV plan. Excludes Georgian fixed numbers." },
  { id: 121, stage: "POST", state: "Active", name: "Non-Numeric CLI Block", conditions: "CALLING_PARTY_NUMBER =~ \".*[^0-9]+.*\"", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "Blocks calls where calling number contains non-numeric or special characters. Invalid/spoofed CLIs." },
  { id: 122, stage: "POST", state: "Active", name: "Georgian Wrong Length", conditions: "CALLING_PARTY_NUMBER =~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH != 12", action: "Release", arguments: null, category: "NumLength", enabled: true,
    description: "Blocks Georgian numbers (+995) that do not have exactly 12 digits. Malformed or spoofed CLI." },
  { id: 123, stage: "POST", state: "Active", name: "Georgian Over Length", conditions: "CALLING_PARTY_NUMBER =~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH > 15", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "Blocks Georgian numbers exceeding 15 digits — invalid or manipulated CLIs." },
  { id: 124, stage: "POST", state: "Active", name: "Global Over Length", conditions: "CALLING_PARTY_NUMBER_LENGTH > 15", action: "Release", arguments: null, category: "CLI Spoofing", enabled: true,
    description: "Blocks any number exceeding 15 digits. Incorrect calling number length — likely spoofed." },

  // ── Wangiri (Post) — Blockchain + Release pair ──
  { id: 125, stage: "POST", state: "Active", name: "Wangiri → Blockchain", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND ANUM_CALLED_24H > 49 AND CALLED_PARTY_NUMBER_TYPE != MSRN AND CALLING_PARTY_NUMBER_LENGTH > 7", action: "Send Blockchain", arguments: { category: "Wangiri" }, category: "Wangiri", enabled: true,
    description: "Sends to Fraud Intelligence Blockchain: A-numbers calling >49 unique B-numbers/24h, non-Georgian, not MSRN." },
  { id: 126, stage: "POST", state: "Active", name: "Wangiri Release", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND ANUM_CALLED_24H > 49 AND CALLED_PARTY_NUMBER_TYPE != MSRN AND CALLING_PARTY_NUMBER_LENGTH > 7", action: "Release", arguments: null, category: "Wangiri", enabled: true,
    description: "Releases A-numbers calling >49 unique B-numbers/24h, non-Georgian prefix." },

  // ── FlashCalls (Post) — Advanced detection with MTC stats ──
  { id: 127, stage: "POST", state: "Active", name: "Flash 7D → Blockchain", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH > 7 AND ANUM_CALLS_24H > 3 AND B_RATIO_24H > 0.98 AND ANUM_CALLS_7D > 9 AND B_RATIO_7D > 0.95 AND MTC_AVG_DURATION_1D < 10 AND MTC_AVG_DURATION_7D < 10 AND MTC_COMPLETED_PCT_1D < 40 AND MTC_COMPLETED_PCT_7D < 40 AND MTC_MAX_DURATION_1D < 55 AND MTC_MAX_DURATION_7D < 55", action: "Send Blockchain", arguments: { category: "FlashCall" }, category: "FlashCalls", enabled: true,
    description: "Sends to Blockchain: international A-numbers >3 calls/24h, >9/7d, B-ratio >98%/95%, avg duration <10s, max <55s, CCR <40%. Flash call 7-day pattern." },
  { id: 128, stage: "POST", state: "Active", name: "Flash 7D Release", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH > 7 AND ANUM_CALLS_24H > 3 AND B_RATIO_24H > 0.98 AND ANUM_CALLS_7D > 9 AND B_RATIO_7D > 0.95 AND MTC_AVG_DURATION_1D < 10 AND MTC_AVG_DURATION_7D < 10 AND MTC_COMPLETED_PCT_1D < 40 AND MTC_COMPLETED_PCT_7D < 40 AND MTC_MAX_DURATION_1D < 55 AND MTC_MAX_DURATION_7D < 55", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Releases international A-numbers matching 7-day flash call pattern (same criteria as blockchain send)." },
  { id: 129, stage: "POST", state: "Active", name: "Flash 1D → Blockchain", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH > 7 AND ANUM_CALLS_24H > 5 AND B_RATIO_24H > 0.98 AND MTC_AVG_DURATION_1D < 10 AND MTC_COMPLETED_PCT_1D < 40 AND MTC_MAX_DURATION_1D < 55", action: "Send Blockchain", arguments: { category: "FlashCall" }, category: "FlashCalls", enabled: true,
    description: "Sends to Blockchain: international A-numbers >5 calls/24h, B-ratio >98%, avg <10s, max <55s, CCR <40%. Flash call daily pattern." },
  { id: 130, stage: "POST", state: "Active", name: "Flash 1D Release", conditions: "CALLING_PARTY_NUMBER !~ \"^995[0-9]*$\" AND CALLING_PARTY_NUMBER_LENGTH > 7 AND ANUM_CALLS_24H > 5 AND B_RATIO_24H > 0.98 AND MTC_AVG_DURATION_1D < 10 AND MTC_COMPLETED_PCT_1D < 40 AND MTC_MAX_DURATION_1D < 55", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Releases international A-numbers matching daily flash call pattern." },

  // ── First Call Block (Post) ──
  { id: 131, stage: "POST", state: "Active", name: "First Call Block", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_24H < 2 AND ANUM_CALLS_7D < 2 AND ANUM_DAYS_ACTIVE < 30", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Blocks foreign numbers (non-995) making <2 calls in 24h/7d, active <30 days. Targets first-time foreign callers used for wangiri/flash." },
  { id: 132, stage: "POST", state: "Active", name: "2nd Call → Blockchain", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_24H < 3 AND ANUM_CALLS_7D < 3 AND ANUM_DAYS_ACTIVE < 30 AND B_RATIO_24H > 0.52", action: "Send Blockchain", arguments: { category: "FlashCall" }, category: "FlashCalls", enabled: true,
    description: "Sends to Blockchain: unique numbers detected under 2nd call rule." },
  { id: 133, stage: "POST", state: "Active", name: "2nd Call Release", conditions: "CALLING_PARTY_COUNTRY_CODE != 995 AND ANUM_CALLS_24H < 3 AND ANUM_CALLS_7D < 3 AND ANUM_DAYS_ACTIVE < 30 AND B_RATIO_24H > 0.52", action: "Release", arguments: null, category: "FlashCalls", enabled: true,
    description: "Blocks foreign numbers detected trying different B-number in second call after first-call block." },

  // ── IRSF (Post) — In-test monitoring ──
  { id: 134, stage: "POST", state: "Active", name: "IRSF Repeat Test", conditions: "CALLED_PARTY_NUMBER !~ \"^995[0-9]*$\" AND BNUM_DAYS_ACTIVE < 10 AND CALLING_PARTY_CALLS_TO_CALLED_PARTY_24H > 5 AND CALLS_TO_INTERNATIONAL_1D > 50 AND ANUM_DAYS_ACTIVE < 10", action: "Continue", arguments: null, category: "IRSF", enabled: true,
    description: "IN TEST: Non-Georgian numbers >5 calls to same B-number, >50 international/24h, active <10 days. Monitoring IRSF." },
  { id: 135, stage: "POST", state: "Active", name: "IRSF Volume Test", conditions: "CALLED_PARTY_NUMBER !~ \"^995[0-9]*$\" AND BNUM_DAYS_ACTIVE < 10 AND CALLS_TO_INTERNATIONAL_1D > 50 AND ANUM_DAYS_ACTIVE < 10", action: "Continue", arguments: null, category: "IRSF", enabled: true,
    description: "IN TEST: Foreign numbers >50 international calls/day, active <10 days. Tracking potential IRSF without blocking." },

  // ── Local FlashCall Test ──
  { id: 136, stage: "POST", state: "Active", name: "Local Flash Test", conditions: "CALLING_PARTY_COUNTRY_CODE = 995 AND NUM_CLUSTERS_24H > 20 AND B_RATIO_24H > 0.97 AND ANUM_DAYS_ACTIVE < 3", action: "Continue", arguments: null, category: "FlashCalls", enabled: true,
    description: "IN TEST: Local Georgian numbers with flash call indicators. Set to Continue while testing." },

  // ── Default catch-all ──
  { id: 199, stage: "POST", state: "Active", name: "Default Continue", conditions: null, action: "Continue", arguments: null, category: "System", enabled: true,
    description: "Default catch-all — allows all remaining calls to continue." },
];

export function formatDuration(seconds) {
  if (!seconds) return null;
  if (seconds < 3600) return Math.round(seconds / 60) + " min";
  if (seconds < 86400) return Math.round(seconds / 3600) + " hours";
  return Math.round(seconds / 86400) + " days";
}
