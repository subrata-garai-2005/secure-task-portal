import { validatePassword } from "../utils/validatePassword";

const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981"];

const PasswordStrength = ({ password }) => {
  const checks = validatePassword(password);
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["8+ chars", "uppercase", "lowercase", "number", "special char"];
  const keys = ["length", "upper", "lower", "number", "special"];

  return (
    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: "4px",
              flex: 1,
              borderRadius: "9999px",
              backgroundColor: i <= score ? STRENGTH_COLORS[score - 1] : "rgba(255, 255, 255, 0.1)",
              transition: "background-color 0.25s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {keys.map((k, i) => {
          const met = checks[k];
          return (
            <div
              key={k}
              style={{
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: met ? "#34d399" : "var(--text-muted, #64748b)",
                fontFamily: "monospace",
              }}
            >
              <span>{met ? "✓" : "○"}</span> {labels[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
