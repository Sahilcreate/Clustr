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

module.exports = {
  getAllDescendantIds,
};
