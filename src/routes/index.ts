import userRoutes from "./users";
import authRoutes from "./auth";
import myAircraftRoutes from "./my-aircrafts";
import flightRoutes from "./flights";
import myBookingRoutes from "./my-bookings";
import blogRoutes from "./blogs";
import rbacRoutes from "./rbac";
import { Application } from "express";
import { verifyToken, verifyRole } from "../middleware/auth";

const router = (app: Application) => {
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/my-aircrafts", verifyToken, verifyRole, myAircraftRoutes);
  app.use("/flights", flightRoutes);
  app.use("/my-bookings", verifyToken, myBookingRoutes);
  app.use("/blogs", blogRoutes);
  app.use("/rbac", verifyToken, verifyRole, rbacRoutes);
};

export default router;
