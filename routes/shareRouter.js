const { Router } = require("express");
const { controllers } = require("../controllers/index");
const {
  accessShareValidator,
  sharedDescendantValidator,
} = require("../validators/shareValidators");
const { handleValidationErrors } = require("../middlewares/validate");

const shareRouter = Router();

shareRouter.get(
  "/:token/folder/:folderId",
  accessShareValidator,
  handleValidationErrors,
  sharedDescendantValidator,
  controllers.viewSharedFolder
);

shareRouter.get(
  "/:token/file/:fileId",
  accessShareValidator,
  handleValidationErrors,
  sharedDescendantValidator,
  controllers.viewSharedFile
);

shareRouter.get(
  "/:token/file/:fileId/download",
  accessShareValidator,
  handleValidationErrors,
  sharedDescendantValidator,
  controllers.downloadSharedFile
);

module.exports = { shareRouter };
