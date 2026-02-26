// Streaming stats engine — processes Papa Parse chunks incrementally
// Uses Welford's online algorithm for mean/variance in constant memory
// Maintains frequency counts for categoricals and histogram bins for percentiles

import { getNumericCols, getCategoricalCols, getBooleanCols, COLUMN_MAP } from "../data/columnMap";

export function createStatsAccumulator() {
  const numCols = getNumericCols();
  const catCols = getCategoricalCols();
  const boolCols = getBooleanCols();

  // Numeric: Welford's algorithm + min/max + histogram
  const numeric = {};
  for (const { csv, fact } of numCols) {
    numeric[csv] = {
      fact,
      count: 0,
      mean: 0,
      m2: 0, // for variance
      min: Infinity,
      max: -Infinity,
      // Histogram bins for approximate percentiles (filled after first pass sets range)
      histogram: null,
      values_sample: [], // keep first 1000 values for initial histogram setup
    };
  }

  // Categorical: frequency counts (top 50 values)
  const categorical = {};
  for (const { csv, fact } of catCols) {
    categorical[csv] = { fact, counts: {}, total: 0, nullCount: 0 };
  }

  // Boolean: true/false counts
  const boolean = {};
  for (const { csv, fact } of boolCols) {
    boolean[csv] = { fact, trueCount: 0, falseCount: 0, nullCount: 0 };
  }

  // Decision breakdown
  const decisions = { continue: 0, release: 0, other: 0 };

  // Cross-pattern counters (pre-defined fraud indicators)
  const crossPatterns = createCrossPatterns();

  let totalRows = 0;

  return { numeric, categorical, boolean, decisions, crossPatterns, totalRows, numCols, catCols, boolCols };
}

function createCrossPatterns() {
  // Each pattern: a function that checks a row, plus a running count
  return [
    {
      label: "New subscriber + high velocity",
      conditions: "ANUM_CALLS_24H > 20 AND first seen < 7 days",
      check: (r) => num(r.anum_calls_24h) > 20 && daysSince(r.first_call) < 7,
      count: 0, total: 0,
    },
    {
      label: "High B-ratio (many unique B-numbers)",
      conditions: "ANUM_CALLED_24H / ANUM_CALLS_24H > 0.9 AND ANUM_CALLS_24H > 5",
      check: (r) => {
        const calls = num(r.anum_calls_24h);
        const called = num(r.anum_called_24h);
        return calls > 5 && called / calls > 0.9;
      },
      count: 0, total: 0,
    },
    {
      label: "International inbound + high call volume",
      conditions: "Non-Georgian caller + ANUM_CALLS_24H > 50",
      check: (r) => num(r.calling_party_country_code) !== 995 && num(r.anum_calls_24h) > 50,
      count: 0, total: 0,
    },
    {
      label: "Repeated calls to same B-number",
      conditions: "ANUM_TO_BNUM_24H > 5",
      check: (r) => num(r.anum_to_bnum_24h) > 5,
      count: 0, total: 0,
    },
    {
      label: "Multiple clusters (burst pattern)",
      conditions: "NUM_CLUSTERS_24H > 10 AND ANUM_CALLS_24H > 20",
      check: (r) => num(r.anum_clusters_24h) > 10 && num(r.anum_calls_24h) > 20,
      count: 0, total: 0,
    },
    {
      label: "Foreign caller, first call ever",
      conditions: "Non-995 + ANUM_CALLS_24H < 2 + ANUM_CALLS_7D < 2",
      check: (r) => num(r.calling_party_country_code) !== 995 && num(r.anum_calls_24h) < 2 && num(r.anum_calls_7d) < 2,
      count: 0, total: 0,
    },
    {
      label: "Outbound to unusual destination",
      conditions: "Decision=continue + called_party_country != Georgia + ANUM_CALLS_24H > 10",
      check: (r) => r.decision === "continue" && str(r.called_party_country) !== "Georgia" && num(r.anum_calls_24h) > 10,
      count: 0, total: 0,
    },
    {
      label: "High duplicate rate",
      conditions: "DUPLICATE > 0",
      check: (r) => num(r.duplicate) > 0,
      count: 0, total: 0,
    },
  ];
}

function num(v) {
  if (v === null || v === undefined || v === "" || v === "NaN" || v === "nan") return NaN;
  const n = Number(v);
  return isNaN(n) ? NaN : n;
}

function str(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v).trim();
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Infinity;
    return (Date.now() - d.getTime()) / 86400000;
  } catch {
    return Infinity;
  }
}

// Process a chunk of parsed rows (from Papa Parse)
export function processChunk(acc, rows) {
  for (const row of rows) {
    acc.totalRows++;

    // Decision
    const dec = str(row.decision).toLowerCase();
    if (dec === "continue") acc.decisions.continue++;
    else if (dec === "release") acc.decisions.release++;
    else acc.decisions.other++;

    // Numeric stats (Welford's)
    for (const { csv } of acc.numCols) {
      const v = num(row[csv]);
      if (!isNaN(v)) {
        const s = acc.numeric[csv];
        s.count++;
        const delta = v - s.mean;
        s.mean += delta / s.count;
        s.m2 += delta * (v - s.mean);
        if (v < s.min) s.min = v;
        if (v > s.max) s.max = v;
        // Sample values for histogram (first 2000)
        if (s.values_sample && s.values_sample.length < 2000) {
          s.values_sample.push(v);
        }
      }
    }

    // Categorical frequency
    for (const { csv } of acc.catCols) {
      const v = str(row[csv]);
      const s = acc.categorical[csv];
      if (v === "" || v === "NaN" || v === "nan") {
        s.nullCount++;
      } else {
        s.total++;
        s.counts[v] = (s.counts[v] || 0) + 1;
        // Cap at 500 unique values to prevent memory issues
        if (Object.keys(s.counts).length > 500) {
          // Keep only top 200 by count
          const sorted = Object.entries(s.counts).sort((a, b) => b[1] - a[1]);
          const keep = Object.fromEntries(sorted.slice(0, 200));
          const dropped = sorted.slice(200).reduce((sum, [, c]) => sum + c, 0);
          keep.__OTHER__ = (keep.__OTHER__ || 0) + dropped;
          s.counts = keep;
        }
      }
    }

    // Boolean
    for (const { csv } of acc.boolCols) {
      const v = row[csv];
      const s = acc.boolean[csv];
      if (v === null || v === undefined || v === "" || v === "NaN") {
        s.nullCount++;
      } else {
        const bv = v === true || v === "true" || v === "True" || v === "1" || v === 1;
        if (bv) s.trueCount++;
        else s.falseCount++;
      }
    }

    // Cross patterns
    for (const p of acc.crossPatterns) {
      p.total++;
      try {
        if (p.check(row)) p.count++;
      } catch {
        // skip on error
      }
    }
  }
}

// Finalize stats after all chunks processed
export function finalizeStats(acc) {
  const numericStats = {};
  for (const [csv, s] of Object.entries(acc.numeric)) {
    if (s.count === 0) continue;
    const variance = s.count > 1 ? s.m2 / (s.count - 1) : 0;
    const stddev = Math.sqrt(variance);

    // Approximate percentiles from sampled values
    let p25 = null, p50 = null, p75 = null, p95 = null, p99 = null;
    if (s.values_sample && s.values_sample.length > 0) {
      const sorted = s.values_sample.slice().sort((a, b) => a - b);
      const pct = (p) => sorted[Math.floor(p * sorted.length)] || 0;
      p25 = pct(0.25);
      p50 = pct(0.5);
      p75 = pct(0.75);
      p95 = pct(0.95);
      p99 = pct(0.99);
    }

    numericStats[s.fact] = {
      csv_col: csv,
      count: s.count,
      null_count: acc.totalRows - s.count,
      mean: round(s.mean),
      stddev: round(stddev),
      min: s.min,
      max: s.max,
      p25, p50, p75, p95, p99,
      // Coefficient of variation
      cv: s.mean !== 0 ? round(stddev / Math.abs(s.mean)) : null,
      // Skewness indicator
      skew_indicator: p50 !== null && s.mean > 0
        ? round((s.mean - p50) / (stddev || 1))
        : null,
    };
  }

  const categoricalStats = {};
  for (const [csv, s] of Object.entries(acc.categorical)) {
    if (s.total === 0) continue;
    // Sort by count descending
    const sorted = Object.entries(s.counts)
      .sort((a, b) => b[1] - a[1]);
    const topValues = sorted.slice(0, 20).map(([val, count]) => ({
      value: val,
      count,
      pct: round((count / s.total) * 100),
    }));
    const uniqueCount = sorted.length;

    categoricalStats[s.fact] = {
      csv_col: csv,
      total: s.total,
      null_count: s.nullCount,
      unique_count: uniqueCount,
      top_values: topValues,
      // Concentration: top value percentage
      concentration: topValues.length > 0 ? topValues[0].pct : 0,
      dominant_value: topValues.length > 0 ? topValues[0].value : null,
    };
  }

  const booleanStats = {};
  for (const [csv, s] of Object.entries(acc.boolean)) {
    const total = s.trueCount + s.falseCount;
    if (total === 0) continue;
    booleanStats[s.fact] = {
      csv_col: csv,
      true_count: s.trueCount,
      false_count: s.falseCount,
      null_count: s.nullCount,
      true_pct: round((s.trueCount / total) * 100),
    };
  }

  const crossPatterns = acc.crossPatterns
    .filter((p) => p.total > 0)
    .map((p) => ({
      label: p.label,
      conditions: p.conditions,
      count: p.count,
      total: p.total,
      pct: round((p.count / p.total) * 100),
    }));

  return {
    totalRows: acc.totalRows,
    decisions: acc.decisions,
    numeric: numericStats,
    categorical: categoricalStats,
    boolean: booleanStats,
    crossPatterns,
  };
}

function round(v) {
  if (v === null || v === undefined || isNaN(v)) return null;
  return Math.round(v * 1000) / 1000;
}
