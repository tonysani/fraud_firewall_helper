import { useState } from "react";
import "./styles/global.css";
import Sidebar from "./components/Sidebar";
import ScanTransactions from "./pages/ScanTransactions";
import CurrentRules from "./pages/CurrentRules";
import FactExplorer from "./pages/FactExplorer";
import AIDesigner from "./pages/AIDesigner";
import { NAV_TABS } from "./utils/helpers";

export default function App() {
  const [tab, setTab] = useState("rules");
  const [sideOpen, setSideOpen] = useState(true);

  const currentTab = NAV_TABS.find((t) => t.id === tab);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        isOpen={sideOpen}
        onToggle={() => setSideOpen(!sideOpen)}
      />

      <div style={{ flex: 1, overflow: "auto", minHeight: "100vh" }}>
        {/* Top bar */}
        <div
          style={{
            padding: "14px 40px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{currentTab?.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {currentTab?.label}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-ghost)" }}>{currentTab?.desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent-green)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-dim)",
              }}
            >
              System Active
            </span>
          </div>
        </div>

        {/* Page content */}
        {tab === "scan" && <ScanTransactions />}
        {tab === "rules" && <CurrentRules />}
        {tab === "explorer" && <FactExplorer />}
        {tab === "designer" && <AIDesigner />}
      </div>
    </div>
  );
}
