const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validateIdParam } = require("./common");

const validateFolder = [
  validateIdParam("folderId").custom(async (folderId, { req }) => {
    const folder = await prisma.folder.findFirst({
      where: {
        id: Number(folderId),
        userId: req.user.id,
      },
    });

    if (!folder) {
      throw new Error("Folder not found or access denied");
    }

    req.folder = folder;
    return true;
  }),
];

module.exports = { validateFolder };
