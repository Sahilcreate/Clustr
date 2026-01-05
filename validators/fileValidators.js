const { body, param } = require("express-validator");
const path = require("path");
const { validateIdParam } = require("./common");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// async function validateFile(req, res ,next) {
//   const fileId = Number(req.params.fileId);

//   const file = await prisma.file.findFirst({
//     where: {
//       id: fileId,
//       userId: req.user.id
//     }
//   });

//   if(!file) {

//   }
// }

const validateFile = [
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
        throw new Error("No such file exists");
      }

      req.file = file;
      return true;
    }),
];

function isSafeExtension(filename) {
  console.log("isSafeExtension");
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename).toLowerCase();

  console.log("ext: ", ext);
  console.log("base: ", base);

  const allowedExt = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

  // must end with excatly one validation
  if (!allowedExt.includes(ext)) {
    return false;
  }

  // prevent double-extension
  const filenameWithoutExt = base.replace(ext, "");
  if (filenameWithoutExt.includes(".")) {
    return flase;
  }

  if (base.includes("%00") || base.includes("\0")) {
    return false;
  }

  console.log("isSafeExtension before true");
  return true;
}

const editFileValidators = [
  validateIdParam("fileId"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .custom((value) => {
      if (value.includes(".")) {
        throw new Error("Name cannot contain dots (.)");
      }
      return true;
    })
    .matches(/^[a-zA-Z0-9 _\-\(\)]+$/)
    .withMessage(
      "Invalid characters. Allowed: letters, numbers, spaces, - _ ( )"
    )
    .isLength({ max: 100 })
    .withMessage("Name too long(max 100 chars)"),

  body("folderId")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (value === "null" || value === "") return true;

      const n = Number(value);
      if (isNaN(n)) throw new Error("Invalid folder id");
      return true;
    }),
];

const uploadFileValidators = [
  param("folderId")
    .exists()
    .withMessage("folderId is required")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("Invalid folder ID"),
];

function validateFileUpload(req, res, next) {
  // console.log("validateFileUpload");
  const file = req.file;
  // console.log(file);

  if (!file) {
    return res.status(400).json({
      success: false,
      errors: ["You must upload a file"],
    });
  }

  const originalName = file.originalname.toLowerCase();

  if (!isSafeExtension(originalName)) {
    return res.status(400).json({
      success: false,
      errors: [`Suspicious or invalid file extension: ${originalName}`],
    });
  }

  // console.log("validateFileUpload just before next");
  next();
}

module.exports = {
  validateFile,
  editFileValidators,
  uploadFileValidators,
  validateFileUpload,
};
