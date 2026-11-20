const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auditLog = require("../utils/auditLog");
const payloadGuard = require("../middleware/payloadGuard");

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = "1h";

// ─── Rate Limiting (OWASP A07 – Auth Failures) ───────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,               // 30 requests per minute
  message: { error: "Too many requests. Please try again in 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /auth/register — with payload guard
router.post("/register", authLimiter, payloadGuard, [
  body("username")
    .trim()
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage("Username can only contain letters, numbers, underscores, and hyphens")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3–30 characters"),
  body("email")
    .trim()
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isStrongPassword({
      minLength: 8, minUppercase: 1, minLowercase: 1,
      minNumbers: 1, minSymbols: 1,
    }).withMessage("Password must have at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 symbol"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });
    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: "Username is already taken" });
      }
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "viewer",
      status: "Active",
    });

    auditLog(null, `REGISTER:${username}`, req.ip);
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ error: messages });
    }
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// POST /auth/login — with payload guard
router.post("/login", authLimiter, payloadGuard, [
  body("username").trim().notEmpty(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input" });

  const { username, password } = req.body;
  const loginIdentifier = username.trim();
  const user = await User.findOne({
    $or: [
      { username: loginIdentifier },
      { email: loginIdentifier.toLowerCase() },
    ],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    auditLog(user?._id || null, `FAILED_LOGIN:${loginIdentifier}`, req.ip);
    // Consistent response time prevents timing attacks
    await bcrypt.hash("dummy", BCRYPT_ROUNDS); // dummy work
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.username, role: user.role, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" }
  );

  auditLog(user._id, "LOGIN_SUCCESS", req.ip);
  res.json({
    token,
    role: user.role,
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

// POST /auth/change-password — change password (authenticated)
const authenticate = require("../middleware/authenticate");
router.post("/change-password", authenticate, payloadGuard, [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword")
    .isStrongPassword({
      minLength: 8, minUppercase: 1, minLowercase: 1,
      minNumbers: 1, minSymbols: 1,
    }).withMessage("New password not strong enough"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!valid) {
      auditLog(req.user.id, "FAILED_PASSWORD_CHANGE", req.ip);
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
    await user.save();

    auditLog(req.user.id, "PASSWORD_CHANGED", req.ip);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
});

// GET /auth/oauth/google — OAuth 2.0 redirect (stub)
router.get("/oauth/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL}/auth/oauth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: Math.random().toString(36).slice(2), // CSRF token
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

module.exports = router;
