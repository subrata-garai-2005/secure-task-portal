require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcrypt");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const auditRoutes = require("./routes/audit");
const taskRoutes = require("./routes/tasks");
const notificationRoutes = require("./routes/notifications");

// Middleware imports
const authenticate = require("./middleware/authenticate");

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware (OWASP A05 – Misconfiguration) ──────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ─── CORS (whitelist only) ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith(".vercel.app"))) cb(null, true);
    else cb(new Error("CORS policy violation"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10kb" })); // prevent large payload attacks

// ─── General Rate Limiting ───────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(generalLimiter);

// ─── Health / Root Endpoint ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🛡️ Secure Task Portal API is running successfully!",
    version: "1.0.0",
    health: "ok",
    endpoints: {
      auth: "/auth",
      users: "/users",
      tasks: "/tasks",
      notifications: "/notifications",
      audit: "/audit",
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/audit", auditRoutes);
app.use("/tasks", taskRoutes);
app.use("/notifications", notificationRoutes);

// GET /me — protected
app.get("/me", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select("username email role status createdAt").lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Never leak stack traces to clients (OWASP A05)
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ─── Start ───────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  // Seed admin user on first run
  const adminExists = await User.findOne({ username: "admin" });
  if (!adminExists) {
    const hashed = await bcrypt.hash("Admin@123", 12);
    await User.create({
      username: "admin",
      email: "admin@example.com",
      password: hashed,
      role: "admin",
      status: "Active",
    });
    console.log("✅  Admin user seeded (admin / Admin@123)");
  }

  app.listen(PORT, () => console.log(`✅  Secure server running on port ${PORT}`));
};

start();

module.exports = app;