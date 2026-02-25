import { useState } from "react";
import { FACTS, FACTS_TEXT } from "../data/facts";
import { parseConditions, getCatColor } from "../utils/helpers";
import { ACTION_TYPES } from "../data/rules";
import ConditionChip from "../components/ConditionChip";

/* ── Traffic type options ── */
const TRAFFIC_TYPES = [
  {
    id: "intl_inbound",
    label: "International Inbound",
    icon: "🌍→",
    desc: "Calls arriving from international routes into the network",
    hint: "e.g. Simboxing, CLI Spoofing, Wangiri, FlashCalls",
    population: "CALL_DIRECTION = IN, international origin (non-995 prefix)",
  },
  {
    id: "intl_outbound",
    label: "International Outbound",
    icon: "→🌍",
    desc: "Calls originating locally going to international destinations",
    hint: "e.g. IRSF, Wangiri callback, Premium Rate",
    population: "CALL_DIRECTION = OUT, international destination",
  },
  {
    id: "local",
    label: "Local / National",
    icon: "🏠",
    desc: "Calls within the domestic network",
    hint: "e.g. Local SIM box, domestic flash calls",
    population: "Domestic calls (995 prefix both ends)",
  },
  {
    id: "all",
    label: "All Traffic",
    icon: "📡",
    desc: "Apply across all call types",
    hint: "e.g. Number length validation, CLI format checks",
    population: "No traffic filter — all calls",
  },
];

/* ── Rule type options ── */
const RULE_TYPES = [
  {
    id: "detect_block",
    label: "Detect & Block",
    icon: "✋",
    color: "#e11d48",
    desc: "Single rule that detects and immediately blocks matching calls",
    detail:
      "Creates one POST/Active rule with Release action. Best for pattern-based blocking where you want instant action on each call independently.",
    output: "1 rule: detection conditions → Release",
  },
  {
    id: "detect_blacklist_block",
    label: "Detect, Blacklist & Block",
    icon: "🚫",
    color: "#dc2626",
    desc: "Detection rule adds to blacklist, then active rule blocks all calls from blacklisted numbers",
    detail:
      "Creates a PRE rule to detect and add A-number to blacklist, plus a POST/Active rule to block all subsequent calls from blacklisted numbers. Includes auto-removal rules for false positives. Best for behavioural detection over time.",
    output: "2-3 rules: detection → Blacklist + blacklisted → Release + removal",
  },
];

/* ── Example scenarios by traffic type ── */
const EXAMPLES = {
  intl_inbound: [
    "Detect numbers making hundreds of short calls to unique Georgian numbers — likely wangiri",
    "Block SIM boxes: multiple IMEIs from hot cell towers with high call volumes",
    "Find CLI spoofing where home operator doesn't match transit operator",
    "Detect flash calls: very short duration, high B-ratio, low completion rate",
    "Block calls from unallocated international number ranges (NPV invalid)",
  ],
  intl_outbound: [
    "Detect new subscribers making unusually high international calls",
    "Find calls to known IPRN/premium rate numbers",
    "Block burst calling with rapid repeated calls to the same B-number",
    "Detect call forwarding chains landing on premium rate numbers",
  ],
  local: [
    "Detect local numbers with flash call indicators: high B-ratio, short duration",
    "Find Georgian numbers making burst calls to many different local numbers",
    "Block domestic SIM box patterns: multiple IMEIs, hot cells, high velocity",
  ],
  all: [
    "Block non-numeric or special character CLIs",
    "Block Georgian numbers that don't have exactly 12 digits",
    "Block any number exceeding 15 digits",
    "Detect duplicate calls to same B-number within 1 second",
  ],
};

export default function AIDesigner() {
  const [step, setStep] = useState(1);
  const [trafficType, setTrafficType] = useState(null);
  const [ruleType, setRuleType] = useState(null);
  const [routeFilter, setRouteFilter] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const reset = () => {
    setStep(1);
    setTrafficType(null);
    setRuleType(null);
    setRouteFilter("");
    setDesc("");
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const traffic = TRAFFIC_TYPES.find((t) => t.id === trafficType);
    const rule = RULE_TYPES.find((r) => r.id === ruleType);

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          factsText: FACTS_TEXT,
          trafficType: traffic
            ? { id: traffic.id, label: traffic.label, population: traffic.population }
            : null,
          ruleType: rule
            ? { id: rule.id, label: rule.label, output: rule.output }
            : null,
          routeFilter: routeFilter.trim() || null,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
      setHistory((prev) => [
        {
          desc,
          trafficLabel: traffic?.label,
          ruleLabel: rule?.label,
          result: data,
          time: new Date(),
        },
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

  /* ── Step indicator ── */
  const StepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, padding: "0 4px" }}>
      {[
        { n: 1, label: "Traffic" },
        { n: 2, label: "Rule Type" },
        { n: 3, label: "Detection" },
      ].map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
          <button
            onClick={() => { if (s.n < step) setStep(s.n); }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid " + (step >= s.n ? "rgba(124,58,237,0.7)" : "var(--border)"),
              background:
                step === s.n
                  ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                  : step > s.n
                  ? "rgba(124,58,237,0.12)"
                  : "var(--bg-secondary)",
              color: step === s.n ? "#fff" : step > s.n ? "var(--accent-purple)" : "var(--text-dim)",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: s.n < step ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            {step > s.n ? "\u2713" : s.n}
          </button>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: step >= s.n ? "var(--text-primary)" : "var(--text-dim)",
              marginLeft: 8,
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </span>
          {i < 2 && (
            <div
              style={{
                flex: 1,
                height: 2,
                margin: "0 12px",
                background: step > s.n ? "rgba(124,58,237,0.35)" : "var(--border)",
                borderRadius: 1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  /* ── Selection summary chips ── */
  const SelectionSummary = () => {
    const items = [];
    if (trafficType) {
      const t = TRAFFIC_TYPES.find((x) => x.id === trafficType);
      items.push({ label: t.label, icon: t.icon });
    }
    if (routeFilter) items.push({ label: routeFilter, icon: "\uD83D\uDD00" });
    if (ruleType) {
      const r = RULE_TYPES.find((x) => x.id === ruleType);
      items.push({ label: r.label, icon: r.icon });
    }
    if (!items.length) return null;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(124,58,237,0.08)",
              color: "var(--accent-purple)",
              border: "1px solid rgba(124,58,237,0.2)",
              fontWeight: 600,
            }}
          >
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "28px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>AI Rule Designer</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Build rules step by step with AI recommendations</div>
          </div>
        </div>
        {(step > 1 || result) && (
          <button
            onClick={reset}
            style={{
              fontSize: 11, padding: "6px 14px", borderRadius: 8,
              background: "var(--bg-secondary)", color: "var(--text-faint)",
              border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600,
            }}
          >
            ↺ Start Over
          </button>
        )}
      </div>

      {/* Step indicator */}
      {!result && !loading && <StepIndicator />}

      {/* Selection summary */}
      {step > 1 && !result && !loading && <SelectionSummary />}

      {/* ═══ STEP 1: Traffic Type ═══ */}
      {step === 1 && !result && !loading && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>What traffic does this rule apply to?</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Select the call direction to define the population</div>
          </div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TRAFFIC_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTrafficType(t.id); setStep(2); }}
                style={{
                  background: trafficType === t.id ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                  border: "1px solid " + (trafficType === t.id ? "rgba(124,58,237,0.35)" : "var(--border)"),
                  borderRadius: 12, padding: "16px 18px", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 6, fontStyle: "italic" }}>{t.hint}</div>
              </button>
            ))}
          </div>
          <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text-ghost)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              Optional: Specific Route or Operator
            </div>
            <input
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              placeholder='e.g. "Magti", "Silknet Fixed", "Beeline"...'
              style={{
                width: "100%", boxSizing: "border-box", background: "var(--bg-secondary)",
                color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "8px 12px", fontSize: 12, outline: "none", fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Rule Type ═══ */}
      {step === 2 && !result && !loading && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>How should detected fraud be handled?</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Choose the rule mechanism</div>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {RULE_TYPES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRuleType(r.id); setStep(3); }}
                style={{
                  background: ruleType === r.id ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                  border: "1px solid " + (ruleType === r.id ? "rgba(124,58,237,0.35)" : "var(--border)"),
                  borderRadius: 12, padding: "18px 20px", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 22, width: 40, height: 40, borderRadius: 10,
                      background: r.color + "12", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {r.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, marginBottom: 8, paddingLeft: 50 }}>{r.detail}</div>
                <div
                  style={{
                    fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-purple)",
                    background: "rgba(124,58,237,0.06)", padding: "5px 10px", borderRadius: 6, marginLeft: 50, display: "inline-block",
                  }}
                >
                  Output: {r.output}
                </div>
              </button>
            ))}
          </div>
          <div style={{ padding: "0 24px 16px" }}>
            <button onClick={() => setStep(1)} style={{ fontSize: 11, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              ← Back to traffic selection
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Detection Description ═══ */}
      {step === 3 && !result && !loading && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Describe what you want to detect</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>AI will recommend FACTS and generate rule conditions</div>
          </div>
          <div style={{ padding: "16px 24px" }}>
            <SelectionSummary />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe the fraud behaviour or pattern you want to detect..."
              style={{
                width: "100%", boxSizing: "border-box", background: "var(--bg-secondary)",
                color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 12,
                padding: "14px 16px", fontSize: 14, outline: "none", resize: "vertical",
                lineHeight: 1.6, fontFamily: "inherit",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze(); }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ fontSize: 11, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                ← Back
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>⌘+Enter to submit</span>
                <button
                  onClick={analyze}
                  disabled={!desc.trim()}
                  style={{
                    background: !desc.trim() ? "var(--bg-inset)" : "rgba(124,58,237,0.12)",
                    color: !desc.trim() ? "var(--text-dim)" : "var(--accent-purple)",
                    border: "1px solid " + (!desc.trim() ? "var(--border)" : "rgba(124,58,237,0.35)"),
                    borderRadius: 12, padding: "11px 28px", fontSize: 13, fontWeight: 600,
                    cursor: !desc.trim() ? "default" : "pointer",
                  }}
                >
                  ✦ Generate Rules
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>
              Example Scenarios
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(EXAMPLES[trafficType] || EXAMPLES.all).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setDesc(ex)}
                  style={{
                    background: "var(--bg-secondary)", color: "var(--text-faint)",
                    border: "1px solid var(--border)", borderRadius: 8,
                    padding: "8px 14px", fontSize: 11, textAlign: "left", lineHeight: 1.4, cursor: "pointer",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Loading ═══ */}
      {loading && (
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>✦</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Generating rule design...</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>Analysing fraud pattern and building conditions from available FACTS</div>
        </div>
      )}

      {/* ═══ Error ═══ */}
      {error && (
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", borderLeft: "3px solid var(--accent-red)", padding: 20, marginTop: 12 }}>
          <div style={{ color: "var(--accent-red)", fontSize: 13 }}>{error}</div>
          <button
            onClick={() => { setError(null); setStep(3); }}
            style={{ marginTop: 10, fontSize: 11, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Back to edit
          </button>
        </div>
      )}

      {/* ═══ Results ═══ */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <SelectionSummary />
            <button
              onClick={reset}
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 8,
                background: "var(--bg-secondary)", color: "var(--text-faint)",
                border: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              + New Rule
            </button>
          </div>

          {/* Analysis header */}
          <div
            style={{
              background: "var(--bg-card)", borderRadius: 14,
              border: "1px solid var(--border)",
              borderLeft: "3px solid " + (riskColors[result.risk_level]?.border || "#444"),
              padding: "18px 22px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{result.fraud_type}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 12px",
                  borderRadius: 20, fontWeight: 700,
                  background: riskColors[result.risk_level]?.bg,
                  color: riskColors[result.risk_level]?.color,
                }}
              >
                {result.risk_level} RISK
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>{result.analysis}</p>
          </div>

          {/* Rules output */}
          {(result.rules || []).map((rule, ri) => (
            <div key={ri} style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              {/* Rule header */}
              <div
                style={{
                  padding: "14px 22px", background: "var(--bg-secondary)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 10px", borderRadius: 12, fontWeight: 700,
                    background: rule.stage === "PRE" ? "rgba(37,99,235,0.1)" : "rgba(124,58,237,0.1)",
                    color: rule.stage === "PRE" ? "#2563eb" : "#7c3aed",
                  }}
                >
                  {rule.stage === "PRE" ? "PRE-VERIFICATION" : "POST-VERIFICATION"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 10px", borderRadius: 12, fontWeight: 600,
                    background: "var(--bg-inset)", color: "var(--text-dim)",
                  }}
                >
                  State: {rule.state}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{rule.name}</span>
                {(() => {
                  const ac = ACTION_TYPES[rule.action];
                  return ac ? (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 10px", borderRadius: 12,
                        background: ac.color + "14", color: ac.color, fontWeight: 700,
                      }}
                    >
                      {ac.icon} {rule.action}
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Description */}
              <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
              </div>

              {/* Population conditions */}
              {rule.population_conditions && (
                <div style={{ padding: "10px 22px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Population Filter
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {parseConditions(rule.population_conditions).map((cond, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {j > 0 && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent-blue)", fontWeight: 700, width: 36, textAlign: "center" }}>AND</span>
                        )}
                        {j === 0 && <span style={{ width: 36 }} />}
                        <ConditionChip cond={cond} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detection conditions */}
              {rule.detection_conditions && (
                <div style={{ padding: "10px 22px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Detection Conditions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {parseConditions(rule.detection_conditions).map((cond, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {j > 0 && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent-blue)", fontWeight: 700, width: 36, textAlign: "center" }}>AND</span>
                        )}
                        {j === 0 && <span style={{ width: 36 }} />}
                        <ConditionChip cond={cond} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Combined conditions fallback */}
              {!rule.population_conditions && !rule.detection_conditions && rule.conditions_text && (
                <div style={{ padding: "10px 22px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {parseConditions(rule.conditions_text).map((cond, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {j > 0 && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent-blue)", fontWeight: 700, width: 36, textAlign: "center" }}>AND</span>
                        )}
                        {j === 0 && <span style={{ width: 36 }} />}
                        <ConditionChip cond={cond} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {rule.notes && (
                <div style={{ padding: "8px 22px 12px", borderTop: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic", margin: 0 }}>
                    💡 {rule.notes}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Recommended FACTS */}
          {(result.recommended_facts || []).length > 0 && (
            <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "12px 22px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  📋 FACTS Used ({result.recommended_facts.length})
                </span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {result.recommended_facts.map((rf, i) => {
                  const fact = FACTS.find((f) => f.name === rf.name);
                  const c = fact ? getCatColor(fact.cat) : { tx: "#596577", bd: "#d8dde4", ic: "◉" };
                  const pc = rf.priority === "PRIMARY" ? "#58a6ff" : "#8b949e";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "10px 14px", background: "var(--bg-inset)", borderRadius: 10,
                        border: "1px solid " + c.bd + "22", borderLeft: "3px solid " + pc + "55",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)", fontSize: 9, padding: "2px 8px", borderRadius: 4,
                          background: pc + "18", color: pc, fontWeight: 600, flexShrink: 0, marginTop: 2,
                        }}
                      >
                        {rf.priority}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: c.tx, fontWeight: 600 }}>{rf.name}</span>
                          {fact && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: c.tx + "77" }}>
                              {fact.type} · {c.ic} {fact.cat}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.4 }}>{rf.relevance}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Considerations */}
          {(result.considerations || []).length > 0 && (
            <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", padding: "14px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>⚠️ Deployment Considerations</div>
              {result.considerations.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent-yellow)", flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{c}</span>
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
                    fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 10px", borderRadius: 20,
                    background: "var(--bg-inset)", color: "var(--text-faint)", border: "1px solid var(--border)",
                  }}
                >
                  {ft}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ History ═══ */}
      {history.length > 0 && !loading && !result && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 10, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>
            Recent Designs
          </div>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => setResult(h.result)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                width: "100%", boxSizing: "border-box", background: "var(--bg-card)",
                color: "var(--text-faint)", border: "1px solid var(--border)", borderRadius: 10,
                padding: "12px 16px", fontSize: 11, textAlign: "left", marginBottom: 6, cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-secondary)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {h.desc}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-ghost)" }}>
                  {h.trafficLabel} · {h.ruleLabel} · {h.result.rules?.length || 0} rules
                </div>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-ghost)", flexShrink: 0 }}>{h.time.toLocaleTimeString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
