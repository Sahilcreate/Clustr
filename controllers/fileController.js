const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const { removeExt } = require("../utils/removeExt");
const crypto = require("crypto");

const { fileService } = require("../services/fileService");

require("dotenv").config();

// --------------------------------------------------
// 1. Upload Single File
// --------------------------------------------------
async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errors: ["No file was uploaded"],
      });
    }

    const folderId = req.params.folderId ? Number(req.params.folderId) : null;

    const result = await fileService.uploadFile({
      file: req.file,
      userId: req.user.id,
      folderId,
    });

    return res.json(result);
  } catch (err) {
    console.error("uploadFile error: ", err);
    return res.status(500).json({
      success: false,
      errors: ["Internal server error"],
    });
  }
}

// --------------------------------------------------
// 3. Get File Details
// --------------------------------------------------
async function getFileDetails(req, res) {
  try {
    const fileId = parseInt(req.params.fileId);
    // console.log(typeof fileId);
    // console.log(fileId);

    let file = await prisma.file.findFirst({
      where: { id: fileId, userId: req.user.id },
      include: { shareLink: true },
    });

    if (!file) {
      console.log("it reached at error for no reason");
      return res.status(400).json({
        success: false,
        errors: ["No such file found."],
      });
    }

    // console.log(file);
    let shareUrl = null;
    if (
      file.shareLink &&
      file.shareLink.token &&
      (!file.shareLink.expiresAt || file.shareLink.expiresAt > new Date()) &&
      !file.shareLink.revoked
    ) {
      shareUrl = `${process.env.APP_URL}/share/${file.shareLink.token}/file/${file.id}`;
    }

    file = {
      ...file,
      nameWithoutExt: removeExt(file.originalName),
      shareUrl,
    };

    return res.json({ success: true, file });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: ["Internal server error"] });
  }
}

// --------------------------------------------------
// 4. Download File
// --------------------------------------------------
async function downloadFile(req, res) {
  try {
    const signedUrl = await fileService.downloadFile({ file: req.file });

    return res.redirect(signedUrl);
  } catch (err) {
    console.error("downloadFile error: ", err);
    return res
      .status(500)
      .json({ success: false, errors: ["Error downloading file. Try again."] });
  }
}

// --------------------------------------------------
// 5. Delete File
// --------------------------------------------------
async function deleteFile(req, res) {
  try {
    const result = await fileService.deleteFile({
      file: req.file,
    });

    return res.json(result);
  } catch (err) {
    console.error("deleteFile error: ", err);
    return res
      .status(500)
      .json({ success: false, errors: ["Server error. Please try later."] });
  }
}

// ------------------------------------------------------
// 6. Edit File
// ------------------------------------------------------
async function putFileEdit(req, res, next) {
  try {
    const { folderId } = req.body;

    const result = await fileService.updateFileMeta({
      file: req.file,
      name: req.body.name,
      folderId: req.body.folderId ?? null,
    });

    return res.json(result);
  } catch (err) {
    console.error("putFileEdit error: ", err);
    return res
      .status(500)
      .json({ success: false, errors: ["Server error. Please try later."] });
  }
}

// ------------------------------------------------------
// 7. Create Token
// ------------------------------------------------------
async function postFileShare(req, res, next) {
  const fileId = Number(req.params.fileId);
  const shareTime = Number(req.body.shareTime);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + shareTime);

  const token = crypto.randomBytes(32).toString("hex");

  const shareUrl = `${process.env.APP_URL}/share/${token}/file/${fileId}`;

  const existing = await prisma.shareLink.findFirst({
    where: { fileId },
  });

  let shareLink;

  if (existing) {
    shareLink = await prisma.shareLink.update({
      where: { id: existing.id },
      data: {
        token,
        expiresAt,
        revoked: false,
      },
    });
  } else {
    shareLink = await prisma.shareLink.create({
      data: {
        token,
        expiresAt,
        fileId,
      },
    });
  }

  return res.status(201).json({
    success: true,
    shareUrl,
    expiresAt: shareLink.expiresAt.toUTCString(),
  });
}

// ------------------------------------------------------
// 8. Get Share Token
// ------------------------------------------------------
async function getFileShareInfo(req, res, next) {
  const file = req.file;
  const shareLink = req.shareLink;

  // console.log("getFileShareInfo", file, shareLink);

  if (!shareLink || shareLink.revoked || shareLink.expiresAt < new Date()) {
    return res.json({
      success: true,
      token: null,
    });
  }

  return res.json({
    success: true,
    token: shareLink.token,
    shareUrl: `${process.env.APP_URL}/share/${shareLink.token}/file/${file.id}`,
    expiresAt: shareLink.expiresAt.toUTCString(),
  });
}

// ------------------------------------------------------
// 9. Revoke Token
// ------------------------------------------------------
async function deleteFileShare(req, res) {
  const fileId = Number(req.params.fileId);

  await prisma.shareLink.updateMany({
    where: {
      fileId,
      revoked: false,
    },
    data: {
      revoked: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Share link revoked successfully",
  });
}

module.exports = {
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
  putFileEdit,
  getFileShareInfo,
  postFileShare,
  deleteFileShare,
};
