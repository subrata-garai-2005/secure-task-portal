const jwt = require("jsonwebtoken");

// ─── JWT Middleware ───────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
