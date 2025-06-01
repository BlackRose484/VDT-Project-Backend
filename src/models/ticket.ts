import mongoose from "mongoose";
import { TicketType } from "./types";

// Define the Ticket schema 
const ticketSchema = new mongoose.Schema<TicketType>({
  booking_id: { type: String }, // The ID of the associated booking (optional field)
  seat_id: { type: String }, // The ID of the seat assigned to the ticket (optional field)
  dob: { type: Date }, // The date of birth of the ticket holder (optional field)
  name: { type: String }, // The name of the ticket holder (optional field)
  nationality: { type: String }, // The nationality of the ticket holder (optional field)
  email: { type: String }, // The email address of the ticket holder (optional field)
  phone: { type: String }, // The phone number of the ticket holder (optional field)
  passport: { type: String }, // The passport number of the ticket holder (optional field)
  price: { type: Number }, // The price of the ticket (optional field)
});

// Create and export the Ticket model based on the schema
const Ticket = mongoose.model<TicketType>("Ticket", ticketSchema);
export default Ticket;
