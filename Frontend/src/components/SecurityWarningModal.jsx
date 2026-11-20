import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertCircle, X, ShieldX, Check } from "lucide-react";

const SecurityWarningModal = ({ attackType, onClose }) => {
  if (!attackType) return null;

  return (
    <AnimatePresence>
      <div className="sec-modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="sec-modal-card"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="sec-modal-close"
            aria-label="Close Alert"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="sec-modal-header">
            <div className="sec-modal-icon-wrap">
              <ShieldAlert size={30} />
            </div>
            <h2 className="sec-modal-title">Security Alert Triggered</h2>
            <p className="sec-modal-subtitle">
              A potentially malicious payload pattern was intercepted before submission.
            </p>
          </div>

          {/* Threat Card */}
          <div className="sec-modal-threat-box">
            <div className="sec-modal-threat-header">
              <span className="sec-modal-threat-label">Identified Signature</span>
              <span className="sec-modal-threat-tag">BLOCKED</span>
            </div>
            <div className="sec-modal-threat-val">
              <ShieldX size={18} className="text-red-400 shrink-0" />
              <span>{attackType}</span>
            </div>
          </div>

          {/* Incident Audit Details */}
          <div className="sec-modal-list">
            {[
              "Input matched a known SQL injection or XSS attack pattern.",
              "Request was terminated at the client boundary before transmission.",
              "Incident event and context have been logged to the audit trail.",
            ].map((text, idx) => (
              <div key={idx} className="sec-modal-item">
                <AlertCircle size={15} className="sec-modal-item-icon" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onClose}
            className="sec-modal-btn"
          >
            <Check size={16} />
            Acknowledge & Dismiss
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecurityWarningModal;
