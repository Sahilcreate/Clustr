const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Returns the breadcrumb path from root -> current folder
 * @param {number|null} folderId
 * @param {number} userId
 * @returns [{id, name}]
 */
async function getFolderPath(userId, folderId) {
  if (!folderId) {
    return [{ id: null, name: "Root" }];
  }

  // Load all folders at once
  const allFolders = await prisma.folder.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  });

  // Convert to map for O(1) parent lookup
  const folderMap = new Map(allFolders.map((f) => [f.id, f]));

  const path = [];
  let currentId = folderId;

  // Walk upward till root
  while (currentId) {
    const folder = folderMap.get(currentId);
    if (!folder) break;

    path.push({
      id: folder.id,
      name: folder.name,
    });

    currentId = folder.parentId;
  }

  // Add root
  path.push({
    id: null,
    name: "Root",
  });

  return path.reverse();
}

module.exports = { getFolderPath };
