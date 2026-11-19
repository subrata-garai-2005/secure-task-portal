import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, KeyRound, CheckCircle2, Edit3, Lock, AlertTriangle } from "lucide-react";

/**
 * SecretLeakModal
 * Displays when a user attempts to submit a task or comment with sensitive secrets (API keys, DB credentials, etc.)
 * Provides 1-click Auto-Redaction.
 */
const SecretLeakModal = ({ findings = [], onAutoRedact, onEditManually }) => {
  if (!findings || findings.length === 0) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-[#12121a] border border-amber-500/40 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative overflow-hidden"
          style={{ boxShadow: "0 0 40px rgba(245, 158, 11, 0.15)" }}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-amber-400">Credential Leak Detected</h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Smart Guard
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  Sensitive API keys or credentials were detected in your input. Submitting this plaintext exposes secrets in logs and databases.
                </p>
              </div>
            </div>

            {/* Detected Secrets List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-5">
              {findings.map((f, idx) => (
                <div
                  key={idx}
                  className="bg-[#181824] border border-gray-800 rounded-xl p-3.5 flex flex-col gap-1.5 transition-all hover:border-amber-500/30"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-amber-300">
                      <KeyRound size={13} className="text-amber-400" />
                      {f.type}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px] uppercase bg-gray-800/80 px-2 py-0.5 rounded">
                      Field: {f.field}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#0e0e15] px-2.5 py-1.5 rounded-lg border border-gray-800/80 text-xs font-mono text-gray-300">
                    <span className="truncate pr-2">{f.masked}</span>
                    <span className="flex items-center gap-1 text-[11px] text-red-400 font-sans shrink-0">
                      <Lock size={11} /> High Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-center gap-2.5 text-xs text-amber-200/90">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>
                <strong>Recommendation:</strong> Use <strong>Auto-Redact</strong> to replace live keys with safe masked placeholders before saving.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onAutoRedact}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm cursor-pointer"
              >
                <CheckCircle2 size={16} />
                Auto-Redact & Proceed
              </button>

              <button
                type="button"
                onClick={onEditManually}
                className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/80 font-medium py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer"
              >
                <Edit3 size={15} />
                Edit Manually
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecretLeakModal;
