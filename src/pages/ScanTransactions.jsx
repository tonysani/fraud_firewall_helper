import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { createStatsAccumulator, processChunk, finalizeStats } from "../utils/statsEngine";
import { detectAnomalies, buildAnomalySummary } from "../utils/anomalyEngine";
import { FACTS_TEXT } from "../data/facts";

const SEVERITY_COLORS = {
  HIGH: { bg: "#fef2f2", color: "#dc2626", border: "#dc2626" },
  MEDIUM: { bg: "#fffbeb", color: "#ca8a04", border: "#ca8a04" },
  LOW: { bg: "#f0fdf4", color: "#16a34a", border: "#16a34a" },
};

/* ── Simple horizontal bar ── */
function Bar({ value, max, color, height = 14 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: "var(--bg-inset)", borderRadius: height / 2, height, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color || "#7c3aed", height: "100%", width: pct + "%", borderRadius: height / 2, transition: "width 0.3s" }} />
    </div>
  );
}

/* ── Mini distribution display ── */
function MiniDist({ stat }) {
  if (!stat) return null;
  const vals = [
    { label: "min", v: stat.min },
    { label: "p25", v: stat.p25 },
    { label: "p50", v: stat.p50 },
    { label: "mean", v: stat.mean },
    { label: "p75", v: stat.p75 },
    { label: "p95", v: stat.p95 },
    { label: "p99", v: stat.p99 },
    { label: "max", v: stat.max },
  ].filter((d) => d.v !== null && d.v !== undefined);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {vals.map((d) => (
        <div key={d.label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--text-ghost)", textTransform: "uppercase" }}>{d.label}</div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>
            {typeof d.v === "number" ? (d.v > 1000 ? (d.v / 1000).toFixed(1) + "k" : Number.isInteger(d.v) ? d.v : d.v.toFixed(2)) : d.v}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScanTransactions() {
  const [status, setStatus] = useState("idle"); // idle, processing, done, error
  const [progress, setProgress] = useState({ rows: 0, pct: 0 });
  const [stats, setStats] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [activeTab, setActiveTab] = useState("anomalies");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);
  const accRef = useRef(null);

  const processFile = useCallback((file) => {
    setFileName(file.name);
    setStatus("processing");
    setProgress({ rows: 0, pct: 0 });
    setStats(null);
    setAnomalies([]);
    setAiResult(null);
    setAiError(null);

    const acc = createStatsAccumulator();
    accRef.current = acc;
    const fileSize = file.size;
    let bytesRead = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunk: (results, parser) => {
        processChunk(acc, results.data);
        bytesRead += results.data.length * 200; // rough estimate
        const pct = Math.min(Math.round((bytesRead / fileSize) * 100), 99);
        setProgress({ rows: acc.totalRows, pct });
      },
      complete: () => {
        const finalStats = finalizeStats(acc);
        const detected = detectAnomalies(finalStats);
        setStats(finalStats);
        setAnomalies(detected);
        setProgress({ rows: acc.totalRows, pct: 100 });
        setStatus("done");
      },
      error: (err) => {
        console.error("Parse error:", err);
        setStatus("error");
      },
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      processFile(file);
    }
  }, [processFile]);

  const analyzeWithAI = async () => {
    if (!stats || !anomalies.length) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const summary = buildAnomalySummary(stats, anomalies);

    try {
      const resp = await fetch("/api/anomaly-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomalySummary: summary, factsText: FACTS_TEXT }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Analysis failed");
      setAiResult(data);
    } catch (e) {
      setAiError("AI analysis failed: " + e.message);
    }
    setAiLoading(false);
  };

  const reset = () => {
    setStatus("idle");
    setStats(null);
    setAnomalies([]);
    setAiResult(null);
    setAiError(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const fmt = (n) => {
    if (n === null || n === undefined) return "-";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  };

  return (
    <div style={{ padding: "28px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: "linear-gradient(135deg, #1f6feb, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff",
            }}
          >
            🔬
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Scan Transactions</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Upload CSV records for anomaly detection</div>
          </div>
        </div>
        {status === "done" && (
          <button onClick={reset} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, background: "var(--bg-secondary)", color: "var(--text-faint)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600 }}>
            ↺ New Scan
          </button>
        )}
      </div>

      {/* ═══ Upload Area ═══ */}
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            background: "var(--bg-card)", borderRadius: 16, border: "2px dashed var(--border)",
            padding: "60px 40px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
          <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Drop CSV file here or click to browse
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Supports files up to 2GB with 1.5M+ rows<br />
            Processing runs locally in your browser — no data uploaded to server
          </div>
          <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 16, fontFamily: "var(--font-mono)" }}>
            Expected format: CSV with columns matching RVS call records
          </div>
        </div>
      )}

      {/* ═══ Processing ═══ */}
      {status === "processing" && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 24, animation: "spin 1.5s linear infinite" }}>⚙️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Processing {fileName}...</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {fmt(progress.rows)} rows processed
              </div>
            </div>
          </div>
          <Bar value={progress.pct} max={100} color="#7c3aed" height={8} />
          <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 8, textAlign: "right" }}>{progress.pct}%</div>
        </div>
      )}

      {/* ═══ Results Dashboard ═══ */}
      {status === "done" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total Records", value: fmt(stats.totalRows), color: "#2563eb" },
              { label: "Continued", value: fmt(stats.decisions.continue), color: "#16a34a" },
              { label: "Released", value: fmt(stats.decisions.release), color: "#dc2626" },
              { label: "Anomalies", value: String(anomalies.length), color: "#ca8a04" },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
                  padding: "16px 20px", borderTop: "3px solid " + card.color,
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
            {[
              { id: "anomalies", label: "Anomalies (" + anomalies.length + ")" },
              { id: "numeric", label: "Numeric Stats" },
              { id: "categorical", label: "Categorical" },
              { id: "patterns", label: "Cross Patterns" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: "none", border: "none",
                  color: activeTab === tab.id ? "var(--accent-purple)" : "var(--text-dim)",
                  borderBottom: activeTab === tab.id ? "2px solid var(--accent-purple)" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Anomalies tab ── */}
          {activeTab === "anomalies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {anomalies.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                  No anomalies detected in this dataset.
                </div>
              )}
              {anomalies.map((a, i) => {
                const sc = SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.LOW;
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
                      borderLeft: "3px solid " + sc.border, padding: "14px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px",
                          borderRadius: 4, background: sc.bg, color: sc.color,
                        }}
                      >
                        {a.severity}
                      </span>
                      {a.fact && (
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-purple)" }}>{a.fact}</span>
                      )}
                      <span style={{ fontSize: 9, color: "var(--text-ghost)", fontFamily: "var(--font-mono)" }}>{a.type}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{a.detail}</div>
                  </div>
                );
              })}

              {/* AI Analysis button */}
              {anomalies.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={analyzeWithAI}
                    disabled={aiLoading}
                    style={{
                      background: aiLoading ? "var(--bg-inset)" : "rgba(124,58,237,0.12)",
                      color: aiLoading ? "var(--text-dim)" : "var(--accent-purple)",
                      border: "1px solid " + (aiLoading ? "var(--border)" : "rgba(124,58,237,0.35)"),
                      borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 600,
                      cursor: aiLoading ? "default" : "pointer", width: "100%",
                    }}
                  >
                    {aiLoading ? "⟳ Analysing anomalies with AI..." : "✦ Generate Rule Recommendations from Anomalies"}
                  </button>
                </div>
              )}

              {/* AI Error */}
              {aiError && (
                <div style={{ background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)", borderLeft: "3px solid #dc2626", padding: "12px 16px" }}>
                  <div style={{ color: "#dc2626", fontSize: 12 }}>{aiError}</div>
                </div>
              )}

              {/* AI Results */}
              {aiResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", borderLeft: "3px solid #7c3aed", padding: "18px 22px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                      ✦ AI Analysis
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>{aiResult.analysis}</p>
                  </div>

                  {/* Recommended rules */}
                  {(aiResult.recommended_rules || []).map((rule, ri) => (
                    <div key={ri} style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                      <div style={{ padding: "12px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 10px", borderRadius: 12, fontWeight: 700, background: rule.severity === "HIGH" ? "#dc262614" : "#ca8a0414", color: rule.severity === "HIGH" ? "#dc2626" : "#ca8a04" }}>
                          {rule.severity || "MEDIUM"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{rule.name}</span>
                        {rule.action && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 10px", borderRadius: 12, background: "#e11d4814", color: "#e11d48", fontWeight: 700 }}>
                            {rule.action}
                          </span>
                        )}
                      </div>
                      <div style={{ padding: "12px 20px" }}>
                        <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 8px", lineHeight: 1.5 }}>{rule.description}</p>
                        {rule.conditions && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-purple)", background: "rgba(124,58,237,0.06)", padding: "8px 12px", borderRadius: 8, lineHeight: 1.6 }}>
                            {rule.conditions}
                          </div>
                        )}
                        {rule.notes && (
                          <p style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic", margin: "8px 0 0" }}>💡 {rule.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Considerations */}
                  {(aiResult.considerations || []).length > 0 && (
                    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "14px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>⚠️ Considerations</div>
                      {aiResult.considerations.map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: "var(--accent-yellow)" }}>▸</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Numeric Stats tab ── */}
          {activeTab === "numeric" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(stats.numeric)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([fact, s]) => (
                  <div
                    key={fact}
                    style={{
                      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
                      padding: "14px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{fact}</span>
                        <span style={{ fontSize: 10, color: "var(--text-ghost)", marginLeft: 8 }}>
                          {fmt(s.count)} values, {fmt(s.null_count)} null
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>
                        μ={s.mean} σ={s.stddev}
                      </span>
                    </div>
                    <MiniDist stat={s} />
                  </div>
                ))}
              {Object.keys(stats.numeric).length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                  No numeric FACTS with data in this dataset.
                </div>
              )}
            </div>
          )}

          {/* ── Categorical tab ── */}
          {activeTab === "categorical" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(stats.categorical)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([fact, s]) => (
                  <div
                    key={fact}
                    style={{
                      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
                      padding: "14px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{fact}</span>
                        <span style={{ fontSize: 10, color: "var(--text-ghost)", marginLeft: 8 }}>
                          {s.unique_count} unique, {fmt(s.total)} total
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.top_values.slice(0, 8).map((v) => (
                        <div key={v.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-faint)", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.value}
                          </span>
                          <div style={{ flex: 1 }}>
                            <Bar value={v.count} max={s.top_values[0]?.count || 1} color="rgba(124,58,237,0.4)" height={10} />
                          </div>
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)", width: 60, textAlign: "right", flexShrink: 0 }}>
                            {fmt(v.count)} ({v.pct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── Cross Patterns tab ── */}
          {activeTab === "patterns" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.crossPatterns.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
                    padding: "14px 20px",
                    borderLeft: p.count > 0 ? "3px solid #ca8a04" : "3px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.label}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                        color: p.count > 0 ? "#ca8a04" : "var(--text-ghost)",
                      }}
                    >
                      {fmt(p.count)} / {fmt(p.total)} ({p.pct}%)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{p.conditions}</div>
                  <div style={{ marginTop: 6 }}>
                    <Bar value={p.count} max={p.total} color={p.count > 0 ? "#ca8a04" : "#444"} height={6} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Error ═══ */}
      {status === "error" && (
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", borderLeft: "3px solid #dc2626", padding: "24px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>Failed to process file</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Check the file is a valid CSV with the expected column headers.</div>
          <button onClick={reset} style={{ marginTop: 12, fontSize: 11, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}>
            ← Try again
          </button>
        </div>
      )}
    </div>
  );
}
