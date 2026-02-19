export default function ScanTransactions() {
  const features = [
    {
      icon: "📊",
      title: "Anomaly Detection",
      desc: "ML-based scoring of call patterns against behavioural baselines",
    },
    {
      icon: "⚡",
      title: "Real-time Scanning",
      desc: "Sub-second analysis of live CDR and signalling feeds",
    },
    {
      icon: "🎯",
      title: "Pattern Matching",
      desc: "Cross-reference transactions against known fraud signatures",
    },
    {
      icon: "📈",
      title: "Trend Analysis",
      desc: "Identify emerging fraud vectors through temporal clustering",
    },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          textAlign: "center",
          padding: "80px 40px",
          background: "var(--bg-inset)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 30%, rgba(37,99,235,0.03), transparent 60%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 24px",
            }}
          >
            🔬
          </div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 12px",
              letterSpacing: -0.5,
            }}
          >
            Fraud Transaction Scanner
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-muted)",
              maxWidth: 560,
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            AI-powered anomaly detection across live transaction data. Connect to
            your fraud database to scan, score, and surface suspicious patterns in
            real-time.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              maxWidth: 800,
              margin: "0 auto 40px",
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 18px",
                  background: "var(--bg-card)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  {f.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              color: "var(--accent-blue)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent-yellow)",
                boxShadow: "0 0 8px rgba(202,138,4,0.3)",
              }}
            />
            Coming Soon — Database Integration Required
          </div>
        </div>
      </div>
    </div>
  );
}
