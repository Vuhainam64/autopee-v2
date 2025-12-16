/**
 * Callable Functions for User operations
 */

const {authenticateCallable, handleCallableErrors} = require("../../middleware");
const {getUserProfile, updateUserProfile} = require("../../services/userService");

/**
 * Get user profile (Callable)
 */
exports.getUserProfile = handleCallableErrors(async (data, context) => {
  const user = await authenticateCallable(data, context);
  let profile = await getUserProfile(user.uid);

  if (!profile) {
    profile = {
      id: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.email?.split("@")[0] || "",
    };
  }

  return {
    success: true,
    data: profile,
  };
});

/**
 * Update user profile (Callable)
 */
exports.updateUserProfile = handleCallableErrors(async (data, context) => {
  const user = await authenticateCallable(data, context);

  const validatedData = {};

  if (data.displayName !== undefined) {
    if (data.displayName !== null && data.displayName !== "" &&
        typeof data.displayName !== "string") {
      throw new Error("displayName must be a string");
    }
    if (data.displayName && data.displayName.trim() !== "") {
      if (data.displayName.length < 1 || data.displayName.length > 100) {
        throw new Error("displayName must be between 1 and 100 characters");
      }
      validatedData.displayName = data.displayName.trim();
    } else {
      validatedData.displayName = data.displayName || null;
    }
  }

  if (data.phone !== undefined) {
    if (data.phone !== null && data.phone !== "" && typeof data.phone !== "string") {
      throw new Error("phone must be a string");
    }
    if (data.phone && data.phone.trim() !== "" && !/^[0-9]{10,11}$/.test(data.phone.trim())) {
      throw new Error("phone must be 10-11 digits");
    }
    validatedData.phone = data.phone && data.phone.trim() !== "" ? data.phone.trim() : null;
  }

  if (data.dateOfBirth !== undefined) {
    if (data.dateOfBirth !== null && typeof data.dateOfBirth !== "string") {
      throw new Error("dateOfBirth must be a string or null");
    }
    validatedData.dateOfBirth = data.dateOfBirth || null;
  }

  if (data.gender !== undefined) {
    if (data.gender !== null && !["male", "female", "other"].includes(data.gender)) {
      throw new Error("gender must be one of: male, female, other");
    }
    validatedData.gender = data.gender || null;
  }

  if (data.photoURL !== undefined) {
    if (typeof data.photoURL !== "string") {
      throw new Error("photoURL must be a string");
    }
    validatedData.photoURL = data.photoURL || null;
  }

  const updatedProfile = await updateUserProfile(user.uid, validatedData);

  return {
    success: true,
    data: updatedProfile,
  };
});

