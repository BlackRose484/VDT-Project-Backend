import mongoose from "mongoose";
import { BlogType } from "./types";

// Define the Blog schema 
const blogSchema = new mongoose.Schema<BlogType>({
  content: { type: String }, // The content of the blog post, can be empty (optional field)
  title: { type: String }, // The title of the blog post, optional field
  cover_url: { type: String }, // URL of the blog post cover image, optional field
  subtitle: { type: String }, // Subtitle for the blog post, optional field
  createdAt: { type: Date, default: Date.now }, // The timestamp when the blog post is created, default to the current date and time
});

// Create and export the Blog model based on the schema
const Blog = mongoose.model<BlogType>("Blog", blogSchema);
export default Blog;
