import express, { Request, Response } from "express";

import flightController from "../controllers/flights";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

router.post("/search", flightController.searchFlights);
router.post("/make-booking", verifyToken, flightController.makeBooking);
router.get("/get-airports", flightController.getAirports);
router.get("/get-all-flights", flightController.getAllFlights);
router.get("/get-popular-places", flightController.getPopularPlaces);
export default router;
