import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user_id: string; // Add user_id to the request object
      role: string; // Add role to the request object
    }
  }
}

// Middleware to verify the JWT token in the request headers
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "") || ""; // Extract the token from the authorization header
  if (!token) {
    res.status(401).json({ message: "unauthorized" });
  }

  try {
    // Verify the token using the JWT secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    req.user_id = (decoded as JwtPayload).user_id;
    req.role = (decoded as JwtPayload).role;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to verify if the user has an "Admin" role
const verifyRole = (req: Request, res: Response, next: NextFunction) => {
  if (req.role === "Admin") {
    next(); // If the user is an admin, proceed to the next middleware or route handler
  } else {
    res.status(401).json({ message: "You are not admin" });
  }
};

export { verifyToken, verifyRole };
