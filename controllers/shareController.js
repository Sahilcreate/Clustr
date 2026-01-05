const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_ANON_KEY
);

async function viewSharedFile(req, res) {
  console.log("viewSharedFile");
  return res.render("layouts/shareLayout", {
    title: "Shared File",
    content: {
      type: "file",
      file: req.sharedResource.data,
      token: req.share.token,
    },
  });
}

async function viewSharedFolder(req, res) {
  // console.log("headers Sent: ", res.headersSent);
  // console.log("req.share: ", req.share);
  // console.log("req.sharedResource: ", req.sharedResource);
  // console.log("viewSharedFolder");

  return res.render("layouts/shareLayout", {
    title: "Shared Folder",
    content: {
      type: "folder",
      rootFolder: req.sharedResource.data.rootFolder,
      targetFolder: req.sharedResource.data.targetFolder,
      subFolders: req.sharedResource.data.subFolders,
      subFiles: req.sharedResource.data.subFiles,
      breadcrumb: req.sharedResource.data.breadcrumb,
      token: req.share.token,
    },
  });
}

async function downloadSharedFile(req, res) {
  try {
    const file = req.sharedResource.data;

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

module.exports = {
  viewSharedFile,
  viewSharedFolder,
  downloadSharedFile,
};
