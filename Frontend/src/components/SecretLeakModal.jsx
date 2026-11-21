import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, KeyRound, CheckCircle2, Edit3, Lock, AlertTriangle, ShieldX, X, Sparkles } from "lucide-react";

/**
 * SecretLeakModal (Security Alert Popup)
 * Triggered whenever a user attempts to submit a task or comment containing API keys,
 * JWT tokens, passwords, or secret credentials.
 */
const SecretLeakModal = ({ findings = [], onAutoRedact, onEditManually }) => {
  if (!findings || findings.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="sec-modal-overlay" style={{ zIndex: 9999 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="sec-modal-card max-w-lg"
        >
          {/* Top Close Button */}
          <button
            onClick={onEditManually}
            className="sec-modal-close"
            aria-label="Close Alert"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="sec-modal-header">
            <div className="sec-modal-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.4)", color: "#fbbf24" }}>
              <ShieldAlert size={30} />
            </div>
            <h2 className="sec-modal-title" style={{ color: "#fef08a" }}>Security Alert Triggered</h2>
            <p className="sec-modal-subtitle">
              Plaintext credential exposure was intercepted by the In-App Security Guard.
            </p>
          </div>

          {/* Threat Box */}
          <div className="sec-modal-threat-box" style={{ background: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <div className="sec-modal-threat-header">
              <span className="sec-modal-threat-label" style={{ color: "#fbbf24" }}>Identified Threat Signature</span>
              <span className="sec-modal-threat-tag" style={{ background: "rgba(245, 158, 11, 0.25)", color: "#fef08a", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                BLOCKED
              </span>
            </div>
            <div className="sec-modal-threat-val">
              <ShieldX size={18} className="text-amber-400 shrink-0" />
              <span>Credential Exposure: {[...new Set(findings.map((f) => f.type))].join(", ")}</span>
            </div>
          </div>

          {/* Detected Secrets Cards */}
          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
            {findings.map((f, idx) => (
              <div
                key={idx}
                className="bg-[#141926] border border-amber-500/25 rounded-xl p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <KeyRound size={13} />
                    {f.type}
                  </span>
                  <span className="text-amber-400 font-mono text-[10px] uppercase bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded font-bold">
                    Field: {f.field}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs font-mono text-gray-300">
                  <span className="truncate pr-2 font-semibold">{f.masked}</span>
                  <span className="flex items-center gap-1 text-[11px] text-red-400 font-sans font-bold shrink-0">
                    <Lock size={11} /> Sensitive
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Incident Audit Details */}
          <div className="sec-modal-list">
            <div className="sec-modal-item">
              <AlertTriangle size={15} className="sec-modal-item-icon text-amber-400" />
              <span>Input contained live JWT tokens, API keys, or confidential credentials.</span>
            </div>
            <div className="sec-modal-item">
              <AlertTriangle size={15} className="sec-modal-item-icon text-amber-400" />
              <span>Plaintext submission was blocked to prevent persistent storage &amp; leakage.</span>
            </div>
            <div className="sec-modal-item">
              <AlertTriangle size={15} className="sec-modal-item-icon text-amber-400" />
              <span>Click Auto-Redact to sanitize the secret into a safe masked token identifier.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onAutoRedact}
              className="flex-1 flex items-center justify-center gap-2 btn btn--primary bg-amber-600 hover:bg-amber-500 border-amber-600 text-white font-bold py-2.5 text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Sparkles size={14} />
              Auto-Redact &amp; Save Safely
            </button>

            <button
              type="button"
              onClick={onEditManually}
              className="btn btn--secondary flex items-center justify-center gap-2 py-2.5 text-xs font-bold"
            >
              <Edit3 size={14} />
              Cancel &amp; Edit Manually
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecretLeakModal;
