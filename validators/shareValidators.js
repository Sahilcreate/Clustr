const { body, param } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validateIdParam } = require("./common");
const { validateFile } = require("./fileValidators");
const { isDescendant } = require("../utils/descendantHelper");
const { removeExt } = require("../utils/removeExt");
const { bytesToMb } = require("../utils/bytesToMb");
const { dateToString } = require("../utils/dateToString");
const { getSharedFolderPath } = require("../utils/pathHelpers");

const createFileShareValidator = [
  validateIdParam("fileId")
    .bail()
    .custom(async (fileId, { req }) => {
      const file = await prisma.file.findFirst({
        where: {
          id: Number(fileId),
          userId: req.user.id,
        },
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      return true;
    })
    .custom(async (fileId, { req }) => {
      const existingLink = await prisma.shareLink.findFirst({
        where: {
          fileId: Number(fileId),
          revoked: false,
        },
      });
      if (existingLink && existingLink.expiresAt > new Date()) {
        throw new Error("File already has an active share link");
      }
      return true;
    }),
  body("shareTime")
    .notEmpty()
    .withMessage("Share time is required")
    .isInt({ max: 10, min: 1 })
    .withMessage("Share time must be between 1 and 10"),
];

const createFolderShareValidator = [
  validateIdParam("folderId")
    .bail()
    .custom(async (folderId, { req }) => {
      const folder = await prisma.folder.findFirst({
        where: {
          id: Number(folderId),
          userId: req.user.id,
        },
      });

      if (!folder) {
        throw new Error("Folder not found or access denied");
      }

      return true;
    })
    .custom(async (folderId, { req }) => {
      const existingLink = await prisma.shareLink.findFirst({
        where: {
          folderId: Number(folderId),
          revoked: false,
        },
      });
      if (existingLink && existingLink.expiresAt > new Date()) {
        throw new Error("Folder already has an active share link");
      }
      return true;
    }),
  body("shareTime")
    .notEmpty()
    .withMessage("Share time is required")
    .isInt({ max: 10, min: 1 })
    .withMessage("Share time must be between 1 and 10"),
];

const accessShareValidator = [
  param("token")
    .exists()
    .withMessage("Share token is required")
    .isLength({ min: 32 })
    .withMessage("Invalid share token")
    .custom(async (token, { req }) => {
      const shareLink = await prisma.shareLink.findFirst({
        where: {
          token,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          file: true,
          folder: true,
        },
      });
      if (!shareLink) {
        throw new Error("Invalid or expired share link");
      }

      if (!shareLink.file && !shareLink.folder) {
        throw new Error("Share link has no atttached resource");
      }

      req.share = {
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        resourceType: shareLink.file ? "file" : "folder",
        file: shareLink.file || null,
        folder: shareLink.folder || null,
      };

      // console.log("accessShareValidator", req.share);

      return true;
    }),
];

const revokeFileShareValidator = [
  validateIdParam("fileId").custom(async (fileId, { req }) => {
    const link = await prisma.shareLink.findFirst({
      where: {
        fileId: Number(fileId),
        revoked: false,
        file: {
          userId: req.user.id,
        },
      },
    });

    if (!link) {
      throw new Error("No active file share link found.");
    }

    return true;
  }),
];

const revokeFolderShareValidator = [
  validateIdParam("folderId").custom(async (folderId, { req }) => {
    const link = await prisma.shareLink.findFirst({
      where: {
        folderId: Number(folderId),
        revoked: false,
        folder: {
          userId: req.user.id,
        },
      },
    });

    if (!link) {
      throw new Error("No active folder share link found.");
    }
  }),
];

async function sharedDescendantValidator(req, res, next) {
  const { resourceType, file, folder } = req.share;

  const fileId = req.params.fileId ? Number(req.params.fileId) : null;
  const folderId = req.params.folderId ? Number(req.params.folderId) : null;

  const deny = () =>
    res.status(403).render("share/invalid", { message: "Access denied" });

  // FILE SHARE
  if (resourceType === "file") {
    if (!fileId || fileId !== file.id) return deny();

    req.sharedResource = {
      type: "file",
      data: {
        ...file,
        nameWithoutExt: removeExt(file.originalName),
        size: bytesToMb(file.size),
        createdAt: dateToString(file.createdAt),
        updatedAt: dateToString(file.updatedAt),
      },
    };
    return next();
  }

  // FOLDER SHARE
  if (resourceType === "folder") {
    // Root Access
    // if (!fileId && !folderId) {
    //   req.sharedResource = {
    //     type: "folder",
    //     data: folder,
    //   };
    //   return next();
    // }

    // Folder or Subfolder
    if (folderId) {
      const allowed =
        folderId === folder.id || (await isDescendant(folder.id, folderId));
      if (!allowed) return deny();

      const targetFolder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
      });

      if (!targetFolder) return deny();

      const rootFolder = await prisma.folder.findUnique({
        where: {
          id: folder.id,
        },
      });
      const breadcrumb = await getSharedFolderPath(folder.id, folderId);

      let [subFolders, subFiles] = await Promise.all([
        prisma.folder.findMany({ where: { parentId: folderId } }),
        prisma.file.findMany({ where: { folderId } }),
      ]);

      subFiles = subFiles.map((f) => ({
        ...f,
        nameWithoutExt: removeExt(f.originalName),
      }));

      req.sharedResource = {
        type: "folder",
        data: { rootFolder, targetFolder, subFolders, subFiles, breadcrumb },
      };

      // console.log("sharedDescendantValidator", req.sharedResource);
      return next();
    }

    // File inside shared folder
    if (fileId) {
      const targetFile = await prisma.file.findUnique({
        where: {
          id: fileId,
        },
      });

      if (
        !targetFile ||
        !(
          targetFile.folderId === folder.id ||
          (await isDescendant(folder.id, targetFile.folderId))
        )
      ) {
        return deny();
      }

      req.sharedResource = { type: "file", data: targetFile };
      return next();
    }
  }

  return res.status(404).render("share/invalid", {
    message: "Invalid shared access",
  });
}

module.exports = {
  createFileShareValidator,
  createFolderShareValidator,
  accessShareValidator,
  revokeFileShareValidator,
  revokeFolderShareValidator,
  sharedDescendantValidator,
};
