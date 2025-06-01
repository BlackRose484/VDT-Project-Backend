import mongoose from "mongoose";
import { BookingType } from "./types";

// Define the Booking schema
const bookingSchema = new mongoose.Schema<BookingType>({
  user_id: { type: String, required: true }, // The ID of the user who made the booking, required field
  flight_id: { type: String, required: true }, // The ID of the flight associated with the booking, required field
  busi_tickets: { type: Number, required: true }, // Number of business class tickets in the booking, required field
  eco_tickets: { type: Number, required: true }, // Number of economy class tickets in the booking, required field
  booking_date: { type: Date, required: true }, // The date when the booking was made, required field
  status: {
    type: String,
    enum: ["Delayed", "Confirmed", "Cancelled"], // Enum to define possible booking statuses, required field
    required: true,
  },
  total_amount: { type: Number, required: true }, // The total amount for the booking, required field
  cancellation_deadline: { type: Date, required: true }, // The deadline by which the booking can be cancelled, required field
  type: { type: String }, // Type of booking, can be empty (optional field)
});

// Create and export the Booking model based on the schema
const Booking = mongoose.model<BookingType>("Booking", bookingSchema);
export default Booking;
