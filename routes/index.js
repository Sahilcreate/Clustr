const { authRouter } = require("./authRouter");
const { indexRouter } = require("./indexRouter");

const routes = {
  indexRouter,
  authRouter,
};

module.exports = { routes };
