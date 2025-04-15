import { Schema, model } from "mongoose";

const fileSchema = Schema({
  path: { type: String, required: true },
  filename: { type: String, required: true },
});

export const fileModel = model("files", fileSchema);

//Model let's you interact with the database create, read, update, delete, save documents
// Schema defines shape and structure of documents

// MongoDB Server
// └── Database (e.g., "notes")
//     └── Collection (e.g., "files")
//         └── Document (e.g., { filename: "abc.pdf", path: "/uploads/abc.pdf" })
// Each collection holds documents

// A document is a single record in a MongoDB collection — similar to a row in a SQL database, but way more flexible.
// Ex
// {
//     "path": "/uploads/1713122341240-math-notes.pdf"
//     "filename": "math-notes.pdf",
//
// }
// That entire object is one document in the "files" collection.
