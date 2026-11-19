const SecurityWarningModal = ({ attackType, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
    <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-4">
            <span className="text-5xl">🚨</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400">SECURITY ALERT</h2>
          <p className="text-red-300/70 text-sm mt-1">Malicious Payload Detected</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <div className="text-xs text-red-300/60 uppercase tracking-wider mb-1">Attack Type Identified</div>
          <div className="text-red-400 font-semibold text-lg">{attackType}</div>
        </div>
        <div className="space-y-2 mb-6">
          {["Your input contained a known attack pattern", "This attempt has been logged & reported", "Your IP address has been recorded", "Repeated attempts may result in a ban"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-sm text-gray-400">
              <span className="text-red-400">⚠</span> {t}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-3 rounded-xl transition-all text-sm">
          I Understand — Dismiss Warning
        </button>
      </div>
    </div>
  </div>
);

export default SecurityWarningModal;
