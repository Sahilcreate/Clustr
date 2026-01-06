const path = require("path");
const crypto = require("crypto");
const { supabase } = require("../lib/supabaseClient");
const { prisma } = require("../lib/prismaClient");

const fileService = {
  uploadFile: async function ({ file, userId, folderId }) {
    const ext = path.extname(file.originalname);
    const objectKey = `${userId}/${crypto.randomUUID()}${ext}`;
    const bucket = "uploads";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    let saved;
    try {
      saved = await prisma.file.create({
        data: {
          originalName: file.originalname,
          bucket,
          objectKey,
          size: file.size,
          mimeType: file.mimetype,
          userId,
          folderId,
        },
      });
    } catch (dbError) {
      await supabase.storage.from(bucket).remove(objectKey);
      throw dbError;
    }

    return {
      success: true,
      message: "File uploaded successfully",
      file: saved,
    };
  },

  downloadFile: async function ({ file }) {
    const bucket = file.bucket;
    const filePath = file.objectKey;

    let { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60, {
        download: file.originalName,
      });

    if (error) {
      throw new Error("Failed to generate download link", { cause: error });
    }

    return data.signedUrl;
  },

  deleteFile: async function ({ file }) {
    const deletedFile = await prisma.file.delete({
      where: {
        id: file.id,
      },
    });

    const { error } = await supabase.storage
      .from(file.bucket)
      .remove([file.objectKey]);

    if (error) {
      throw new Error("Failed to delete file from storage", { cause: error });
    }

    return { success: true, file: deletedFile };
  },

  updateFileMeta: async function ({ file, name, folderId }) {
    const oldOriginalName = file.originalName;
    const ext = path.extname(oldOriginalName);
    const newOriginalName = name + ext;

    const updatedFile = await prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        originalName: newOriginalName,
        folderId: folderId ? Number(folderId) : null,
      },
    });

    return {
      success: true,
      file: updatedFile,
    };
  },
};

module.exports = { fileService };
