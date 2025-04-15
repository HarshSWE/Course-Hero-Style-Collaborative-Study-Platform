// entry point of our node/express app

import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { fileModel } from "./models/file.model.js";

import multer from "multer";

dotenv.config();
const app = express();

//handles storage of files on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //first argument is null to indicate no error
    // the convention is this typically callback(error, result)
    // If there is an error, you pass the error as the first argument.
    // If everything is fine, you pass null as the first argument.
    cb(null, "./backend/uploads");
  },
  // Date.now() indicates uniqueness by the appending a timestamp
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Instead of "name" enter name attribute of the input tag
app.post("/fileupload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).send("No files uploaded");
    }

    for (const file of files) {
      // Multer provides these meta data (path, filename for us) it also has more like:
      // {
      //     fieldname: 'files',
      //     originalname: 'resume.pdf',
      //     encoding: '7bit',
      //     mimetype: 'application/pdf',
      //     destination: './backend/uploads',
      //     filename: '1713213423983-resume.pdf',
      //     path: 'backend/uploads/1713213423983-resume.pdf',
      //     size: 17800
      // }
      const { path, filename } = file;
      const newFile = new fileModel({ path, filename });
      await newFile.save();
    }
    //  User uploads a file via post

    //  Multer saves it on disk

    //  You extract the path and filename, and create a new document with the model's schema

    //  Mongoose fileModel.save() stores that info in MongoDB

    res.send("Files uploaded and saved to DB");
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Unable to upload file");
  }
});

// http://localhost:5000/, hitting the root route "/" if you type "/" after http://localhost:5000 it will auto change to http://localhost:5000
app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(5000, () => {
  connectDB();
  console.log("Sever started at http://localhost:5000");
});
