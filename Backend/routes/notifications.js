const express = require("express");
const Notification = require("../models/Notification");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// ─── GET /notifications — user's notifications ──────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { userId: req.user.id };
    if (unreadOnly === "true") filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── PUT /notifications/:id/read — mark as read ────────────────────────────
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    ).lean();

    if (!notification) return res.status(404).json({ error: "Not found" });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// ─── PUT /notifications/read-all — mark all as read ────────────────────────
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

module.exports = router;
