import express, { Request, Response } from "express";
import { AircraftType } from "../models/types";
import { verifyToken } from "../middleware/auth";
import { body } from "express-validator";
import myBookingController from "../controllers/my-bookings";

const router = express.Router();

router.get("/get/:booking_id", verifyToken, myBookingController.getBookingById);
router.get("/get", verifyToken, myBookingController.getMyBookings);
router.delete(
  "/cancel/:booking_id",
  verifyToken,
  myBookingController.cancelBooking
);

router.post("/get-tickets", verifyToken, myBookingController.getTickets);

export default router;
