import mongoose from "mongoose";

// Define the Seat schema
const seatSchema = new mongoose.Schema({
    flight_id: { type: String, required: true }, // The ID of the flight associated with the seat, required field
    seat_number: { type: String, required: true }, // The seat number, required field
    seat_class: { type: String, required: true }, // The class of the seat (e.g., business, economy), required field
    is_available: { type: Boolean, required: true }, // Whether the seat is available for booking, required field
});

// Create and export the Seat model based on the schema
const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
