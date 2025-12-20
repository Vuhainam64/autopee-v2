const mongoose = require("mongoose");

const connectDB = async () => {
  const defaultUri = "mongodb://127.0.0.1:27017/autopee";
  const uri = process.env.MONGODB_URI || defaultUri;

  try {
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log("[mongo] Connected to", uri);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mongo] Connection error", err);
    process.exit(1);
  }
};

module.exports = connectDB;


