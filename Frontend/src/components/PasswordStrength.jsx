import { validatePassword } from "../utils/validatePassword";

const PasswordStrength = ({ password }) => {
  const checks = validatePassword(password);
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["length ≥ 8", "uppercase", "lowercase", "number", "special char"];
  const keys = ["length", "upper", "lower", "number", "special"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score - 1] : "bg-gray-700"
              }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {keys.map((k, i) => (
          <div key={k} className={`text-xs flex items-center gap-1 ${checks[k] ? "text-green-400" : "text-gray-500"}`}>
            <span>{checks[k] ? "✓" : "○"}</span> {labels[i]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
