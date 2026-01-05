const { Router } = require("express");
const { controllers } = require("../controllers/index");
const { validateFolder } = require("../validators/folderValidators");
const { handleValidationErrors } = require("../middlewares/validate");
const { getFolderShareToken } = require("../middlewares/shareMiddleware");
const {
  createFolderShareValidator,
  revokeFolderShareValidator,
} = require("../validators/shareValidators");
// const { upload } = require("../middlewares/upload");

const folderRouter = Router();

folderRouter.get("/", controllers.listDashboardItems);
folderRouter.get("/details", controllers.getAllFolderDetails);
folderRouter.post("/create", controllers.createFolder);
folderRouter.get("/:folderId", controllers.listDashboardItems);

folderRouter.get("/:folderId/details", controllers.getFolderDetails);
folderRouter.put("/:folderId/edit", controllers.putFolderEdit);
folderRouter.delete("/:folderId/delete", controllers.deleteFolder);

folderRouter.get(
  "/:folderId/share",
  validateFolder,
  handleValidationErrors,
  getFolderShareToken,
  controllers.getFolderShareInfo
);
folderRouter.post(
  "/:folderId/share",
  createFolderShareValidator,
  handleValidationErrors,
  controllers.postFolderShare
);
folderRouter.delete(
  "/:folderId/share",
  revokeFolderShareValidator,
  handleValidationErrors,
  controllers.deleteFolderShare
);

module.exports = {
  folderRouter,
};
