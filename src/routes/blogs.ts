import express from "express";
const router = express.Router();
import BlogController from "../controllers/blogs";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/blog_cover"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 1000000 } });

router.get("/get-all", BlogController.getAllBlogs);
router.get("/get-latest", BlogController.getLatestBlogs);
router.get("/get/:id", BlogController.getBlogById);
router.post("/upload", upload.single("cover"), BlogController.uploadBlog);
router.put("/update/:id", upload.single("cover"), BlogController.updateBlog);
router.delete("/delete/:id", BlogController.deleteBlog);

export default router;
