// const {
//   getFolderById,
//   getFolderChildren,
//   postRootFolder,
//   postSubfolder,
//   putFolder,
//   deleteFolder,
// } = require("./api/folder");
const {
  getRegister,
  postRegister,
  getLogin,
  // postLogin,
  logout,
} = require("./authController");
const {
  uploadFile,
  uploadMultipleFiles,
  getFileDetails,
  downloadFile,
  deleteFile,
} = require("./fileController");
const {
  listDashboardItems,
  createFolder,
  getFolderDetails,
  getAllFolderDetails,
  putFolderEdit,
} = require("./folderController");
// const { getDashboard } = require("./dashboardController");
// const { getChildren } = require("./folderController");
const { indexController } = require("./indexController");

const controllers = {
  indexController,
  getRegister,
  postRegister,
  getLogin,
  // postLogin,
  logout,
  // getDashboard,
  // getChildren,
  // getFolderById,
  // getFolderChildren,
  // postRootFolder,
  // postSubfolder,
  // putFolder,
  // deleteFolder,
  // listRootItems,
  // listFolderItems,
  createFolder,
  listDashboardItems,
  getAllFolderDetails,
  getFolderDetails,
  putFolderEdit,
  uploadFile,
  uploadMultipleFiles,
  getFileDetails,
  downloadFile,
  deleteFile,
};

module.exports = { controllers };
