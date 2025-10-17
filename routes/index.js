var express = require('express');
var router = express.Router();
const user = require("../models/user")
const multer = require('multer');
const { storage, sdk, InputFile } = require('../config/appwriteClient');
const FileMeta = require('../models/filemeta');
const authmiddleware = require("../middlewares/auth")

const upload = multer({
  storage: multer.memoryStorage(), // we want the buffer to upload directly
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit (adjust)
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/home",authmiddleware,async(req,res)=>{

  const userfiles = await FileMeta.find({  // find all the files corresponding to current user
    user: req.user.userID
  })

res.render("homepage",{   // send all to frontend
  files: userfiles
})
})

router.post("/uploadfile",authmiddleware, upload.single('file') , async(req,res)=>{
  try {
    // Turn multer buffer into an Appwrite InputFile
    const inputFile = InputFile.fromBuffer(req.file.buffer, req.file.originalname);
    
    // Upload to Appwrite storage
    // createFile can be called with an object - bucketId, fileId, file, permissions (optional)
    const created = await storage.createFile({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId: sdk.ID.unique(), // or you can use req.file.originalname (but ID.unique() avoids collisions)
      file: inputFile
      // optionally: permissions: ["read('any')"] etc.
    });
    
    const newfile = await FileMeta.create({
      filename: created.name || req.file.originalname,
      originalname: req.file.originalname,
      fileid: created.$id,
      user: req.user.userID
      
    })
    
    // redirect to home after successful upload
    return res.redirect('/home');
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

})

router.get("/download/:path", authmiddleware , async (req,res)=>{

  const loggedinUser = req.user.userID
  const fileid = req.params.path
  const file = await FileMeta.findOne({  // find the file
    user: loggedinUser,
    fileid: fileid
  })

  if (file) {       // then download

 // call Appwrite
    const result = await storage.getFileDownload(process.env.APPWRITE_BUCKET_ID, fileid);
    console.log("Appwrite download result:", typeof result, result && Object.keys(result || {}).slice(0,10));

    // handle ArrayBuffer (Appwrite returned binary ArrayBuffer)
    if (typeof ArrayBuffer !== 'undefined' && result instanceof ArrayBuffer) {
      const buf = Buffer.from(result);
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      return res.send(buf);
    }

    // handle typed arrays (Uint8Array, etc.)
    if (result && ArrayBuffer.isView(result)) {
      const view = result;
      const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength);
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      return res.send(buf);
    }

    // existing handlers...
    if (result && typeof result.href === "string") {
      return res.redirect(result.href);
    }
    if (Buffer.isBuffer(result)) {
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      return res.send(result);
    }
    if (result && typeof result.arrayBuffer === "function") {
      const buf = Buffer.from(await result.arrayBuffer());
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      return res.send(buf);
    }
    
  } else {
    return res.status(401).json({
      message: "unauthorized"
    })
  }


})

// delete handler used by both POST (forms) and DELETE (AJAX/fetch)
async function handleDelete(req, res) {
  try {
    const loggedinUser = req.user.userID;
    const fileid = req.params.path;

    const file = await FileMeta.findOne({
      user: loggedinUser,
      fileid: fileid
    });

    if (!file) {
      return res.status(404).send("File not found or unauthorized");
    }

    // delete from Appwrite
    await storage.deleteFile(process.env.APPWRITE_BUCKET_ID, fileid);

    // remove metadata from Mongo
    await FileMeta.deleteOne({ _id: file._id });

    return res.redirect("/home");
  } catch (err) {
    console.error("delete file error:", err);
    return res.status(500).send("Failed to delete file");
  }
}

// route for HTML form (POST)
router.post("/delete/:path", authmiddleware, async (req, res) => {
  return handleDelete(req, res);
});

// route for API/fetch (DELETE)
router.delete("/delete/:path", authmiddleware, async (req, res) => {
  return handleDelete(req, res);
});


module.exports = router;
