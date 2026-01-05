const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAllDescendantIds(folderId, userId) {
  const descendants = [];
  const stack = [folderId];

  while (stack.length) {
    const currentId = stack.pop();

    const children = await prisma.folder.findMany({
      where: {
        userId,
        parentId: currentId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const child of children) {
      descendants.push(child.id);
      stack.push(child.id);
    }
  }

  return descendants;
}

async function isDescendant(rootId, nodeId) {
  if (!nodeId) return false;
  if (rootId === nodeId) return true;

  let currentId = nodeId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: {
        id: currentId,
      },
      select: {
        parentId: true,
      },
    });

    if (!folder) return false;

    if (folder.parentId === rootId) {
      return true;
    }

    currentId = folder.parentId;
  }

  return false;
}

module.exports = {
  getAllDescendantIds,
  isDescendant,
};
