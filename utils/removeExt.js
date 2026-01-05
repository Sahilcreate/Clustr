const path = require("path");

function removeExt(originalname) {
  return path.basename(originalname, path.extname(originalname));
}

module.exports = { removeExt };
