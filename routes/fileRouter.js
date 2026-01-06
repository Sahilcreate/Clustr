const { Router } = require("express");
const { controllers } = require("../controllers/index");
const { upload } = require("../middlewares/upload");
const { ensureAuthenticated } = require("../middlewares/auth");
const {
  editFileValidators,
  uploadFileValidators,
  validateFileUpload,
  validateFile,
} = require("../validators/fileValidators");
const {
  createFileShareValidator,
  // accessShareValidator,
  revokeFileShareValidator,
} = require("../validators/shareValidators");
const { handleValidationErrors } = require("../middlewares/validate");
const { validateIdParam } = require("../validators/common");
const { getFileShareToken } = require("../middlewares/shareMiddleware");

const fileRouter = Router();

// UPLOAD
fileRouter.post(
  "/upload",
  upload.single("file"),
  validateFileUpload,
  controllers.uploadFile
);
fileRouter.post(
  "/upload/:folderId",
  upload.single("file"),
  uploadFileValidators,
  handleValidationErrors,
  validateFileUpload,
  controllers.uploadFile
);

// FILE OPERATIONS
fileRouter.get("/:fileId", controllers.getFileDetails);
fileRouter.get(
  "/:fileId/download",
  validateFile,
  handleValidationErrors,
  controllers.downloadFile
);
fileRouter.put(
  "/:fileId/edit",
  validateFile,
  editFileValidators,
  handleValidationErrors,
  controllers.putFileEdit
);
fileRouter.delete(
  "/:fileId/delete",
  validateFile,
  handleValidationErrors,
  controllers.deleteFile
);

fileRouter.get(
  "/:fileId/share",
  validateFile,
  handleValidationErrors,
  getFileShareToken,
  controllers.getFileShareInfo
);
fileRouter.post(
  "/:fileId/share",
  createFileShareValidator,
  handleValidationErrors,
  controllers.postFileShare
);
fileRouter.delete(
  "/:fileId/share",
  revokeFileShareValidator,
  handleValidationErrors,
  controllers.deleteFileShare
);

module.exports = { fileRouter };
