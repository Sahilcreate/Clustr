const { Router } = require("express");
const { controllers } = require("../controllers/index");
const { upload } = require("../middlewares/upload");
const { ensureAuthenticated } = require("../middlewares/auth");

const fileRouter = Router();

// UPLOAD
fileRouter.post("/upload", upload.single("file"), controllers.uploadFile);
fileRouter.post(
  "/upload-multiple",
  upload.array("files", 10),
  controllers.uploadMultipleFiles
);
// fileRouter.post("/folders/:folderId/upload", upload.single("file"))

// FILE OPERATIONS
fileRouter.get("/:fileId", controllers.getFileDetails);
fileRouter.get("/:fileId/download", controllers.downloadFile);
fileRouter.delete("/:fileId", controllers.deleteFile);

module.exports = { fileRouter };
