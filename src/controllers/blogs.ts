import { Request, Response } from "express";
import Blog from "../models/blogs";

const BlogController = {
  getAllBlogs: async (req: Request, res: Response) => {
    const blogs = await Blog.find();  // Fetch all blogs from the database
    res.json(blogs);
  },

  getLatestBlogs: async (req: Request, res: Response) => {
    const blogs = await Blog.find().sort({ createdAt: -1 });  // Sort blogs by createdAt in descending order
    res.json(blogs);
  },

  getBlogById: async (req: Request, res: Response) => {
    const blog = await Blog.findById(req.params.id); 
    res.json(blog);
  },

  uploadBlog: async (req: Request, res: Response) => {
    const { title, subtitle, content } = req.body;
    const new_blog = new Blog({  // Create new blog instance
      title,
      subtitle,
      content,
      cover_url: req.file ? req.file.filename : undefined,  // Assign cover image if uploaded
    });
    await new_blog.save(); 
    res.status(200).json("Created new blog successfully");
  },

  updateBlog: async (req: Request, res: Response) => {
    const { title, subtitle, content } = req.body;
    try {
      const blog = await Blog.findById(req.params.id);  // Find the blog to update
      const updated_blog = await Blog.findByIdAndUpdate(req.params.id, {
        title,
        subtitle,
        content,
        cover_url: req.file ? req.file.filename : blog?.cover_url,  // Preserve cover image if no new file is uploaded
      });
      res.status(200).json("Updated blog successfully");
    } catch (error) {
      res.status(500).json(error); 
    }
  },
};

export default BlogController;
