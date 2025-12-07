const { folderRouter } = require("./folderRouter");
const { authRouter } = require("./authRouter");
const { fileRouter } = require("./fileRouter");
// const { dashboardRouter } = require("./dashboardRouter");

const { indexRouter } = require("./indexRouter");

const routes = {
  indexRouter,
  authRouter,
  fileRouter,
  folderRouter,
  // dashboardRouter,
};

module.exports = { routes };
