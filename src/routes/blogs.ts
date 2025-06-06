import express from "express";
const router = express.Router();
import BlogController from "../controllers/blogs";

import multer from "multer";
import path from "path";
import cloudinary from "../utils/cloudinary";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/blog_cover"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 1000000 } });

const uploadWithCloudinary = async (req: any, res: any, next: any) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blog_cover",
      public_id: Date.now().toString(),
      resource_type: "image",
    });

    req.cloudinary = result;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Image upload error",
    });
  }
};

router.get("/get-all", BlogController.getAllBlogs);
router.get("/get-latest", BlogController.getLatestBlogs);
router.get("/get/:id", BlogController.getBlogById);
router.post(
  "/upload",
  upload.single("cover"),
  uploadWithCloudinary,
  BlogController.uploadBlog
);
router.put(
  "/update/:id",
  upload.single("cover"),
  uploadWithCloudinary,
  BlogController.updateBlog
);
router.delete("/delete/:id", BlogController.deleteBlog);

export default router;
