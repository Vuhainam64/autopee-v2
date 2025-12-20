const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

if (!admin.apps.length) {
  const gaCred = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (gaCred && fs.existsSync(gaCred)) {
    // Sử dụng file JSON từ biến môi trường (production khuyên dùng)
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const svc = require(gaCred);
    admin.initializeApp({
      credential: admin.credential.cert(svc),
    });
  } else {
    // Fallback: dùng ServiceAccount.json trong thư mục server (dev/local)
    const localPath = path.resolve(__dirname, "..", "ServiceAccount.json");
    if (fs.existsSync(localPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const svc = require(localPath);
      admin.initializeApp({
        credential: admin.credential.cert(svc),
      });
    } else {
      // Cuối cùng: thử init mặc định (sẽ lỗi nếu không có metadata server)
      admin.initializeApp();
    }
  }
}

module.exports = { admin };


