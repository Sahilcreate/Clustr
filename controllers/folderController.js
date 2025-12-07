const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getFolderPath } = require("../utils/pathHelpers");
const { getAllDescendantIds } = require("../utils/descendantHelper");

// async function listRootItems(req, res) {
//   try {
//     // Get root folders
//     const folders = await prisma.folder.findMany({
//       where: {
//         userId: req.user.id,
//         parentId: null,
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     // Get root files
//     const files = await prisma.file.findMany({
//       where: {
//         userId: req.user.id,
//         folderId: null,
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     const breadcrumb = [{ id: null, name: "Root" }];

//     res.render("layouts/noSidebarLayout", {
//       title: "Dashboard",
//       content: {
//         type: "dashboard",
//         folders,
//         files,
//         breadcrumb,
//         currentFolder: null,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

async function createFolder(req, res) {
  try {
    const parentId = req.body.parentId ? Number(req.body.parentId) : null;

    const newFolder = await prisma.folder.create({
      data: {
        name: req.body.name,
        userId: req.user.id,
        parentId: parentId,
      },
    });

    res.redirect(`/folders/${newFolder.id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listDashboardItems(req, res) {
  try {
    const folderId = req.params.folderId ? parseInt(req.params.folderId) : null;

    let currentFolder = null;
    let folders = [];
    let files = [];

    if (folderId) {
      currentFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          id: folderId,
        },
      });
    }

    folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: folderId,
      },
    });

    files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
        folderId: folderId,
      },
    });

    const breadcrumb = await getFolderPath(req.user.id, folderId);

    res.render("layouts/noSidebarLayout", {
      title: currentFolder ? `${currentFolder.name}` : "Dashboard",
      content: {
        type: "dashboard",
        folders,
        files,
        currentFolder,
        breadcrumb,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllFolderDetails(req, res) {
  try {
    const excludeId = Number(req.query.excludeDescendantsOf);
    let excludeIds = [];

    if (!isNaN(excludeId)) {
      const exists = await prisma.folder.findFirst({
        where: {
          id: excludeId,
          userId: req.user.id,
        },
      });

      if (exists) {
        const descendants = await getAllDescendantIds(excludeId, req.user.id);
        excludeIds = [excludeId, ...descendants];
      }
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const result = [{ id: null, name: "Root" }, ...folders];

    res.json({ result });
  } catch (err) {
    console.error("getAllFolderDetails error: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getFolderDetails(req, res) {
  try {
    const folderId = Number(req.params.folderId);

    if (isNaN(folderId)) {
      return res.status(400).json({ error: "Invalid folder id." });
    }

    const folder = await prisma.folder.findFirst({
      where: {
        userId: req.user.id,
        id: folderId,
      },
    });

    if (!folder) {
      return res.status(400).json({
        error: "No such folder found.",
      });
    }

    return res.json({ folder });
  } catch (err) {
    console.error("getFolderDetails error: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function putFolderEdit(req, res) {
  try {
    const folderId = Number(req.params.folderId);
    if (isNaN(folderId)) {
      return res.status(400).json({ error: "Invalid folder id" });
    }

    const { name, parentId } = req.body;
    let newParentId = null;

    if (
      parentId !== null &&
      parentId !== "null" &&
      parentId !== "" &&
      parentId !== undefined
    ) {
      const parsed = Number(parentId);
      newParentId = isNaN(parsed) ? null : parsed;
    }

    // Fetch folder, ownership check
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.user.id,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found." });
    }

    // Self-parent block
    if (newParentId === folderId) {
      return res
        .status(400)
        .json({ error: "Folder cannot be its own parent." });
    }

    // Validate new parent
    if (newParentId !== null) {
      const newParentFolder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          id: newParentId,
        },
      });

      if (!newParentFolder) {
        return res.status(400).json({ error: "Invalid parent folder" });
      }
    }

    // New parent should not be its own descendants
    if (newParentId !== null) {
      const descendants = await getAllDescendantIds(folderId, req.user.id);

      if (descendants.includes(newParentId)) {
        return res.status(400).json({
          error: "Cannot move folder into its own descendants.",
        });
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
      },
    });

    res.json({
      success: true,
      folder: updatedFolder,
    });
  } catch (err) {
    console.error("putFolderEdit error: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  //   listRootItems,
  //   listFolderItems,
  createFolder,
  listDashboardItems,
  getAllFolderDetails,
  getFolderDetails,
  putFolderEdit,
};
