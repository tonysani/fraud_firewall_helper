// Anomaly detection engine
// Takes finalized stats and identifies suspicious patterns worth investigating
// Returns ranked anomalies with severity and descriptions

export function detectAnomalies(stats) {
  const anomalies = [];

  // 1. Numeric outlier patterns
  for (const [fact, s] of Object.entries(stats.numeric)) {
    if (s.count < 10) continue;

    // High coefficient of variation = wide spread, possible bimodal
    if (s.cv !== null && s.cv > 3 && s.max > s.mean * 10) {
      anomalies.push({
        type: "numeric_spread",
        severity: s.cv > 10 ? "HIGH" : "MEDIUM",
        fact,
        title: fact + " has extreme spread",
        detail: "Mean " + s.mean + " but max " + s.max + " (CV=" + s.cv.toFixed(1) + "). " +
          "p95=" + s.p95 + ", p99=" + s.p99 + ". Records above p99 may indicate fraud.",
        stat: s,
        affectedPct: s.p99 !== null ? Math.round((1 - 0.99) * s.count) : null,
      });
    }

    // Extreme p99/p95 gap — heavy tail
    if (s.p95 !== null && s.p99 !== null && s.p99 > s.p95 * 3 && s.p95 > 0) {
      anomalies.push({
        type: "heavy_tail",
        severity: s.p99 > s.p95 * 10 ? "HIGH" : "MEDIUM",
        fact,
        title: fact + " has heavy tail",
        detail: "p95=" + s.p95 + " but p99=" + s.p99 + " (" + (s.p99 / s.p95).toFixed(1) +
          "x). Top 1% of values are disproportionately high.",
        stat: s,
      });
    }

    // Nearly all same value but some outliers
    if (s.p75 !== null && s.p75 === s.p25 && s.max > s.p75 * 2 && s.max > 0) {
      const outlierCount = Math.round(s.count * 0.01);
      anomalies.push({
        type: "uniform_with_outliers",
        severity: "MEDIUM",
        fact,
        title: fact + " mostly constant with outliers",
        detail: "75% of values are " + s.p25 + " but max reaches " + s.max +
          ". ~" + outlierCount + " records are outliers worth examining.",
        stat: s,
      });
    }
  }

  // 2. Categorical anomalies
  for (const [fact, s] of Object.entries(stats.categorical)) {
    if (s.total < 10) continue;

    // Rare values that could indicate fraud
    const rareValues = s.top_values.filter((v) => v.pct < 1 && v.count > 5);
    if (rareValues.length > 0 && s.unique_count > 3) {
      // Only flag if the fact is operationally significant
      const significant = ["TRANSIT_OPERATOR", "HOME_OPERATOR", "ROUTE", "CALLING_PARTY_COUNTRY",
        "CALLING_PARTY_NUMBER_TYPE", "CALLED_PARTY_COUNTRY", "CALLING_PARTY_SRISM_RESULT",
        "ANUM_NATURE_OF_ADDRESS", "NODE", "REDIRECTING_REASON"].includes(fact);
      if (significant) {
        anomalies.push({
          type: "rare_categorical",
          severity: "LOW",
          fact,
          title: fact + " has rare values",
          detail: rareValues.slice(0, 5).map((v) => v.value + " (" + v.count + ", " + v.pct + "%)").join(", "),
          stat: s,
        });
      }
    }

    // High null rate on important field
    if (s.null_count > 0 && s.null_count / (s.total + s.null_count) > 0.1) {
      const nullPct = Math.round((s.null_count / (s.total + s.null_count)) * 100);
      const important = ["TRANSIT_OPERATOR", "HOME_OPERATOR", "CALLING_PARTY_NUMBER_TYPE",
        "CALLED_PARTY_NUMBER_TYPE", "CALLED_PARTY_COUNTRY"].includes(fact);
      if (important && nullPct > 20) {
        anomalies.push({
          type: "high_null_rate",
          severity: "MEDIUM",
          fact,
          title: fact + " has " + nullPct + "% null values",
          detail: s.null_count + " records missing " + fact + " — may indicate routing issues or data gaps.",
          stat: s,
        });
      }
    }
  }

  // 3. Boolean anomalies
  for (const [fact, s] of Object.entries(stats.boolean)) {
    // Blacklist/whitelist flags that are unexpectedly high or low
    if (fact.includes("BLACKLISTED") && s.true_pct > 5) {
      anomalies.push({
        type: "high_boolean",
        severity: s.true_pct > 20 ? "HIGH" : "MEDIUM",
        fact,
        title: s.true_pct + "% of records have " + fact + " = true",
        detail: s.true_count + " out of " + (s.true_count + s.false_count) + " records are blacklisted.",
        stat: s,
      });
    }
  }

  // 4. Cross-pattern anomalies
  for (const p of stats.crossPatterns) {
    if (p.count > 0 && p.pct > 0.1) {
      anomalies.push({
        type: "cross_pattern",
        severity: p.pct > 5 ? "HIGH" : p.pct > 1 ? "MEDIUM" : "LOW",
        fact: null,
        title: p.label,
        detail: p.count + " records (" + p.pct + "%) match: " + p.conditions,
        stat: p,
      });
    }
  }

  // 5. Decision ratio analysis
  const totalDecisions = stats.decisions.continue + stats.decisions.release;
  if (totalDecisions > 0) {
    const releasePct = Math.round((stats.decisions.release / totalDecisions) * 100);
    if (releasePct > 20) {
      anomalies.push({
        type: "high_release_rate",
        severity: releasePct > 40 ? "HIGH" : "MEDIUM",
        fact: null,
        title: releasePct + "% of calls are being released/blocked",
        detail: stats.decisions.release + " released vs " + stats.decisions.continue +
          " continued. High block rate may indicate aggressive rules or active attack.",
        stat: stats.decisions,
      });
    } else if (releasePct < 1 && totalDecisions > 1000) {
      anomalies.push({
        type: "low_release_rate",
        severity: "MEDIUM",
        fact: null,
        title: "Only " + releasePct + "% of calls are being blocked",
        detail: "Very low block rate across " + totalDecisions + " calls. Rules may be too conservative.",
        stat: stats.decisions,
      });
    }
  }

  // Sort by severity then type
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  anomalies.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

  return anomalies;
}

// Build compact anomaly summary for AI consumption (minimise tokens)
export function buildAnomalySummary(stats, anomalies) {
  const lines = [];
  lines.push("DATASET: " + stats.totalRows + " call records");
  lines.push("DECISIONS: " + stats.decisions.continue + " continue, " + stats.decisions.release + " released");
  lines.push("");

  // Top anomalies
  lines.push("ANOMALIES DETECTED:");
  for (const a of anomalies.slice(0, 15)) {
    lines.push("- [" + a.severity + "] " + a.title + ": " + a.detail);
  }
  lines.push("");

  // Key numeric distributions (only facts with data)
  lines.push("KEY NUMERIC DISTRIBUTIONS:");
  const keyNumeric = Object.entries(stats.numeric)
    .filter(([, s]) => s.count > 100)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);
  for (const [fact, s] of keyNumeric) {
    lines.push("  " + fact + ": mean=" + s.mean + " stddev=" + s.stddev +
      " p50=" + s.p50 + " p95=" + s.p95 + " p99=" + s.p99 + " max=" + s.max +
      " (n=" + s.count + ")");
  }
  lines.push("");

  // Key categorical breakdowns
  lines.push("KEY CATEGORICAL BREAKDOWNS:");
  const keyCat = Object.entries(stats.categorical)
    .filter(([, s]) => s.total > 100)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);
  for (const [fact, s] of keyCat) {
    const top = s.top_values.slice(0, 5).map((v) => v.value + ":" + v.pct + "%").join(", ");
    lines.push("  " + fact + ": " + top + " (" + s.unique_count + " unique)");
  }
  lines.push("");

  // Cross patterns with matches
  const matched = stats.crossPatterns.filter((p) => p.count > 0);
  if (matched.length > 0) {
    lines.push("CROSS-PATTERN MATCHES:");
    for (const p of matched) {
      lines.push("  " + p.label + ": " + p.count + " records (" + p.pct + "%)");
    }
  }

  return lines.join("\n");
}
