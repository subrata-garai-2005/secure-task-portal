const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const payloadGuard = require("../middleware/payloadGuard");
const auditLog = require("../utils/auditLog");

const router = express.Router();

const BCRYPT_ROUNDS = 12;

// GET /users — protected, admin only
router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    // Never return passwords — select specific fields only
    const users = await User.find()
      .select("-password")
      .sort({ _id: 1 })
      .lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /users/search — admin only, search users (with payload guard)
// NOTE: This must be defined BEFORE /users/:id to avoid route conflicts
router.get("/search", authenticate, requireRole("admin"), payloadGuard, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      const users = await User.find()
        .select("-password")
        .sort({ _id: 1 })
        .lean();
      return res.json({ users });
    }

    const searchTerm = q.trim();
    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { role: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select("-password")
      .sort({ _id: 1 })
      .lean();

    auditLog(req.user.id, `SEARCH_USERS:${q}`, req.ip);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// POST /users — admin only, create a new user (with payload guard)
router.post("/", authenticate, requireRole("admin"), payloadGuard, [
  body("username")
    .trim()
    .isAlphanumeric().withMessage("Username must be alphanumeric")
    .isLength({ min: 3, max: 30 }).withMessage("Username 3–30 chars"),
  body("email")
    .normalizeEmail()
    .isEmail().withMessage("Invalid email"),
  body("password")
    .isStrongPassword({
      minLength: 8, minUppercase: 1, minLowercase: 1,
      minNumbers: 1, minSymbols: 1,
    }).withMessage("Password not strong enough"),
  body("role")
    .isIn(["admin", "editor", "viewer"]).withMessage("Role must be admin, editor, or viewer"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      username, email, password: hashed, role, status: "Active",
    });

    auditLog(req.user.id, `CREATE_USER:${username}:${role}`, req.ip);
    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, username, email, role, status: "Active" },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "User creation failed" });
  }
});

// PUT /users/:id — admin only, update a user (with payload guard)
router.put("/:id", authenticate, requireRole("admin"), payloadGuard, [
  body("username")
    .optional()
    .trim()
    .isAlphanumeric().withMessage("Username must be alphanumeric")
    .isLength({ min: 3, max: 30 }).withMessage("Username 3–30 chars"),
  body("email")
    .optional()
    .normalizeEmail()
    .isEmail().withMessage("Invalid email"),
  body("role")
    .optional()
    .isIn(["admin", "editor", "viewer"]).withMessage("Role must be admin, editor, or viewer"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.params.id;

  try {
    const existing = await User.findById(userId);
    if (!existing) return res.status(404).json({ error: "User not found" });

    const { username, email, role, status } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await User.findByIdAndUpdate(userId, updates, {
      new: true,            // return the updated document
      runValidators: true,  // apply schema validations
    }).select("-password").lean();

    auditLog(req.user.id, `UPDATE_USER:${userId}`, req.ip);
    res.json({ message: "User updated successfully", user: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
