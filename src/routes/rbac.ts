import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import RbacController from "../controllers/rbac";

const router = express.Router();

router.get("/get-all", RbacController.getAllUsers);
router.get("/get-by-role/:role", RbacController.getUsersByRole);
router.get("/get-user/:id", RbacController.getUserById);
router.put("/update-role/:id", RbacController.updateUserRole);
router.get("/get-aircrafts/:id", RbacController.getAirCraftsByUserId);
router.put("/revoke-aircraft/:id", RbacController.revokeAircraftOwnership);
router.get("/get-aircrafts-exid/:id", RbacController.getAllAircraftsExID);
router.put("/grant-aircraft", RbacController.grantAircraftOwnership);

export default router;
