import { FACTS } from "../data/facts";

// ── Category color map ──
export const CAT_COLORS = {
  Identity: { bd: "#2563eb", tx: "#1d4ed8", bg: "#eff6ff", ic: "👤" },
  Numbers: { bd: "#0d9488", tx: "#0f766e", bg: "#f0fdfa", ic: "🔢" },
  Velocity: { bd: "#d97706", tx: "#b45309", bg: "#fffbeb", ic: "⚡" },
  Lists: { bd: "#dc2626", tx: "#b91c1c", bg: "#fef2f2", ic: "📋" },
  Signalling: { bd: "#7c3aed", tx: "#6d28d9", bg: "#f5f3ff", ic: "📡" },
  Operator: { bd: "#16a34a", tx: "#15803d", bg: "#f0fdf4", ic: "🏢" },
  Network: { bd: "#2563eb", tx: "#1d4ed8", bg: "#eff6ff", ic: "🌐" },
  CDR: { bd: "#ca8a04", tx: "#a16207", bg: "#fefce8", ic: "📊" },
  "Hot Cell": { bd: "#ea580c", tx: "#c2410c", bg: "#fff7ed", ic: "🔥" },
  Location: { bd: "#0891b2", tx: "#0e7490", bg: "#ecfeff", ic: "📍" },
  MNP: { bd: "#7c3aed", tx: "#6d28d9", bg: "#f5f3ff", ic: "🔄" },
  IPRN: { bd: "#db2777", tx: "#be185d", bg: "#fdf2f8", ic: "💰" },
  Device: { bd: "#16a34a", tx: "#15803d", bg: "#f0fdf4", ic: "📱" },
  Time: { bd: "#d97706", tx: "#b45309", bg: "#fffbeb", ic: "🕐" },
  System: { bd: "#4f46e5", tx: "#4338ca", bg: "#eef2ff", ic: "⚙️" },
  Rules: { bd: "#dc2626", tx: "#b91c1c", bg: "#fef2f2", ic: "📐" },
  "Numbering Plan": { bd: "#0891b2", tx: "#0e7490", bg: "#ecfeff", ic: "🗂" },
  "Call Routing": { bd: "#ca8a04", tx: "#a16207", bg: "#fefce8", ic: "↪️" },
  "MTC Stats": { bd: "#7c3aed", tx: "#6d28d9", bg: "#f5f3ff", ic: "📈" },
};

export const getCatColor = (cat) =>
  CAT_COLORS[cat] || { bd: "#444", tx: "#999", ic: "◉" };

// ── Operators per data type ──
export const OPERATORS = {
  STRING: [
    { op: "==", l: "equals", s: "=" },
    { op: "!=", l: "not equals", s: "≠" },
    { op: "=~", l: "regex match", s: "≈" },
    { op: "!~", l: "regex not match", s: "≉" },
    { op: "STARTS_WITH", l: "starts with", s: "⊳" },
    { op: "CONTAINS", l: "contains", s: "∋" },
    { op: "IN", l: "in list", s: "∈" },
  ],
  INTEGER: [
    { op: "==", l: "equals", s: "=" },
    { op: "!=", l: "not equals", s: "≠" },
    { op: ">", l: "greater than", s: ">" },
    { op: ">=", l: "greater or equal", s: "≥" },
    { op: "<", l: "less than", s: "<" },
    { op: "<=", l: "less or equal", s: "≤" },
  ],
  DOUBLE: [
    { op: "==", l: "equals", s: "=" },
    { op: ">", l: "greater", s: ">" },
    { op: ">=", l: "gte", s: "≥" },
    { op: "<", l: "less", s: "<" },
    { op: "<=", l: "lte", s: "≤" },
  ],
  BOOLEAN: [{ op: "==", l: "is", s: "=" }],
  ARRAY: [
    { op: "=", l: "equals", s: "=" },
    { op: "CONTAINS", l: "contains", s: "∋" },
    { op: "IS_EMPTY", l: "is empty", s: "∅" },
  ],
  INT8: [
    { op: "==", l: "equals", s: "=" },
    { op: ">", l: "greater", s: ">" },
    { op: ">=", l: "gte", s: "≥" },
    { op: "<", l: "less", s: "<" },
    { op: "<=", l: "lte", s: "≤" },
  ],
};

export const getOperators = (type) => OPERATORS[type] || OPERATORS.STRING;

// ── Operator display symbols ──
export const OP_SYMBOLS = {
  "=": "=",
  "!=": "≠",
  ">": ">",
  ">=": "≥",
  "<": "<",
  "<=": "≤",
  "=~": "≈",
  "!~": "≉",
};

// ── Parse condition string into structured parts ──
// Supports: =, !=, >, >=, <, <=, =~ (regex match), !~ (regex not match)
export function parseConditions(str) {
  if (!str) return [];
  return str.split(/\s+AND\s+/).map((part) => {
    const trimmed = part.trim();
    // Try regex operators first (=~ and !~)
    const regexMatch = trimmed.match(/^(\S+)\s*(=~|!~)\s*(.+)$/);
    if (regexMatch) {
      return { fact: regexMatch[1], op: regexMatch[2], value: regexMatch[3].trim().replace(/^"|"$/g, "") };
    }
    // Standard operators
    const m = trimmed.match(/^(\S+)\s*(!=|>=|<=|=|>|<)\s*(.+)$/);
    if (m) return { fact: m[1], op: m[2], value: m[3].trim().replace(/^"|"$/g, "") };
    return { fact: trimmed, op: "", value: "" };
  });
}

// ── Natural language synonym map ──
const NL_MAP = {
  caller: ["CALLING_PARTY", "ANUM"],
  called: ["CALLED_PARTY", "BNUM"],
  country: ["COUNTRY", "COUNTRY_CODE", "MCC"],
  blacklist: ["BLACKLIST", "BLACKLISTED"],
  whitelist: ["WHITELIST", "WHITELISTED"],
  velocity: ["CALLS_24H", "CALLS_3D", "CALLED_24H"],
  burst: ["CALLS_1S", "CALLS_2S", "CALLS_5S", "DUPLICATE"],
  iprn: ["IPRN"],
  premium: ["IPRN"],
  wangiri: ["ANUM_CALLED_24H", "B_RATIO", "CLUSTERS"],
  device: ["IMEI", "TAC", "CDR_IMEIS"],
  simbox: ["CDR_IMEIS", "HOT_CELL", "CDR_CGI"],
  "sim box": ["CDR_IMEIS", "HOT_CELL", "CDR_CGI"],
  roaming: ["HOME_OPERATOR", "TRANSIT_OPERATOR", "HOME_EQ_TRANSIT", "SRISM"],
  redirect: ["REDIRECT", "REDIRECTION"],
  sms: ["MOSMS", "MTSMS"],
  international: ["INTERNATIONAL", "COUNTRY"],
  "new subscriber": ["ANUM_DAYS_ACTIVE", "CDR_ANUM_DAYS_ACTIVE"],
  hot: ["HOT_CELL", "HOT_TAC"],
  cluster: ["CLUSTERS", "NUM_CLUSTERS"],
  ratio: ["RATIO", "B_RATIO"],
  duplicate: ["DUPLICATE"],
  spoof: ["HOME_EQ_TRANSIT", "NUMBERING_PLAN_MATCH", "ATI"],
  cli: ["HOME_EQ_TRANSIT", "NUMBERING_PLAN_MATCH", "ATI", "NUMBER_LENGTH"],
  night: ["HOUR"],
  cdr: ["CDR_"],
  signalling: ["ATI", "SRISM"],
  flash: ["MTC_AVG_DURATION", "MTC_COMPLETED", "MTC_MAX_DURATION", "FLASHRVS"],
  duration: ["MTC_AVG_DURATION", "MTC_MAX_DURATION", "XDR_DURATION"],
  completion: ["MTC_COMPLETED_PCT"],
  blockchain: ["BLOCKCHAIN"],
  refile: ["SRISM_RESULT", "EXCHANGE"],
  npv: ["TAGS", "NPV"],
  tag: ["TAGS"],
};

// ── Search FACTS with NL synonym matching ──
export function searchFacts(query) {
  if (!query.trim()) return FACTS;
  const terms = query.toLowerCase().split(/\s+/);
  return FACTS.map((f) => {
    let score = 0;
    const n = f.name.toLowerCase();
    const d = f.desc.toLowerCase();
    const c = f.cat.toLowerCase();
    for (const t of terms) {
      if (n.includes(t)) score += 10;
      if (d.includes(t)) score += 5;
      if (c.includes(t)) score += 3;
      for (const [key, patterns] of Object.entries(NL_MAP)) {
        if (key.includes(t) || t.includes(key)) {
          for (const p of patterns) {
            if (n.includes(p.toLowerCase())) score += 8;
          }
        }
      }
    }
    return { ...f, score };
  })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ── Navigation tabs config ──
export const NAV_TABS = [
  { id: "scan", label: "Scan Transactions", icon: "🔬", desc: "AI anomaly detection", accent: "#1f6feb" },
  { id: "rules", label: "Current Rules", icon: "📐", desc: "Review & understand", accent: "#f97583" },
  { id: "explorer", label: "FACT Explorer", icon: "🔍", desc: "Search parameters", accent: "#56d364" },
  { id: "designer", label: "AI Rule Designer", icon: "✦", desc: "Build from description", accent: "#a78bfa" },
];
