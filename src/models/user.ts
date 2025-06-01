import mongoose from "mongoose";
import { UserType } from "./types";
import bcrypt from "bcryptjs";

// User schema definition
const userSchema = new mongoose.Schema<UserType>({
  email: { type: String, required: true, unique: true }, // User's email address, unique and required
  password: { type: String, required: true }, // User's password, required
  fullname: { type: String }, // User's full name
  sex: { type: String }, // User's gender
  address: { type: String }, // User's address
  phone: { type: String }, // User's phone number
  passport: { type: String }, // User's passport number
  date_of_birth: { type: Date }, // User's date of birth
  role: { type: String, enum: ["Customer", "Admin"], default: "Customer" }, // User's role, default is "Customer"
  nums_booking_changed: { type: Number, default: 0 }, // Number of times the user has changed bookings, default is 0
});

// Pre-save middleware to hash the password before saving the user model
userSchema.pre("save", async function (next) {
  // Check if the password is modified before saving the user
  if (this.isModified("password")) {
    // Hash the password using bcrypt with a salt rounds of 8
    this.password = await bcrypt.hash(this.password, 8);
  }
  // Proceed to the next middleware or save operation
  next();
});

// Creating the User model using the userSchema
const User = mongoose.model<UserType>("User", userSchema);

export default User;
