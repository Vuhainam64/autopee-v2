const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Firebase UID (từ token) dùng làm khóa chính logic
    uid: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    email: { type: String, index: true },
    emailVerified: { type: Boolean, default: false },
    displayName: { type: String },
    phone: { type: String },
    dateOfBirth: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    photoURL: { type: String },
    role: {
      type: String,
      default: "user",
      index: true,
      // Role được quản lý trong Role collection, không hardcode enum
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

module.exports = mongoose.model("User", UserSchema);


