const { Router } = require("express");
const { controllers } = require("../controllers/index");
const { upload } = require("../middlewares/upload");

const folderRouter = Router();

folderRouter.get("/", controllers.listDashboardItems);
folderRouter.get("/details", controllers.getAllFolderDetails);
folderRouter.post("/create", controllers.createFolder);
folderRouter.get("/:folderId", controllers.listDashboardItems);

folderRouter.get("/:folderId/details", controllers.getFolderDetails);
folderRouter.put("/:folderId/edit", controllers.putFolderEdit);
// folderRouter.delete("/:folderId/delete");

// folderRouter.get("/:folderId/share");
// folderRouter.post("/:folderId/share");

module.exports = {
  folderRouter,
};
