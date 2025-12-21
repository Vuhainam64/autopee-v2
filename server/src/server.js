require("dotenv").config();
const app = require("./app");
const { startCleanupScheduler } = require("./services/cleanupService");

const PORT = process.env.PORT || 2722;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Autopee API (Mongo) listening on port ${PORT}`);
  
  // Khởi động cleanup scheduler
  startCleanupScheduler();
});


