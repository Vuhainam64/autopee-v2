const User = require("../models/User");

/**
 * Lấy profile user từ MongoDB (db autopee).
 * Giữ behaviour gần giống Firestore version:
 *  - Nếu không có record -> trả về null, router sẽ fallback sang dữ liệu trong token.
 */
const getUserProfile = async (userId) => {
  const doc = await User.findOne({ uid: userId }).lean();
  if (!doc) return null;

  return {
    id: doc.uid,
    email: doc.email,
    emailVerified: doc.emailVerified,
    displayName: doc.displayName,
    phone: doc.phone,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    photoURL: doc.photoURL,
    role: doc.role || "user",
    disabled: doc.disabled || false,
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
};

/**
 * Tạo user profile mới trong MongoDB từ Firebase Auth data
 */
const createUserProfile = async (userId, authData) => {
  const now = new Date();

  const userData = {
    uid: userId,
    email: authData.email || null,
    emailVerified: authData.emailVerified || false,
    displayName: authData.displayName || authData.email?.split("@")[0] || "",
    phone: null,
    dateOfBirth: null,
    gender: null,
    photoURL: authData.photoURL || null,
    role: "user", // Default role for new users
    disabled: false, // Default: user is active
    createdAt: now,
    updatedAt: now,
  };

  const doc = await User.create(userData);

  return {
    id: doc.uid,
    email: doc.email,
    emailVerified: doc.emailVerified,
    displayName: doc.displayName,
    phone: doc.phone,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    photoURL: doc.photoURL,
    role: doc.role || "user",
    disabled: doc.disabled || false,
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
};

/**
 * Cập nhật profile user trong MongoDB, merge giống Firestore.
 */
const updateUserProfile = async (userId, profileData) => {
  const now = new Date();

  const update = {
    $set: {
      displayName: profileData.displayName,
      phone: profileData.phone,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      photoURL: profileData.photoURL,
      updatedAt: now,
    },
    $setOnInsert: {
      uid: userId,
      createdAt: now,
    },
  };

  const doc = await User.findOneAndUpdate({ uid: userId }, update, {
    new: true,
    upsert: true,
  }).lean();

  return {
    id: doc.uid,
    email: doc.email,
    emailVerified: doc.emailVerified,
    displayName: doc.displayName,
    phone: doc.phone,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    photoURL: doc.photoURL,
    role: doc.role || "user",
    disabled: doc.disabled || false,
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
};

module.exports = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
};


