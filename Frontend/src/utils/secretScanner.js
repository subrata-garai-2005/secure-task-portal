// ─── Frontend Smart Secret & Credential Leak Scanner ─────────────────────────
// Detects accidental exposure of API keys, tokens, DB connection strings, and private keys

export const SECRET_PATTERNS = [
  {
    id: "openai_key",
    type: "OpenAI / LLM API Key",
    pattern: /sk-(?:proj-|svcacct-|none-)?[A-Za-z0-9_-]{24,}/g,
    severity: "critical",
  },
  {
    id: "gemini_google_key",
    type: "Google / Gemini API Key",
    pattern: /AIzaSy[A-Za-z0-9_-]{33}/g,
    severity: "critical",
  },
  {
    id: "aws_access_key",
    type: "AWS Access Key ID",
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: "critical",
  },
  {
    id: "aws_secret_key",
    type: "AWS Secret Access Key",
    pattern: /(?:aws_secret_access_key|aws_secret|secret_key)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
    severity: "critical",
  },
  {
    id: "db_uri",
    type: "Database URI with Credentials",
    pattern: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s:@]+:[^\s:@]+@[^\s/]+/gi,
    severity: "critical",
  },
  {
    id: "github_pat",
    type: "GitHub Personal Access Token",
    pattern: /(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|gho_[A-Za-z0-9]{36})/g,
    severity: "critical",
  },
  {
    id: "stripe_key",
    type: "Stripe Live Secret Key",
    pattern: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/g,
    severity: "critical",
  },
  {
    id: "webhook_url",
    type: "Webhook URL (Slack / Discord)",
    pattern: /https:\/\/(?:hooks\.slack\.com\/services\/[A-Za-z0-9_\/]+|discord(?:app)?\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+)/gi,
    severity: "high",
  },
  {
    id: "private_key",
    type: "Private RSA/SSH Key",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi,
    severity: "critical",
  },
  {
    id: "jwt_token",
    type: "JWT Authentication Token",
    pattern: /eyJ[A-Za-z0-9-_]{15,}\.[A-Za-z0-9-_]{15,}\.[A-Za-z0-9-_]{15,}/g,
    severity: "high",
  },
  {
    id: "hardcoded_password",
    type: "Hardcoded Password / Auth Token",
    pattern: /(?:password|client_secret|auth_token)\s*[:=]\s*["']([^"'\s]{8,})["']/gi,
    severity: "high",
  },
];

export const maskSecret = (secret, typeId) => {
  if (typeId === "db_uri") {
    return secret.replace(/(:\/\/[^:]+:)([^@]+)(@)/, "$1••••••••$3");
  }
  if (secret.startsWith("-----BEGIN")) {
    return "-----BEGIN PRIVATE KEY----- [•••••• REDACTED ••••••] -----END PRIVATE KEY-----";
  }
  if (secret.length <= 8) {
    return "••••••••";
  }
  const start = secret.slice(0, 4);
  const end = secret.slice(-3);
  return `${start}••••••••${end}`;
};

export const scanTextForSecrets = (text, fieldName = "text") => {
  if (!text || typeof text !== "string" || text.length < 8) return [];

  const findings = [];

  for (const item of SECRET_PATTERNS) {
    const regex = new RegExp(item.pattern.source, item.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      findings.push({
        id: item.id,
        type: item.type,
        severity: item.severity,
        field: fieldName,
        secret: fullMatch,
        masked: maskSecret(fullMatch, item.id),
        index: match.index,
        length: fullMatch.length,
      });
    }
  }

  return findings;
};

export const scanObjectForSecrets = (obj) => {
  if (!obj || typeof obj !== "object") return { hasSecrets: false, findings: [], total: 0 };

  const findings = [];
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const fieldFindings = scanTextForSecrets(val, key);
      findings.push(...fieldFindings);
    }
  }

  return {
    hasSecrets: findings.length > 0,
    findings,
    total: findings.length,
  };
};

export const redactText = (text, fieldName = "text") => {
  if (!text || typeof text !== "string") {
    return { redactedText: text, redactedCount: 0, findings: [] };
  }

  const findings = scanTextForSecrets(text, fieldName);
  if (findings.length === 0) {
    return { redactedText: text, redactedCount: 0, findings: [] };
  }

  let redactedText = text;
  const sorted = [...findings].sort((a, b) => b.secret.length - a.secret.length);
  const seen = new Set();

  for (const item of sorted) {
    if (seen.has(item.secret)) continue;
    seen.add(item.secret);

    const replacement = `[REDACTED_${item.id.toUpperCase()}: ${item.masked}]`;
    redactedText = redactedText.split(item.secret).join(replacement);
  }

  return {
    redactedText,
    redactedCount: findings.length,
    findings,
  };
};

export const autoRedactObject = (obj) => {
  if (!obj || typeof obj !== "object") return { redactedObj: obj, totalRedacted: 0, allFindings: [] };

  const redactedObj = Array.isArray(obj) ? [...obj] : { ...obj };
  let totalRedacted = 0;
  const allFindings = [];

  for (const [key, val] of Object.entries(redactedObj)) {
    if (typeof val === "string") {
      const res = redactText(val, key);
      if (res.redactedCount > 0) {
        redactedObj[key] = res.redactedText;
        totalRedacted += res.redactedCount;
        allFindings.push(...res.findings);
      }
    }
  }

  return { redactedObj, totalRedacted, allFindings };
};
