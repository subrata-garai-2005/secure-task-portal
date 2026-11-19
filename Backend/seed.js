require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("./config/db");
const User = require("./models/User");

const BCRYPT_ROUNDS = 12;

const seedAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ username: "admin" });
    if (existing) {
      console.log("ℹ  Admin user already exists, skipping seed.");
      process.exit(0);
    }

    const hashed = await bcrypt.hash("Admin@123", BCRYPT_ROUNDS);
    await User.create({
      username: "admin",
      email: "admin@example.com",
      password: hashed,
      role: "admin",
      status: "Active",
    });

    console.log("✅  Admin user seeded successfully (admin / Admin@123)");
    process.exit(0);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

seedAdmin();
