import { NAV_TABS } from "../utils/helpers";
import { FACTS } from "../data/facts";
import { SAMPLE_RULES, RULE_STAGES } from "../data/rules";

export default function Sidebar({ activeTab, onTabChange, isOpen, onToggle }) {
  return (
    <div
      style={{
        width: isOpen ? 240 : 64,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: isOpen ? "20px 18px" : "20px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #b91c1c, #dc2626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🛡
        </div>
        {isOpen && (
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              Fraud Firewall
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--text-ghost)",
                textTransform: "uppercase",
                letterSpacing: 2,
                whiteSpace: "nowrap",
              }}
            >
              Intelligence Platform
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div
        style={{
          padding: "12px 8px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {NAV_TABS.map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: isOpen ? "10px 14px" : "10px 0",
                width: "100%",
                boxSizing: "border-box",
                background: on ? `${t.accent}12` : "transparent",
                border: `1px solid ${on ? t.accent + "33" : "transparent"}`,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                justifyContent: isOpen ? "flex-start" : "center",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  flexShrink: 0,
                  filter: on ? "none" : "grayscale(0.5) opacity(0.6)",
                }}
              >
                {t.icon}
              </span>
              {isOpen && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: on ? 600 : 400,
                      color: on ? "var(--text-primary)" : "var(--text-faint)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: on ? t.accent : "var(--text-ghost)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {isOpen && (
        <div style={{ padding: "16px 18px", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--text-ghost)",
            }}
          >
            {FACTS.length} FACTS · {SAMPLE_RULES.filter(r => r.stage === "PRE").length} Pre · {SAMPLE_RULES.filter(r => r.stage === "POST").length} Post
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--text-ghost)",
              marginTop: 2,
            }}
          >
            v1.0 · Orillion
          </div>
        </div>
      )}
    </div>
  );
}
