import { FACTS } from "../data/facts";
import { getCatColor, OP_SYMBOLS } from "../utils/helpers";

export default function ConditionChip({ cond }) {
  const fact = FACTS.find((f) => f.name === cond.fact);
  const c = fact ? getCatColor(fact.cat) : { tx: "#596577", bd: "#d8dde4" };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        background: fact ? (getCatColor(fact.cat).bg || "#f1f3f6") : "#f1f3f6",
        borderRadius: 8,
        border: `1px solid ${c.bd}33`,
        borderLeft: `3px solid ${c.bd}`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: c.tx,
          fontWeight: 600,
        }}
      >
        {cond.fact}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "#b45309",
          fontWeight: 700,
        }}
      >
        {OP_SYMBOLS[cond.op] || cond.op}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "#15803d",
          fontWeight: 600,
        }}
      >
        {cond.value}
      </span>
    </div>
  );
}
