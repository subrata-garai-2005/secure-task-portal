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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.16 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Credential Leak Detected</h3>
                <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Inspection
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Potential secrets were detected in your input. Submitting plaintext credentials exposes them in persistent logs and database storage.
              </p>
            </div>
          </div>

          {/* Detected Secrets List */}
          <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 mb-5">
            {findings.map((f, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-amber-400">
                    <KeyRound size={13} />
                    {f.type}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono text-[11px] uppercase bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                    Field: {f.field}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)]">
                  <span className="truncate pr-2">{f.masked}</span>
                  <span className="flex items-center gap-1 text-[11px] text-red-400 font-sans shrink-0">
                    <Lock size={11} /> Sensitive
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Info Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <span>
              Use <strong>Auto-Redact</strong> to replace live keys with safe masked identifiers prior to submission.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onAutoRedact}
              className="flex-1 flex items-center justify-center gap-2 btn btn--primary cursor-pointer text-sm"
            >
              <CheckCircle2 size={16} />
              Auto-Redact & Proceed
            </button>

            <button
              type="button"
              onClick={onEditManually}
              className="btn btn--secondary flex items-center justify-center gap-2 text-sm"
            >
              <Edit3 size={15} />
              Edit Manually
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecretLeakModal;
