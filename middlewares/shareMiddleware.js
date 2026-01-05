const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getFileShareToken(req, res, next) {
  const file = req.file;

  const shareLink = await prisma.shareLink.findUnique({
    where: {
      fileId: file.id,
    },
    select: {
      token: true,
      expiresAt: true,
      revoked: true,
    },
  });

  // console.log("getFileShareToken", shareLink);

  req.shareLink = shareLink;
  next();
}

async function getFolderShareToken(req, res, next) {
  const folder = req.folder;

  const shareLink = await prisma.shareLink.findUnique({
    where: {
      folderId: folder.id,
    },
    select: {
      token: true,
      expiresAt: true,
      revoked: true,
    },
  });

  // console.log("getFolderShareToken", shareLink)

  req.shareLink = shareLink;
  next();
}

module.exports = { getFileShareToken, getFolderShareToken };
