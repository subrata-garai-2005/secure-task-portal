// ─── Payload Detection Engine ────────────────────────────────────────────────
const ATTACK_PATTERNS = [
  { p: /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, t: "SQL Injection — Auth Bypass" },
  { p: /OR\s+\d+-\d+--/i, t: "SQL Injection — Auth Bypass" },
  { p: /'\s*OR\s+/i, t: "SQL Injection — Auth Bypass" },
  { p: /"\s*OR\s+/i, t: "SQL Injection — Auth Bypass" },
  { p: /1\s*=\s*1/i, t: "SQL Injection — Auth Bypass" },
  { p: /LIMIT\s+\d/i, t: "SQL Injection — Auth Bypass" },
  { p: /UNION\s+(ALL\s+)?SELECT/i, t: "SQL Injection — UNION Attack" },
  { p: /@@version/i, t: "SQL Injection — Data Extraction" },
  { p: /database\s*\(\s*\)/i, t: "SQL Injection — Data Extraction" },
  { p: /user\s*\(\s*\)/i, t: "SQL Injection — Data Extraction" },
  { p: /\/\*.*\*\//i, t: "SQL Injection — Comment Bypass" },
  { p: /--\s*$/m, t: "SQL Injection — Comment Injection" },
  { p: /%00/i, t: "Null Byte Injection" },
  { p: /AND\s+\d+-\d+--/i, t: "SQL Injection — Data Extraction" },
  { p: /SELECT\s+count\s*\(\s*\*\s*\)/i, t: "SQL Injection — Data Extraction" },
  { p: /substring\s*\(/i, t: "SQL Injection — Data Extraction" },
  { p: /ord\s*\(\s*substring/i, t: "SQL Injection — Data Extraction" },
  { p: /SLEEP\s*\(/i, t: "SQL Injection — Time-Based" },
  { p: /BENCHMARK\s*\(/i, t: "SQL Injection — Time-Based" },
  { p: /pg_sleep\s*\(/i, t: "SQL Injection — Time-Based" },
  { p: /WAITFOR\s+DELAY/i, t: "SQL Injection — Time-Based" },
  { p: /<\s*script/i, t: "XSS — Script Injection" },
  { p: /on(error|load|click|mouseover)\s*=/i, t: "XSS — Event Handler" },
  { p: /javascript\s*:/i, t: "XSS — Protocol Injection" },
  { p: /eval\s*\(/i, t: "XSS — Eval Injection" },
  { p: /<\s*iframe/i, t: "XSS — IFrame Injection" },
  { p: /;\s*DROP\s+TABLE/i, t: "SQL Injection — DROP TABLE" },
  { p: /;\s*DELETE\s+FROM/i, t: "SQL Injection — DELETE" },
  { p: /xp_cmdshell/i, t: "SQL Injection — Command Exec" },
];

export const detectPayload = (value) => {
  if (typeof value !== "string" || value.length < 2) return null;
  for (const { p, t } of ATTACK_PATTERNS) {
    if (p.test(value)) return t;
  }
  return null;
};

export const scanInputs = (fields) => {
  for (const val of Object.values(fields)) {
    const result = detectPayload(String(val));
    if (result) return result;
  }
  return null;
};
