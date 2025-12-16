const {admin} = require("../firebase");

const logoutUser = async (uid) => {
  await admin.auth().revokeRefreshTokens(uid);
  return {ok: true};
};

module.exports = {logoutUser};

