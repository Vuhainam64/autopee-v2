const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const shopeeRoutes = require("./routes/shopee");
const {errorHandler} = require("./middleware/error");
const {cors} = require("./middleware/cors");

const app = express();

app.use(express.json());
app.use(cors);

app.get("/", (_req, res) => {
  res.json({ok: true, service: "gen1-api"});
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/shopee", shopeeRoutes);

// Error handler should be last
app.use(errorHandler);

module.exports = app;

