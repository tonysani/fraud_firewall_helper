import { useState, useMemo } from "react";
import {
  SAMPLE_RULES,
  RULE_STAGES,
  RULE_STATES,
  ACTION_TYPES,
  RULE_CATEGORIES,
  formatDuration,
} from "../data/rules";
import { FACTS } from "../data/facts";
import { parseConditions, getCatColor } from "../utils/helpers";
import ConditionChip from "../components/ConditionChip";

// ── Pipeline visualization ──
function PipelineBar() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "18px 24px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        Call Processing Pipeline
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {RULE_STATES.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--bg-secondary)",
                borderRadius: i === 0 ? "8px 0 0 8px" : i === RULE_STATES.length - 1 ? "0 8px 8px 0" : 0,
                borderRight: i < RULE_STATES.length - 1 ? "1px solid var(--border)" : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 2,
                }}
              >
                {s.id}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{s.desc}</div>
            </div>
            {i < RULE_STATES.length - 1 && (
              <div style={{ color: "var(--text-ghost)", fontSize: 10, padding: "0 2px", flexShrink: 0 }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action type legend ──
function ActionLegend() {
  const groups = [
    { type: "SYSTEM", label: "System", desc: "Pipeline control" },
    { type: "MAINTAIN", label: "Maintain", desc: "False positive removal" },
    { type: "DETECT", label: "Detect", desc: "Blacklist fraudsters" },
    { type: "BLOCK", label: "Block", desc: "Terminate call" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {groups.map((g) => {
        const actions = Object.entries(ACTION_TYPES).filter(([, v]) => v.type === g.type);
        return (
          <div
            key={g.type}
            style={{
              padding: "10px 14px",
              background: "var(--bg-card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              flex: 1,
              minWidth: 140,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              {g.label}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-ghost)", marginBottom: 8 }}>
              {g.desc}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {actions.map(([name, info]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>{info.icon}</span>
                  <span style={{ fontSize: 10, color: info.color, fontFamily: "var(--font-mono)" }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Single Rule Card ──
function RuleCard({ rule, expanded, onToggle }) {
  const actionInfo = ACTION_TYPES[rule.action] || { color: "#8b949e", icon: "◉", type: "SYSTEM" };
  const catInfo = RULE_CATEGORIES[rule.category] || { color: "#8b949e", icon: "◉" };
  const stageInfo = RULE_STAGES[rule.stage] || {};
  const conds = rule.conditions ? parseConditions(rule.conditions) : [];
  const hasArgs = rule.arguments && Object.keys(rule.arguments).length > 0;
  const dur = rule.arguments?.duration ? formatDuration(rule.arguments.duration) : null;

  // Type-based left border color
  const typeColors = { SYSTEM: "#4f46e5", DETECT: "#dc2626", BLOCK: "#e11d48", MAINTAIN: "#059669", ALLOW: "#16a34a", INTEL: "#ca8a04" };
  const leftColor = typeColors[actionInfo.type] || "#444";

  return (
    <div
      onClick={onToggle}
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        border: `1px solid ${expanded ? leftColor + "44" : "var(--border)"}`,
        borderLeft: `3px solid ${leftColor}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header row */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Action icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${actionInfo.color}12`,
            border: `1px solid ${actionInfo.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {actionInfo.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {rule.name}
            </span>

            {/* Stage */}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                padding: "2px 8px",
                borderRadius: 4,
                background: `${stageInfo.color}12`,
                color: stageInfo.color,
                border: `1px solid ${stageInfo.color}22`,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {stageInfo.label}
            </span>

            {/* Action */}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 12,
                background: `${actionInfo.color}15`,
                color: actionInfo.color,
                border: `1px solid ${actionInfo.color}25`,
                fontWeight: 600,
              }}
            >
              {rule.action}
            </span>

            {/* Category (non-system) */}
            {rule.category !== "System" && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: `${catInfo.color}15`,
                  color: catInfo.color,
                  border: `1px solid ${catInfo.color}25`,
                  fontWeight: 600,
                }}
              >
                {catInfo.icon} {rule.category}
              </span>
            )}

            {/* Duration badge */}
            {dur && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "#fffbeb",
                  color: "var(--accent-yellow)",
                  border: "1px solid #fde68a",
                }}
              >
                ⏱ {dur}
              </span>
            )}
          </div>

          {/* State */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-ghost)" }}>State:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
              {rule.state}
            </span>
          </div>

          {/* Condition preview (collapsed) */}
          {rule.conditions && !expanded && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-ghost)",
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 4,
              }}
            >
              {rule.conditions}
            </div>
          )}

          {/* No conditions */}
          {!rule.conditions && !expanded && (
            <div style={{ fontSize: 10, color: "var(--text-ghost)", fontStyle: "italic", marginTop: 4 }}>
              No conditions — applies to all calls at this state
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--text-ghost)",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          ▾
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Conditions breakdown */}
          {conds.length > 0 && (
            <div style={{ padding: "16px 18px 12px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Conditions ({conds.length} criteria)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {conds.map((cond, i) => {
                  const factInfo = FACTS.find((f) => f.name === cond.fact);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {i > 0 && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            color: "var(--accent-blue)",
                            fontWeight: 700,
                            letterSpacing: 1,
                            width: 36,
                            textAlign: "center",
                          }}
                        >
                          AND
                        </span>
                      )}
                      {i === 0 && <span style={{ width: 36 }} />}
                      <ConditionChip cond={cond} />
                      {factInfo && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)", fontStyle: "italic" }}>
                          {factInfo.desc}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Arguments */}
          {hasArgs && (
            <div style={{ padding: "0 18px 12px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Action Arguments
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {Object.entries(rule.arguments).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{key}:</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--accent-yellow)",
                        fontWeight: 600,
                      }}
                    >
                      {key === "duration" ? formatDuration(val) + " (" + val + "s)" : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action explanation */}
          <div
            style={{
              padding: "10px 14px",
              margin: "0 18px 8px",
              background: `${actionInfo.color}08`,
              borderRadius: 8,
              border: `1px solid ${actionInfo.color}15`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>{actionInfo.icon}</span>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: actionInfo.color,
                  fontWeight: 600,
                }}
              >
                {rule.action}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 8 }}>
                {actionInfo.desc}
              </span>
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              padding: "12px 18px 16px",
              margin: "0 18px 14px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Explanation
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {rule.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function CurrentRules() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [showPipeline, setShowPipeline] = useState(true);

  const allCats = useMemo(
    () => ["All", ...new Set(SAMPLE_RULES.map((r) => r.category))],
    []
  );
  const allTypes = ["All", "SYSTEM", "DETECT", "BLOCK", "MAINTAIN"];

  const filtered = useMemo(() => {
    return SAMPLE_RULES.filter((r) => {
      if (filterCat !== "All" && r.category !== filterCat) return false;
      if (filterStage !== "All" && r.stage !== filterStage) return false;
      if (filterType !== "All") {
        const aType = ACTION_TYPES[r.action]?.type;
        if (aType !== filterType) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.conditions || "").toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [search, filterCat, filterType, filterStage]);

  // Stats
  const stats = {
    total: SAMPLE_RULES.length,
    detect: SAMPLE_RULES.filter((r) => ACTION_TYPES[r.action]?.type === "DETECT").length,
    system: SAMPLE_RULES.filter((r) => ACTION_TYPES[r.action]?.type === "SYSTEM").length,
    maintain: SAMPLE_RULES.filter((r) => ACTION_TYPES[r.action]?.type === "MAINTAIN").length,
    cats: new Set(SAMPLE_RULES.filter((r) => r.category !== "System").map((r) => r.category)).size,
  };

  return (
    <div style={{ padding: "24px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Rules", value: stats.total, color: "var(--accent-blue)" },
          { label: "Detection", value: stats.detect, color: "#dc2626" },
          { label: "System", value: stats.system, color: "#4f46e5" },
          { label: "Maintenance", value: stats.maintain, color: "#059669" },
          { label: "Fraud Categories", value: stats.cats, color: "var(--accent-yellow)" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "12px 18px",
              background: "var(--bg-card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              flex: 1,
              minWidth: 100,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline toggle + visualization */}
      <div style={{ marginBottom: 4 }}>
        <button
          onClick={() => setShowPipeline(!showPipeline)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-dim)",
            fontSize: 11,
            padding: "4px 0",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ transform: showPipeline ? "rotate(90deg)" : "none", transition: "transform 0.15s", fontSize: 9 }}>▶</span>
          {showPipeline ? "Hide" : "Show"} Pipeline & Action Legend
        </button>
      </div>
      {showPipeline && (
        <>
          <PipelineBar />
          <ActionLegend />
        </>
      )}

      {/* Search & filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by name, conditions, category, action..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Stage filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Stage</span>
          {["All", "PRE", "POST"].map((s) => {
            const on = filterStage === s;
            const c = s === "All" ? "#8b949e" : RULE_STAGES[s]?.color || "#8b949e";
            return (
              <button
                key={s}
                onClick={() => setFilterStage(s)}
                style={{
                  background: on ? `${c}22` : "transparent",
                  color: on ? c : "var(--text-ghost)",
                  border: `1px solid ${on ? c + "44" : "transparent"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {s === "All" ? "All" : RULE_STAGES[s]?.label || s}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Type</span>
          {allTypes.map((t) => {
            const on = filterType === t;
            const typeColors = { SYSTEM: "#4f46e5", DETECT: "#dc2626", BLOCK: "#e11d48", MAINTAIN: "#059669", ALLOW: "#16a34a", INTEL: "#ca8a04" };
            const c = t === "All" ? "#8b949e" : typeColors[t] || "#8b949e";
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  background: on ? `${c}22` : "transparent",
                  color: on ? c : "var(--text-ghost)",
                  border: `1px solid ${on ? c + "44" : "transparent"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {t === "All" ? "All" : t}
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Category</span>
          {allCats.map((c) => {
            const on = filterCat === c;
            const catColor = RULE_CATEGORIES[c]?.color || "#8b949e";
            return (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                style={{
                  background: on ? `${catColor}22` : "transparent",
                  color: on ? catColor : "var(--text-ghost)",
                  border: `1px solid ${on ? catColor + "44" : "transparent"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
        {filtered.length} of {SAMPLE_RULES.length} rules
        {search && (
          <span>
            {" "}matching &ldquo;<span style={{ color: "var(--accent-blue)" }}>{search}</span>&rdquo;
          </span>
        )}
      </div>

      {/* Rule list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((r) => (
          <RuleCard
            key={r.id}
            rule={r}
            expanded={expandedId === r.id}
            onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: 13,
            }}
          >
            No rules match your filters
          </div>
        )}
      </div>
    </div>
  );
}
