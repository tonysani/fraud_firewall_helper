import { useState, useMemo } from "react";
import { FACTS } from "../data/facts";
import { searchFacts, getCatColor, getOperators } from "../utils/helpers";

const HINTS = [
  "wangiri", "sim box", "burst calling", "CLI spoof", "premium rate",
  "roaming", "new subscriber", "international", "device swap", "hot cell",
  "signalling", "duplicate", "redirect",
];

export default function FactExplorer() {
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const cats = useMemo(
    () => ["All", ...[...new Set(FACTS.map((f) => f.cat))].sort()],
    []
  );

  const results = useMemo(() => {
    let r = searchFacts(search);
    if (selCat !== "All") r = r.filter((f) => f.cat === selCat);
    return r;
  }, [search, selCat]);

  return (
    <div style={{ padding: "28px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FACTS — try 'wangiri', 'sim box', 'CLI spoof', 'burst', 'premium rate'..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "15px 16px",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* Hint pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {HINTS.map((h) => (
          <button
            key={h}
            onClick={() => { setSearch(h); setSelCat("All"); }}
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-faint)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 11,
            }}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
        {cats.map((c) => {
          const cc = c === "All" ? { tx: "#596577", bd: "#d8dde4" } : getCatColor(c);
          const on = selCat === c;
          return (
            <button
              key={c}
              onClick={() => setSelCat(c)}
              style={{
                background: on ? `${cc.bd}28` : "transparent",
                color: on ? cc.tx : "var(--text-ghost)",
                border: `1px solid ${on ? cc.bd + "55" : "transparent"}`,
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
        {results.length} facts found
        {search && (
          <> for &ldquo;<span style={{ color: "var(--accent-blue)" }}>{search}</span>&rdquo;</>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 10,
        }}
      >
        {results.map((f) => {
          const c = getCatColor(f.cat);
          const isX = expanded === f.name;
          return (
            <div
              key={f.name}
              onClick={() => setExpanded(isX ? null : f.name)}
              style={{
                background: "var(--bg-card)",
                borderRadius: 12,
                border: `1px solid ${isX ? c.bd + "66" : "var(--border)"}`,
                borderLeft: `3px solid ${c.bd}`,
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: c.tx,
                        fontWeight: 600,
                        marginBottom: 4,
                        wordBreak: "break-all",
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {f.desc}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: `${c.bd}18`,
                        color: c.tx,
                        border: `1px solid ${c.bd}33`,
                      }}
                    >
                      {f.type}
                    </span>
                    <span style={{ fontSize: 9, color: `${c.tx}77` }}>
                      {c.ic} {f.cat}
                    </span>
                  </div>
                </div>

                {/* Expanded operators */}
                {isX && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${c.bd}22`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-dim)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Available Operators
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {getOperators(f.type).map((o) => (
                        <span
                          key={o.op}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "var(--bg-inset)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span style={{ color: c.tx, marginRight: 4 }}>{o.s}</span>
                          {o.l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {results.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-dim)" }}>
          No matching FACTS found
        </div>
      )}
    </div>
  );
}
