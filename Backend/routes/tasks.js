const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const payloadGuard = require("../middleware/payloadGuard");
const auditLog = require("../utils/auditLog");
const { autoRedactObject, redactText } = require("../utils/secretScanner");

const router = express.Router();

// ─── Helper: Send notification ──────────────────────────────────────────────
const notify = async (userId, type, title, message, referenceId = null, referenceType = null) => {
  try {
    await Notification.create({ userId, type, title, message, referenceId, referenceType });
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

// ─── GET /tasks — list tasks with filters ───────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, priority, assignee, search, sort } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Viewers can only see tasks assigned to them
    const userDoc = await User.findById(req.user.id).lean();
    if (userDoc?.role === "viewer") {
      filter.assignee = req.user.id;
    }

    let sortObj = { order: 1, createdAt: -1 };
    if (sort === "dueDate") sortObj = { dueDate: 1 };
    if (sort === "priority") sortObj = { priority: 1 };
    if (sort === "newest") sortObj = { createdAt: -1 };

    const tasks = await Task.find(filter)
      .populate("assignee", "username email")
      .populate("creator", "username")
      .sort(sortObj)
      .lean();

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ─── GET /tasks/stats — task statistics ─────────────────────────────────────
router.get("/stats", authenticate, async (req, res) => {
  try {
    const [total, todo, inProgress, review, done, overdue, byPriority] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "todo" }),
      Task.countDocuments({ status: "in_progress" }),
      Task.countDocuments({ status: "review" }),
      Task.countDocuments({ status: "done" }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: "done" } }),
      Task.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    // Tasks completed per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completedPerDay = await Task.aggregate([
      { $match: { status: "done", updatedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Tasks per user (top 5)
    const tasksPerUser = await Task.aggregate([
      { $match: { assignee: { $ne: null } } },
      { $group: { _id: "$assignee", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { username: "$user.username", total: 1, done: 1 } },
    ]);

    const priorityMap = {};
    byPriority.forEach((p) => { priorityMap[p._id] = p.count; });

    res.json({
      stats: {
        total,
        todo,
        inProgress,
        review,
        done,
        overdue,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        byPriority: priorityMap,
        completedPerDay,
        tasksPerUser,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── GET /tasks/:id — single task with comments ────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "username email")
      .populate("creator", "username")
      .lean();

    if (!task) return res.status(404).json({ error: "Task not found" });

    const comments = await Comment.find({ taskId: task._id })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ task, comments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// ─── POST /tasks — create task (admin, editor) ─────────────────────────────
router.post("/", authenticate, requireRole("admin", "editor"), payloadGuard, [
  body("title").trim().notEmpty().withMessage("Title is required")
    .isLength({ max: 200 }).withMessage("Title max 200 chars"),
  body("description").optional().isLength({ max: 5000 }),
  body("priority").optional().isIn(["low", "medium", "high", "critical"]),
  body("status").optional().isIn(["todo", "in_progress", "review", "done"]),
  body("dueDate").optional({ nullable: true }).isISO8601().toDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    let { title, description, priority, status, assignee, dueDate, tags, links } = req.body;

    // Smart Secret & Credential Leak Scanner (Auto-Redaction)
    const { redactedObj, totalRedacted, allFindings } = autoRedactObject({
      title: title || "",
      description: description || "",
    });

    if (totalRedacted > 0) {
      title = redactedObj.title;
      description = redactedObj.description;
      const types = [...new Set(allFindings.map((f) => f.type))].join(", ");
      auditLog(
        req.user.id,
        `SECRET_LEAK_PREVENTED:${types}`,
        req.ip,
        `Auto-redacted ${totalRedacted} credential(s) in new task`
      );
    }

    const task = await Task.create({
      title,
      description: description || "",
      priority: priority || "medium",
      status: status || "todo",
      assignee: assignee || null,
      creator: req.user.id,
      dueDate: dueDate || null,
      tags: tags || [],
      links: links || [],
    });

    auditLog(req.user.id, `CREATE_TASK:${title}`, req.ip);

    // Notify assignee
    if (assignee && assignee !== req.user.id) {
      notify(assignee, "task_assigned", "New Task Assigned", `You've been assigned: "${title}"`, task._id, "task");
    }

    const populated = await Task.findById(task._id)
      .populate("assignee", "username email")
      .populate("creator", "username")
      .lean();

    res.status(201).json({ message: "Task created", task: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Task creation failed" });
  }
});

// ─── PUT /tasks/:id — update task ───────────────────────────────────────────
router.put("/:id", authenticate, requireRole("admin", "editor"), payloadGuard, [
  body("title").optional().trim().isLength({ min: 1, max: 200 }),
  body("priority").optional().isIn(["low", "medium", "high", "critical"]),
  body("status").optional().isIn(["todo", "in_progress", "review", "done"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const { title, description, priority, status, assignee, dueDate, tags, links, order } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    // Smart Secret & Credential Leak Scanner (Auto-Redaction on update)
    if (updates.title || updates.description) {
      const { redactedObj, totalRedacted, allFindings } = autoRedactObject({
        title: updates.title || "",
        description: updates.description || "",
      });
      if (totalRedacted > 0) {
        if (updates.title) updates.title = redactedObj.title;
        if (updates.description) updates.description = redactedObj.description;
        const types = [...new Set(allFindings.map((f) => f.type))].join(", ");
        auditLog(
          req.user.id,
          `SECRET_LEAK_PREVENTED:${types}`,
          req.ip,
          `Auto-redacted ${totalRedacted} credential(s) in task update`
        );
      }
    }

    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (assignee !== undefined) updates.assignee = assignee || null;
    if (dueDate !== undefined) updates.dueDate = dueDate || null;
    if (tags !== undefined) updates.tags = tags;
    if (links !== undefined) updates.links = links;
    if (order !== undefined) updates.order = order;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    })
      .populate("assignee", "username email")
      .populate("creator", "username")
      .lean();

    auditLog(req.user.id, `UPDATE_TASK:${req.params.id}`, req.ip);

    // Notify on assignment change
    if (assignee && assignee !== String(existing.assignee) && assignee !== req.user.id) {
      notify(assignee, "task_assigned", "Task Assigned", `You've been assigned: "${updated.title}"`, updated._id, "task");
    }

    // Notify on status change to done
    if (status === "done" && existing.status !== "done" && existing.creator && String(existing.creator) !== req.user.id) {
      notify(existing.creator, "task_completed", "Task Completed", `"${updated.title}" has been marked as done`, updated._id, "task");
    }

    res.json({ message: "Task updated", task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ─── PUT /tasks/:id/status — quick status update (for kanban drag) ──────────
router.put("/:id/status", authenticate, requireRole("admin", "editor"), async (req, res) => {
  try {
    const { status, order } = req.body;
    if (!["todo", "in_progress", "review", "done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updates = { status };
    if (order !== undefined) updates.order = order;

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("assignee", "username email")
      .populate("creator", "username")
      .lean();

    if (!updated) return res.status(404).json({ error: "Task not found" });

    res.json({ task: updated });
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
});

// ─── DELETE /tasks/:id — delete task (admin only) ───────────────────────────
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Also delete related comments
    await Comment.deleteMany({ taskId: req.params.id });

    auditLog(req.user.id, `DELETE_TASK:${task.title}`, req.ip);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ─── POST /tasks/:id/comments — add comment ────────────────────────────────
router.post("/:id/comments", authenticate, payloadGuard, [
  body("content").trim().notEmpty().withMessage("Comment cannot be empty")
    .isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    let content = req.body.content;
    const { redactedText, redactedCount, findings } = redactText(content, "comment");
    if (redactedCount > 0) {
      content = redactedText;
      const types = [...new Set(findings.map((f) => f.type))].join(", ");
      auditLog(
        req.user.id,
        `SECRET_LEAK_PREVENTED:${types}`,
        req.ip,
        `Auto-redacted ${redactedCount} credential(s) in comment`
      );
    }

    const comment = await Comment.create({
      taskId: req.params.id,
      author: req.user.id,
      content,
    });

    const populated = await Comment.findById(comment._id)
      .populate("author", "username")
      .lean();

    // Notify task creator & assignee (if different from commenter)
    const targets = new Set();
    if (task.creator && String(task.creator) !== req.user.id) targets.add(String(task.creator));
    if (task.assignee && String(task.assignee) !== req.user.id) targets.add(String(task.assignee));

    for (const targetId of targets) {
      notify(targetId, "comment_added", "New Comment", `New comment on "${task.title}"`, task._id, "task");
    }

    res.status(201).json({ comment: populated });
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

module.exports = router;
