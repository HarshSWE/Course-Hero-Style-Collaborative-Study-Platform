import multer from "multer";

// Define the storage configuration for multer using diskStorage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./backend/uploads");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

export default upload;
