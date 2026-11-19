const express = require("express");
const AuditLog = require("../models/AuditLog");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// GET /audit — admin only
router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 100, action, startDate, endDate } = req.query;
    const filter = {};

    if (action) filter.action = { $regex: action, $options: "i" };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// GET /audit/export — CSV export (admin only)
router.get("/export", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const headers = "Timestamp,User ID,Action,Detail,IP\n";
    const rows = logs.map((l) =>
      `"${l.createdAt?.toISOString() || ""}","${l.userId || ""}","${(l.action || "").replace(/"/g, '""')}","${(l.detail || "").replace(/"/g, '""')}","${l.ip || ""}"`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.csv");
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// GET /audit/activity — activity feed for authenticated users
router.get("/activity", authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ activities: logs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

module.exports = router;

