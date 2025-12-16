const cors = (_req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  if (_req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  next();
};

module.exports = {cors};

