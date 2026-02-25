import { useState } from "react";
import { FACTS, FACTS_TEXT } from "../data/facts";
import { parseConditions, getCatColor } from "../utils/helpers";
import { ACTION_TYPES } from "../data/rules";
import ConditionChip from "../components/ConditionChip";

const EXAMPLES = [
  "Detect numbers making hundreds of short calls to unique international numbers — likely wangiri",
  "Block SIM boxes using multiple IMEIs from hot cell towers with high call volumes",
  "Find CLI spoofing where home operator doesn't match transit and ATI checks fail",
  "Identify new subscribers making unusually high international calls at night",
  "Block burst calling with rapid repeated calls to the same B-number",
  "Detect call forwarding chains landing on premium rate IPRN numbers",
];

export default function AIDesigner() {
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const analyze = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          factsText: FACTS_TEXT,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      setHistory((prev) => [
        { desc, result: data, time: new Date() },
        ...prev.slice(0, 9),
      ]);
    } catch (e) {
      setError("Analysis failed: " + e.message);
    }
    setLoading(false);
  };

  const riskColors = {
    HIGH: { bg: "#fef2f2", color: "#dc2626", border: "#dc2626" },
    MEDIUM: { bg: "#fffbeb", color: "#ca8a04", border: "#ca8a04" },
    LOW: { bg: "#f0fdf4", color: "#16a34a", border: "#16a34a" },
  };

  return (
    <div style={{ padding: "28px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Input */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            background: "var(--bg-inset)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Describe the fraud you want to detect
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                AI will recommend FACTS and generate rule designs
              </div>
            </div>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Example: I want to detect numbers making a high volume of calls to many different international numbers, especially from new subscribers..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 14,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) analyze();
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>⌘+Enter to submit</span>
            <button
              onClick={analyze}
              disabled={loading || !desc.trim()}
              style={{
                background:
                  loading || !desc.trim()
                    ? "var(--bg-inset)"
                    : "rgba(124,58,237,0.12)",
                color: loading || !desc.trim() ? "var(--text-dim)" : "var(--accent-purple)",
                border: `1px solid ${loading || !desc.trim() ? "var(--border)" : "rgba(124,58,237,0.35)"}`,
                borderRadius: 12,
                padding: "11px 28px",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !desc.trim() ? "default" : "pointer",
              }}
            >
              {loading ? "⟳ Analysing..." : "✦ Analyse & Recommend"}
            </button>
          </div>
        </div>

        {/* Examples */}
        <div style={{ padding: "14px 24px" }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-ghost)",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Example Scenarios
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 6,
            }}
          >
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDesc(ex)}
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-faint)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 11,
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 48,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>
            ✦
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Analysing fraud pattern and recommending FACTS...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent-red)",
            padding: 20,
          }}
        >
          <div style={{ color: "var(--accent-red)", fontSize: 13 }}>{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Analysis header */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${riskColors[result.risk_level]?.border || "#444"}`,
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {result.fraud_type}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontWeight: 700,
                  background: riskColors[result.risk_level]?.bg,
                  color: riskColors[result.risk_level]?.color,
                }}
              >
                {result.risk_level} RISK
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
              {result.analysis}
            </p>
          </div>

          {/* Recommended Facts */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 22px",
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                📋 Recommended FACTS ({(result.recommended_facts || []).length})
              </span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {(result.recommended_facts || []).map((rf, i) => {
                const fact = FACTS.find((f) => f.name === rf.name);
                const c = fact
                  ? getCatColor(fact.cat)
                  : { tx: "#596577", bd: "#d8dde4", ic: "◉" };
                const pc = rf.priority === "PRIMARY" ? "#58a6ff" : "#8b949e";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "10px 14px",
                      background: "var(--bg-inset)",
                      borderRadius: 10,
                      border: `1px solid ${c.bd}22`,
                      borderLeft: `3px solid ${pc}55`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: `${pc}18`,
                        color: pc,
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {rf.priority}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: c.tx,
                            fontWeight: 600,
                          }}
                        >
                          {rf.name}
                        </span>
                        {fact && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 9,
                              color: `${c.tx}77`,
                            }}
                          >
                            {fact.type} · {c.ic} {fact.cat}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-faint)",
                          marginTop: 3,
                          lineHeight: 1.4,
                        }}
                      >
                        {rf.relevance}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rule options */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 22px",
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                ⚙️ Rule Designs
              </span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {(result.rule_options || []).map((ro, i) => {
                const agC =
                  ro.aggressiveness === "Aggressive"
                    ? "#ff7b72"
                    : ro.aggressiveness === "Moderate"
                    ? "#e3b341"
                    : "#56d364";
                const acC = ACTION_TYPES[ro.action]?.color || "#8b949e";
                const conds = parseConditions(ro.conditions_text || "");
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-secondary)",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}
                        >
                          {ro.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            padding: "2px 10px",
                            borderRadius: 12,
                            background: `${agC}18`,
                            color: agC,
                            fontWeight: 600,
                          }}
                        >
                          {ro.aggressiveness}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            padding: "2px 10px",
                            borderRadius: 12,
                            background: `${acC}18`,
                            color: acC,
                            fontWeight: 600,
                          }}
                        >
                          {ro.action}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--text-faint)",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {ro.description}
                      </p>
                    </div>
                    <div style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {conds.map((cond, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {j > 0 && (
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 9,
                                  color: "var(--accent-blue)",
                                  fontWeight: 700,
                                  width: 36,
                                  textAlign: "center",
                                }}
                              >
                                AND
                              </span>
                            )}
                            {j === 0 && <span style={{ width: 36 }} />}
                            <ConditionChip cond={cond} />
                          </div>
                        ))}
                      </div>
                      {ro.notes && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-dim)",
                            fontStyle: "italic",
                            margin: "10px 0 0",
                          }}
                        >
                          💡 {ro.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Considerations */}
          {(result.considerations || []).length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "14px 22px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                ⚠️ Deployment Considerations
              </div>
              {result.considerations.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent-yellow)", flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {c}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Related */}
          {(result.related_fraud_types || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Related:</span>
              {result.related_fraud_types.map((ft, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--bg-inset)",
                    color: "var(--text-faint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {ft}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && !loading && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-ghost)",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Recent Analyses
          </div>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                setDesc(h.desc);
                setResult(h.result);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
                background: "var(--bg-card)",
                color: "var(--text-faint)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 11,
                textAlign: "left",
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {h.desc}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-ghost)" }}>
                  {h.result.fraud_type} · {h.result.rule_options?.length || 0} rules
                </div>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-ghost)", flexShrink: 0 }}>
                {h.time.toLocaleTimeString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
