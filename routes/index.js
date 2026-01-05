const { folderRouter } = require("./folderRouter");
const { authRouter } = require("./authRouter");
const { fileRouter } = require("./fileRouter");
const { indexRouter } = require("./indexRouter");
const { shareRouter } = require("./shareRouter");

const routes = {
  indexRouter,
  authRouter,
  fileRouter,
  folderRouter,
  shareRouter,
};

module.exports = { routes };
