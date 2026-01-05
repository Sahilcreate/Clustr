const {
  getRegister,
  postRegister,
  getLogin,
  logout,
} = require("./authController");
const {
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
  putFileEdit,
  postFileShare,
  deleteFileShare,
  getFileShareInfo,
} = require("./fileController");
const {
  listDashboardItems,
  createFolder,
  getFolderDetails,
  getAllFolderDetails,
  putFolderEdit,
  deleteFolder,
  getFolderShareInfo,
  postFolderShare,
  deleteFolderShare,
} = require("./folderController");
const { indexController } = require("./indexController");
const {
  viewSharedFile,
  viewSharedFolder,
  downloadSharedFile,
} = require("./shareController");

const controllers = {
  indexController,
  getRegister,
  postRegister,
  getLogin,
  logout,

  createFolder,
  listDashboardItems,
  getAllFolderDetails,
  getFolderDetails,
  putFolderEdit,
  deleteFolder,
  getFolderShareInfo,
  postFolderShare,
  deleteFolderShare,

  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
  putFileEdit,
  getFileShareInfo,
  postFileShare,
  deleteFileShare,

  viewSharedFile,
  viewSharedFolder,
  downloadSharedFile,
};

module.exports = { controllers };
