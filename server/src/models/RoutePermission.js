const mongoose = require("mongoose");

const RoutePermissionSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET",
    },
    allowedRoles: {
      type: [String],
      default: ["user"],
      required: true,
      // Roles được quản lý trong Role collection, không hardcode enum
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

module.exports = mongoose.model("RoutePermission", RoutePermissionSchema);

