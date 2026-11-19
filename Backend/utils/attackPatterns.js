// ─── Payload Detection Engine (SQL Injection / XSS) ──────────────────────────
const ATTACK_PATTERNS = [
  // AUTH BYPASS
  { pattern: /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /OR\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?\s*--/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /OR\s+\d+-\d+--/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /'\s*OR\s+/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /"\s*OR\s+/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /OR\s+["']1["']\s*=\s*["']1/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /1\s*=\s*1/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /LIMIT\s+\d/i, type: "SQL Injection — Auth Bypass" },
  { pattern: /'\s*or\s+\d+-\d+--/i, type: "SQL Injection — Auth Bypass" },

  // UNION ATTACKS
  { pattern: /UNION\s+(ALL\s+)?SELECT/i, type: "SQL Injection — UNION Attack" },
  { pattern: /@@version/i, type: "SQL Injection — UNION Data Extraction" },
  { pattern: /database\s*\(\s*\)/i, type: "SQL Injection — UNION Data Extraction" },
  { pattern: /user\s*\(\s*\)/i, type: "SQL Injection — UNION Data Extraction" },

  // COMMENT INJECTION
  { pattern: /\/\*.*\*\//i, type: "SQL Injection — Comment Bypass" },
  { pattern: /--\s*$/m, type: "SQL Injection — Comment Injection" },
  { pattern: /%00/i, type: "SQL Injection — Null Byte Injection" },

  // DATA EXTRACTION
  { pattern: /AND\s+\d+-\d+--/i, type: "SQL Injection — Data Extraction" },
  { pattern: /SELECT\s+count\s*\(\s*\*\s*\)/i, type: "SQL Injection — Data Extraction" },
  { pattern: /Length\s*\(\s*database\s*\(\s*\)\s*\)/i, type: "SQL Injection — Data Extraction" },
  { pattern: /substring\s*\(/i, type: "SQL Injection — Data Extraction" },
  { pattern: /ord\s*\(\s*substring/i, type: "SQL Injection — Data Extraction" },

  // TIME-BASED
  { pattern: /SLEEP\s*\(/i, type: "SQL Injection — Time-Based Blind" },
  { pattern: /BENCHMARK\s*\(/i, type: "SQL Injection — Time-Based Blind" },
  { pattern: /pg_sleep\s*\(/i, type: "SQL Injection — Time-Based Blind" },
  { pattern: /WAITFOR\s+DELAY/i, type: "SQL Injection — Time-Based Blind" },

  // XSS
  { pattern: /<\s*script/i, type: "XSS — Script Injection" },
  { pattern: /on(error|load|click|mouseover)\s*=/i, type: "XSS — Event Handler Injection" },
  { pattern: /javascript\s*:/i, type: "XSS — Protocol Injection" },
  { pattern: /eval\s*\(/i, type: "XSS — Eval Injection" },
  { pattern: /<\s*img[^>]+onerror/i, type: "XSS — IMG Tag Injection" },
  { pattern: /<\s*iframe/i, type: "XSS — IFrame Injection" },
  { pattern: /<\s*svg[^>]+onload/i, type: "XSS — SVG Injection" },

  // GENERAL INJECTION
  { pattern: /;\s*DROP\s+TABLE/i, type: "SQL Injection — DROP TABLE" },
  { pattern: /;\s*DELETE\s+FROM/i, type: "SQL Injection — DELETE" },
  { pattern: /;\s*INSERT\s+INTO/i, type: "SQL Injection — INSERT" },
  { pattern: /;\s*UPDATE\s+.*SET/i, type: "SQL Injection — UPDATE" },
  { pattern: /EXEC\s*\(/i, type: "SQL Injection — Stored Procedure" },
  { pattern: /xp_cmdshell/i, type: "SQL Injection — Command Execution" },
];

module.exports = ATTACK_PATTERNS;
