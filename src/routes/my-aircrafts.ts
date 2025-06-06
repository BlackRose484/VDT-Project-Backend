import express, { Request, Response } from "express";
import { AircraftType } from "../models/types";
import { verifyToken } from "../middleware/auth";
import { body } from "express-validator";
import myAircraftController from "../controllers/my-aircrafts";

const router = express.Router();

router.post("/add", myAircraftController.addAircraft);
router.get("/get-all", myAircraftController.getAircrafts);
router.get("/get/:aircraft_id", myAircraftController.getAircraftById);
router.put("/update/:aircraft_id", myAircraftController.updateAircraft);
router.delete("/delete/:aircraft_id", myAircraftController.deleteAircraft);
router.post("/:aircraft_id/add-flight", myAircraftController.addFlight);
router.get("/:aircraft_id/get-flights", myAircraftController.getFlights);
router.put(
  "/:aircraft_id/update-flight/:flight_id",
  myAircraftController.updateFlight
);
router.delete(
  "/:aircraft_id/delete-flight/:flight_id",
  myAircraftController.deleteFlight
);

router.get("/get-revenue/:year", myAircraftController.getRevenue);
router.get("/get-popular/:year", myAircraftController.getPopular);
router.get(
  "/get-all-tickets/:flight_id",
  myAircraftController.getAllTicketsByFlightId
);

export default router;
