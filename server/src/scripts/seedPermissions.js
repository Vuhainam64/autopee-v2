/**
 * Script để seed routes và APIs permissions vào MongoDB
 * 
 * Usage:
 * node src/scripts/seedPermissions.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const RoutePermission = require("../models/RoutePermission");
const ApiPermission = require("../models/ApiPermission");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/autopee";

// Route permissions - dựa trên routes trong client
const routePermissions = [
  {
    path: "/",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Trang chủ - Orders Landing",
  },
  {
    path: "/dashboard",
    method: "GET",
    allowedRoles: ["admin", "super_admin"],
    description: "Dashboard tổng quan",
  },
  {
    path: "/dashboard/permissions",
    method: "GET",
    allowedRoles: ["super_admin"],
    description: "Quản lý phân quyền routes và APIs",
  },
  {
    path: "/dashboard/users",
    method: "GET",
    allowedRoles: ["admin", "super_admin"],
    description: "Quản lý người dùng",
  },
  {
    path: "/products",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Trang sản phẩm",
  },
  {
    path: "/products/checkMVDCookie",
    method: "GET",
    allowedRoles: ["admin", "super_admin"],
    description: "Check MVD Cookie",
  },
  {
    path: "/products/checkMVD",
    method: "GET",
    allowedRoles: ["admin", "super_admin"],
    description: "Check Mã vận đơn",
  },
  {
    path: "/settings/profile",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Cài đặt profile",
  },
  {
    path: "/settings/wallet",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Cài đặt ví",
  },
  {
    path: "/settings/security",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Cài đặt bảo mật",
  },
];

// API permissions - dựa trên API endpoints trong server
const apiPermissions = [
  // Auth APIs
  {
    endpoint: "/auth/health",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Health check cho auth service",
  },
  {
    endpoint: "/auth/me",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Lấy thông tin user hiện tại",
  },
  {
    endpoint: "/auth/logout",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Đăng xuất",
  },
  // User APIs
  {
    endpoint: "/user/me",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Lấy profile user",
  },
  {
    endpoint: "/user/me",
    method: "PUT",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Cập nhật profile user",
  },
  {
    endpoint: "/user/sessions",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Lấy danh sách sessions",
  },
  {
    endpoint: "/user/sessions/revoke",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Revoke một session",
  },
  {
    endpoint: "/user/sessions/revoke-others",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Revoke tất cả sessions khác",
  },
  {
    endpoint: "/user/sessions/track",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Track session",
  },
  // Shopee APIs
  {
    endpoint: "/shopee/orders",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Lấy danh sách đơn hàng Shopee",
  },
  {
    endpoint: "/shopee/order-detail",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Lấy chi tiết đơn hàng Shopee",
  },
  {
    endpoint: "/shopee/qr",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Generate QR code",
  },
  {
    endpoint: "/shopee/qr/status",
    method: "GET",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Check QR status",
  },
  {
    endpoint: "/shopee/qr/login",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Login bằng QR",
  },
  // Track Session (backward compatible)
  {
    endpoint: "/trackSession",
    method: "POST",
    allowedRoles: ["user", "admin", "super_admin"],
    description: "Track session (backward compatible endpoint)",
  },
  // Admin APIs (chỉ super_admin)
  {
    endpoint: "/admin/routes",
    method: "GET",
    allowedRoles: ["super_admin"],
    description: "Lấy danh sách route permissions",
  },
  {
    endpoint: "/admin/routes",
    method: "POST",
    allowedRoles: ["super_admin"],
    description: "Tạo route permission mới",
  },
  {
    endpoint: "/admin/routes/:id",
    method: "PUT",
    allowedRoles: ["super_admin"],
    description: "Cập nhật route permission",
  },
  {
    endpoint: "/admin/routes/:id",
    method: "DELETE",
    allowedRoles: ["super_admin"],
    description: "Xóa route permission",
  },
  {
    endpoint: "/admin/apis",
    method: "GET",
    allowedRoles: ["super_admin"],
    description: "Lấy danh sách API permissions",
  },
  {
    endpoint: "/admin/apis",
    method: "POST",
    allowedRoles: ["super_admin"],
    description: "Tạo API permission mới",
  },
  {
    endpoint: "/admin/apis/:id",
    method: "PUT",
    allowedRoles: ["super_admin"],
    description: "Cập nhật API permission",
  },
  {
    endpoint: "/admin/apis/:id",
    method: "DELETE",
    allowedRoles: ["super_admin"],
    description: "Xóa API permission",
  },
];

async function seedPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing permissions (optional - comment out if you want to keep existing)
    // await RoutePermission.deleteMany({});
    // await ApiPermission.deleteMany({});
    // console.log("🗑️  Cleared existing permissions");

    // Seed Route Permissions
    console.log("\n📋 Seeding Route Permissions...");
    let routeCount = 0;
    for (const route of routePermissions) {
      const existing = await RoutePermission.findOne({ path: route.path, method: route.method });
      if (existing) {
        await RoutePermission.findByIdAndUpdate(existing._id, route);
        console.log(`  ✓ Updated: ${route.method} ${route.path}`);
      } else {
        await RoutePermission.create(route);
        console.log(`  ✓ Created: ${route.method} ${route.path}`);
        routeCount++;
      }
    }
    console.log(`✅ Route Permissions: ${routeCount} new, ${routePermissions.length - routeCount} updated`);

    // Seed API Permissions
    console.log("\n🔌 Seeding API Permissions...");
    let apiCount = 0;
    for (const api of apiPermissions) {
      const existing = await ApiPermission.findOne({ endpoint: api.endpoint, method: api.method });
      if (existing) {
        await ApiPermission.findByIdAndUpdate(existing._id, api);
        console.log(`  ✓ Updated: ${api.method} ${api.endpoint}`);
      } else {
        await ApiPermission.create(api);
        console.log(`  ✓ Created: ${api.method} ${api.endpoint}`);
        apiCount++;
      }
    }
    console.log(`✅ API Permissions: ${apiCount} new, ${apiPermissions.length - apiCount} updated`);

    // Summary
    const totalRoutes = await RoutePermission.countDocuments();
    const totalApis = await ApiPermission.countDocuments();
    console.log("\n📊 Summary:");
    console.log(`   Routes: ${totalRoutes}`);
    console.log(`   APIs: ${totalApis}`);
    console.log("\n✅ Seeding completed successfully!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPermissions();

