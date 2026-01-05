const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const { removeExt } = require("../utils/removeExt");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_ANON_KEY
);

// --------------------------------------------------
// 1. Upload Single File
// --------------------------------------------------
async function uploadFile(req, res, next) {
  console.log("here");
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errors: ["No file was uploaded"],
      });
    }

    const folderId = req.params.folderId ? Number(req.params.folderId) : null;

    const ext = path.extname(req.file.originalname);
    const objectKey = `${req.user.id}/${crypto.randomUUID()}${ext}`;
    const bucket = "uploads";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectKey, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw error;
    }

    let saved;
    try {
      saved = await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          bucket,
          objectKey,
          size: req.file.size,
          mimeType: req.file.mimetype,
          userId: req.user.id,
          folderId,
        },
      });
    } catch (dbError) {
      // rollback uploaded file if DB insert fails
      await supabase.storage.from(bucket).remove([objectKey]);
      throw dbError;
    }

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: saved,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      errors: ["Internal server error"],
    });
  }
}

// --------------------------------------------------
// 2. Upload Multiple Files
// --------------------------------------------------
// async function uploadFile(req, res) {
//   console.log("here");
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         errors: ["No files were uploaded"],
//       });
//     }

//     const folderId = req.params.folderId ? Number(req.params.folderId) : null;

//     const data = req.files.map((f) => ({
//       name: f.filename,
//       originalName: f.originalname,
//       size: f.size,
//       mimeType: f.mimetype,
//       path: f.path,
//       userId: req.user.id,
//       folderId: folderId,
//     }));

//     const created = await prisma.file.createMany({ data });

//     res.json({
//       success: true,
//       message: "Files uploaded successfully",
//       count: created.count,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       errors: ["Internal server error"],
//     });
//   }
// }

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
    const file = req.file;

    const bucket = file.bucket;
    const filePath = file.objectKey;

    let { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60, {
        download: file.originalName,
      });

    if (error) {
      return res.status(500).send("Failed to generate download link.");
    }

    return res.redirect(data.signedUrl);
  } catch (err) {
    console.error("downloadFile error: ", err);
    res.status(500).json("Error downloading file");
  }
}

// --------------------------------------------------
// 5. Delete File
// --------------------------------------------------
async function deleteFile(req, res) {
  try {
    const fileId = parseInt(req.params.fileId);

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.user.id,
      },
    });
    if (!file) {
      return res.status(400).json({ error: "File not found" });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const deletedFile = await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    res.json({
      success: true,
      file: deletedFile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ------------------------------------------------------
// 6. Edit File
// ------------------------------------------------------
async function putFileEdit(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: "Invalid file id" });
    }

    const { name, folderId } = req.body;
    let newFolderId = null;

    if (
      folderId !== null &&
      folderId !== "null" &&
      folderId !== "" &&
      folderId !== undefined
    ) {
      const parsed = Number(folderId);
      newFolderId = isNaN(parsed) ? null : parsed;
    }

    // Fetch file, ownership check
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: req.user.id,
      },
    });

    const oldOriginalName = file.originalName;
    const ext = path.extname(oldOriginalName);
    const newOriginalName = name + ext;

    if (!file) {
      return res.status(404).json({ error: "File not found." });
    }

    // Validate new parent
    if (newFolderId !== null) {
      const newFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          id: newFolderId,
        },
      });

      if (!newFolder) {
        return res.status(400).json({ error: "Invalid parent folder" });
      }
    }

    const updatedFile = await prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        originalName: newOriginalName,
        folderId: folderId ? Number(folderId) : null,
      },
    });

    return res.json({
      success: true,
      file: updatedFile,
    });
  } catch (err) {
    console.error("putFileEdit error: ", err);
    next(err);
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
