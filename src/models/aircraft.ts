import mongoose from "mongoose";
import { AircraftType } from "./types";

// Define the Aircraft schema 
const AircraftSchema = new mongoose.Schema<AircraftType>({
  user_id: { type: String, required: true }, // The ID of the user who owns the aircraft, required field
  name: { type: String }, // Optional name of the aircraft
  code: { type: String, required: true, unique: true }, // Unique code for the aircraft, required field
  manufacturer: { type: String, required: true }, // The manufacturer of the aircraft, required field
  manufactured_year: { type: Number, required: true }, // Year the aircraft was manufactured, required field
  model: { type: String, required: true }, // Model of the aircraft, required field
  nums_seat: { type: Number, required: true }, // Number of seats in the aircraft, required field
  total_revenue: { type: Number, default: 0, immutable: true }, // Total revenue from the aircraft, default to 0, cannot be modified
  last_updated: { type: Date, default: Date.now }, // Timestamp of the last update, default to the current date and time
});

// Create and export the Aircraft model based on the schema
const Aircraft = mongoose.model<AircraftType>("Aircraft", AircraftSchema);
export default Aircraft;
