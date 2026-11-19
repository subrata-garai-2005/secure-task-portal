const ATTACK_PATTERNS = require("../utils/attackPatterns");
const auditLog = require("../utils/auditLog");

/**
 * Scans a single value for attack patterns.
 * Returns { detected: true, type: "..." } or { detected: false }
 */
const detectPayload = (value) => {
  if (typeof value !== "string") return { detected: false };
  for (const { pattern, type } of ATTACK_PATTERNS) {
    if (pattern.test(value)) {
      return { detected: true, type, payload: value };
    }
  }
  return { detected: false };
};

/**
 * Recursively scans all values in an object.
 */
const scanObject = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const result = detectPayload(val);
      if (result.detected) return { ...result, field: key };
    } else if (typeof val === "object") {
      const result = scanObject(val);
      if (result) return result;
    }
  }
  return null;
};

// ─── Payload Guard Middleware ─────────────────────────────────────────────────
const payloadGuard = (req, res, next) => {
  // Scan body
  const bodyResult = scanObject(req.body);
  if (bodyResult) {
    auditLog(null, `ATTACK_BLOCKED:${bodyResult.type}`, req.ip, bodyResult.payload);
    return res.status(400).json({
      error: "⚠ Security Alert: Potential injection attack detected!",
      attackType: bodyResult.type,
      field: bodyResult.field,
      blocked: true,
      message: "This incident has been logged and reported.",
    });
  }

  // Scan query params
  const queryResult = scanObject(req.query);
  if (queryResult) {
    auditLog(null, `ATTACK_BLOCKED:${queryResult.type}`, req.ip, queryResult.payload);
    return res.status(400).json({
      error: "⚠ Security Alert: Potential injection attack detected!",
      attackType: queryResult.type,
      field: queryResult.field,
      blocked: true,
      message: "This incident has been logged and reported.",
    });
  }

  // Scan URL params
  const paramResult = scanObject(req.params);
  if (paramResult) {
    auditLog(null, `ATTACK_BLOCKED:${paramResult.type}`, req.ip, paramResult.payload);
    return res.status(400).json({
      error: "⚠ Security Alert: Potential injection attack detected!",
      attackType: paramResult.type,
      field: paramResult.field,
      blocked: true,
      message: "This incident has been logged and reported.",
    });
  }

  next();
};

module.exports = payloadGuard;
