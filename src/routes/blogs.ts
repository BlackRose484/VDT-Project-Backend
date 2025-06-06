import express from "express";
const router = express.Router();
import BlogController from "../controllers/blogs";

import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../utils/cloudinary";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage, limits: { fileSize: 1000000 } });

const uploadWithCloudinary = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  try {
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "blog_cover",
            public_id: Date.now().toString(),
            resource_type: "image",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();
    req.cloudinary = result;
    next();
  } catch (err) {
    console.error(err);
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
