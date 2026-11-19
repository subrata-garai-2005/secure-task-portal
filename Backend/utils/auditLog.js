const AuditLog = require("../models/AuditLog");

/**
 * Logs an action to the audit_log collection.
 * @param {string|null} userId  - The user's MongoDB ObjectId (or null)
 * @param {string}      action  - Action identifier (e.g. "LOGIN_SUCCESS")
 * @param {string}      ip      - Client IP address
 * @param {string|null} detail  - Optional detail string
 */
const auditLog = async (userId, action, ip, detail = null) => {
  try {
    await AuditLog.create({ userId, action, detail, ip });
  } catch (err) {
    // Audit logging should never crash the request
    console.error("Audit log write failed:", err.message);
  }
};

module.exports = auditLog;
