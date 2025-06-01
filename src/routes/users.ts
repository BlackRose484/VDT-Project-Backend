import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth";
import userController from "../controllers/users";

const router = express.Router();

router.get("/me", verifyToken, userController.me);

/**
 * @route POST /api/users/register
 * @desc Register a new user and return a JWT token
 * @access Public
 * @param {Request} req - The request object containing user data
 * @param {Response} res - The response object to send data back
 */

router.get("/me", verifyToken, userController.me);

router.put("/change-password", verifyToken, userController.changePassword);

router.put("/update-profile", verifyToken, userController.update);

router.get(
  "/get-nums-booking-changed",
  verifyToken,
  userController.getNumsBookingChanged
);

router.put(
  "/clear-nums-booking-changed",
  verifyToken,
  userController.clearNumsBookingChanged
);

export default router;
