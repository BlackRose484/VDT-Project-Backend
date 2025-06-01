import { Request, Response } from "express";
import Flight from "../models/flight";
import Seat from "../models/seat";
import Booking from "../models/booking";
import Ticket from "../models/ticket";

const myBookingController = {
  getMyBookings: async (req: Request, res: Response) => {
    try {
      const { user_id } = req;
      const result = [];

      const bookings = await Booking.find({ user_id }).sort({
        booking_date: -1,
      });
      if (!bookings) {
        res.status(404).json({ message: "No bookings found for this user" });
        return;
      }

      for (let i = 0; i < bookings.length; i++) {
        const flight = await Flight.findById(bookings[i].flight_id).sort({
          actual_departure: -1,
        });
        result.push({ booking: bookings[i], flight });
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving bookings" });
    }
  },

  getBookingById: async (req: Request, res: Response) => {
    try {
      const { user_id } = req;
      const { booking_id } = req.params;

      const booking = await Booking.findOne({ _id: booking_id, user_id });
      if (!booking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving booking" });
    }
  },

  cancelBooking: async (req: Request, res: Response) => {
    try {
      const { user_id } = req;
      const { booking_id } = req.params;

      // Find the booking that matches the user and booking ID
      const booking = await Booking.findOne({ _id: booking_id, user_id });
      if (!booking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }

      const currentDate = new Date();
      // Check if the cancellation deadline has passed
      if (currentDate > booking.cancellation_deadline) {
        res.status(400).json({ message: "Cancellation deadline has passed" });
        return;
      }

      booking.status = "Cancelled"; // Mark booking as cancelled
      await booking.save();

      // Find tickets associated with the booking
      const tickets = await Ticket.find({ booking_id });

      const seatIds = tickets.map((ticket) => ticket.seat_id);

      // Update seat availability to true (available)
      await Seat.updateMany({ _id: { $in: seatIds } }, { is_available: true });

      // // Delete the tickets for the cancelled booking
      await Ticket.deleteMany({ booking_id });

      // Find the flight associated with the booking
      const flight = await Flight.findById(booking.flight_id);
      if (flight) {
        // Update flight revenue and seat availability
        const newRevenue = flight.revenue - booking.total_amount;
        await Flight.updateOne(
          { _id: booking.flight_id },
          {
            total_revenue: newRevenue,
            nums_busi_seat_avail:
              flight.nums_busi_seat_avail + booking.busi_tickets,
            nums_eco_seat_avail:
              flight.nums_eco_seat_avail + booking.eco_tickets,
          }
        );
      }

      res.status(200).json({ message: "Booking successfully cancelled" });
    } catch (error) {
      res.status(500).json({ message: "Error cancelling booking" });
    }
  },

  getTickets: async (req: Request, res: Response) => {
    try {
      const { booking_id } = req.body;
      const tickets = await Ticket.find({ booking_id });
      if (!tickets) {
        res.status(404).json({ message: "No tickets found for this booking" });
        return;
      }
      res.status(200).json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving tickets" });
    }
  },
};

export default myBookingController;
