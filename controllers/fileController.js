const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// --------------------------------------------------
// 1. Upload Single File
// --------------------------------------------------
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const folderId = req.body.folderId ? Number(req.body.folderId) : null;

    const saved = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
        path: req.file.path,
        userId: req.user.id,
        folderId: folderId,
      },
    });

    // For now simply redirect
    // res.redirect("/folders");
    const redirectPath = folderId ? `/folders/${folderId}` : "/folders";
    res.redirect(redirectPath);

    // res.json({
    //   message: "File uploaded",
    //   file: saved,
    // });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --------------------------------------------------
// 2. Upload Multiple Files
// --------------------------------------------------
async function uploadMultipleFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const folderId = req.body.folderId ? Number(req.body.folderId) : null;

    const data = req.files.map((f) => ({
      name: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      path: f.path,
      userId: req.user.id,
      folderId: folderId,
    }));

    const created = await prisma.file.createMany({ data });

    res.redirect("back");

    // res.json({
    //   message: "Files uploaded",
    //   count: created.count,
    // });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --------------------------------------------------
// 3. Get File Details
// --------------------------------------------------
async function getFileDetails(req, res) {
  try {
    const fileId = parseInt(req.params.fileId);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(400).json({ error: "File not found" });
    }

    res.json({ file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --------------------------------------------------
// 4. Download File
// --------------------------------------------------
async function downloadFile(req, res) {
  try {
    const fileId = parseInt(req.params.fileId);
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(path.resolve(file.path), file.originalName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --------------------------------------------------
// 5. Delete File
// --------------------------------------------------
async function deleteFile(req, res) {
  try {
    const fileId = parseInt(req.params.fileId);

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });
    if (!file) {
      return res.status(400).json({ error: "File not found" });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    res.json({
      message: "File deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  getFileDetails,
  downloadFile,
  deleteFile,
};
