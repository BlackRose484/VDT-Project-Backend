import { Request, Response } from "express";
import User from "../models/user";
import Aircraft from "../models/aircraft";

const RbacController = {
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const excludeUserId = req.user_id;
      const users = await User.find({ _id: { $ne: excludeUserId } })
        .select("-password")
        .select("-nums_booking_changed");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  },

  getUserById: async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id)
        .select("-password")
        .select("-nums_booking_changed");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  },
  updateUserRole: async (req: Request, res: Response) => {
    const { role } = req.body;
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      )
        .select("-password")
        .select("-nums_booking_changed");
      if (role == "Customer") {
        const data = await Aircraft.updateMany(
          { user_id: req.params.id },
          { $set: { user_id: req.user_id } }
        );
      }
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error updating user role", error });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  },

  getCurrentUserProfile: async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.user_id).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user profile", error });
    }
  },

  getUsersByRole: async (req: Request, res: Response) => {
    const { role } = req.params;
    try {
      const users = await User.find({ role })
        .select("-password")
        .select("-nums_booking_changed");
      if (users.length === 0) {
        res.status(404).json({ message: "No users found with this role" });
        return;
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users by role", error });
    }
  },

  getAirCraftsByUserId: async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
      const aircarfts = await Aircraft.find({ user_id: userId });
      res.json(aircarfts);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching user's aircrafts", error });
    }
  },

  revokeAircraftOwnership: async (req: Request, res: Response) => {
    const aircraftId = req.params.id;
    const userId = req.user_id;
    try {
      const aircraft = await Aircraft.findByIdAndUpdate(
        aircraftId,
        { user_id: userId },
        { new: true }
      );
      if (!aircraft) {
        res.status(404).json({ message: "Aircraft not found" });
        return;
      }
      res.json({ message: "Ownership revoked successfully", aircraft });
    } catch (error) {
      res.status(500).json({ message: "Error revoking ownership", error });
    }
  },

  getAllAircraftsExID: async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
      const aircrafts = await Aircraft.find({ user_id: { $ne: userId } });
      res.json(aircrafts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching aircrafts", error });
    }
  },

  grantAircraftOwnership: async (req: Request, res: Response) => {
    const { userId, aircraftId } = req.body;
    try {
      const aircraft = await Aircraft.findByIdAndUpdate(
        aircraftId,
        { user_id: userId },
        { new: true }
      );
      if (!aircraft) {
        res.status(404).json({ message: "Aircraft not found" });
        return;
      }
      res.json({ message: "Ownership granted successfully", aircraft });
    } catch (error) {
      res.status(500).json({ message: "Error granting ownership", error });
    }
  },
};

export default RbacController;
