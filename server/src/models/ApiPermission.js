const mongoose = require("mongoose");

const ApiPermissionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET",
      index: true,
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

// Composite unique index trên endpoint + method
// Cho phép cùng endpoint với method khác nhau
ApiPermissionSchema.index({ endpoint: 1, method: 1 }, { unique: true });

module.exports = mongoose.model("ApiPermission", ApiPermissionSchema);

