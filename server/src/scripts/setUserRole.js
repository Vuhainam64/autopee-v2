/**
 * Script helper để set role cho user trong MongoDB
 * 
 * Usage:
 * node src/scripts/setUserRole.js <uid> <role>
 * 
 * Example:
 * node src/scripts/setUserRole.js 2nuzKcAsdGVjkA9W3tMVfRtkT3M2 admin
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/autopee";

async function setUserRole(uid, role) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    if (!["user", "admin", "super_admin"].includes(role)) {
      console.error(`Invalid role: ${role}. Must be one of: user, admin, super_admin`);
      process.exit(1);
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { role } },
      { new: true, upsert: false }
    );

    if (!user) {
      console.error(`User with uid ${uid} not found. Please ensure user exists in database.`);
      console.log("Tip: User will be auto-created when they call /user/me endpoint.");
      process.exit(1);
    }

    console.log(`Successfully set role "${role}" for user ${uid}`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName || "N/A"}`);
    console.log(`Role: ${user.role}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node src/scripts/setUserRole.js <uid> <role>");
  console.log("Example: node src/scripts/setUserRole.js 2nuzKcAsdGVjkA9W3tMVfRtkT3M2 admin");
  process.exit(1);
}

const [uid, role] = args;
setUserRole(uid, role);

