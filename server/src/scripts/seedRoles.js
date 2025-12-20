/**
 * Script để seed roles vào MongoDB
 * 
 * Usage:
 * node src/scripts/seedRoles.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../models/Role");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/autopee";

// Default roles với điểm số để sắp xếp
const defaultRoles = [
  {
    name: "guest",
    displayName: "Khách",
    score: 1,
    description: "Người dùng chưa đăng nhập",
    color: "cyan",
  },
  {
    name: "user",
    displayName: "Người dùng",
    score: 2,
    description: "Người dùng đã đăng ký",
    color: "default",
  },
  {
    name: "admin",
    displayName: "Quản trị viên",
    score: 3,
    description: "Quản trị viên hệ thống",
    color: "orange",
  },
  {
    name: "super_admin",
    displayName: "Siêu quản trị",
    score: 4,
    description: "Quản trị viên cấp cao nhất",
    color: "red",
  },
];

async function seedRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Upsert roles
    for (const roleData of defaultRoles) {
      const role = await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted role: ${role.name} (${role.displayName}) - Score: ${role.score}`);
    }

    console.log("\n✅ Seed roles completed successfully!");
    
    // Show all roles
    const allRoles = await Role.find().sort({ score: 1 }).lean();
    console.log("\n📋 Current roles in database:");
    allRoles.forEach((role) => {
      console.log(`  - ${role.name} (${role.displayName}): Score ${role.score}, Color: ${role.color}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
}

seedRoles();

