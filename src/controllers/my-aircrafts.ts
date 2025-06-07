import Aircraft from "../models/aircraft";
import { AircraftType } from "../models/types";
import { Request, Response } from "express";
import Flight from "../models/flight";
import Seat from "../models/seat";
import { SeatType } from "../models/types";
import User from "../models/user";
import Booking from "../models/booking";
import Airport from "../models/airport";
import Ticket from "../models/ticket";
import { sendEmail } from "../utils/email";
import moment from "moment";

const myAircraftController = {
  addAircraft: async (req: Request, res: Response) => {
    try {
      const newAircraft: AircraftType = req.body;

      newAircraft.last_updated = new Date();

      // Check if aircraft with the same name already exists for the user
      const existingAircraft = await Aircraft.findOne({
        code: newAircraft.code,
      });

      if (existingAircraft) {
        res.status(400).json({
          message: "Aircraft with this code already exists for this user",
        });
        return;
      }
      newAircraft.user_id = req.user_id;

      const aircraft = new Aircraft(newAircraft);
      await aircraft.save();

      res.status(201).send(aircraft);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: (e as Error).message });
    }
  },

  getAircrafts: async (req: Request, res: Response) => {
    try {
      const aircrafts = await Aircraft.find({ user_id: req.user_id });
      res.send(aircrafts);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Error fetching aircrafts" });
    }
  },

  getAircraftById: async (req: Request, res: Response) => {
    const aircraft_id = req.params.aircraft_id.toString();
    try {
      const aircraft = await Aircraft.findOne({
        _id: aircraft_id,
        user_id: req.user_id,
      });
      res.send(aircraft);
    } catch (error) {
      res.status(500).json({ message: "Error fetching aircrafts" });
    }
  },

  updateAircraft: async (req: Request, res: Response) => {
    try {
      const { aircraft_id } = req.params;
      const updatedData = req.body;
      updatedData.last_updated = new Date();

      const aircraft = await Aircraft.findById(aircraft_id);
      if (!aircraft) {
        res.status(404).json({ message: "Aircraft not found" });
        return;
      }

      const originalSeats = aircraft.nums_seat;

      const seatChange = updatedData.nums_seat - originalSeats;
      if (seatChange !== 0) {
        await updateAircraftSeats(aircraft_id, seatChange);
      }

      const updatedAircraft = await Aircraft.findOneAndUpdate(
        { _id: aircraft_id, user_id: req.user_id },
        updatedData,
        { new: true }
      );

      res.status(200).json(updatedAircraft);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  deleteAircraft: async (req: Request, res: Response) => {
    const aircraft_id = req.params.aircraft_id.toString();
    try {
      const aircraft = await Aircraft.findOneAndDelete({
        _id: aircraft_id,
        user_id: req.user_id,
      });

      if (!aircraft) {
        res.status(404).json({ message: "Aircraft not found" });
        return;
      }

      const flights = await Flight.find({ aircraft_id: aircraft._id });
      for (const flight of flights) {
        await Seat.deleteMany({ flight_id: flight._id });

        const bookings = await Booking.find({ flight_id: flight._id });
        await Ticket.deleteMany({
          booking_id: { $in: bookings.map((b) => b._id) },
        });
        await Booking.deleteMany({ flight_id: flight._id });
      }
      await Aircraft.deleteOne({ _id: aircraft._id });

      res.status(200).json({ message: "Aircraft removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing Aircraft" });
    }
  },

  addFlight: async (req: Request, res: Response) => {
    const aircraft_id = req.params.aircraft_id.toString();
    try {
      const aircraft = await Aircraft.findOne({
        _id: aircraft_id,
        user_id: req.user_id,
      });

      if (!aircraft) {
        res.status(404).json({ message: "Aircraft not found" });
        return;
      }

      const newFlight = new Flight({
        ...req.body,
        aircraft_id,
      });

      newFlight.actual_departure = newFlight.scheduled_departure;
      newFlight.actual_arrival = newFlight.scheduled_arrival;
      await newFlight.save();

      const seats = [];
      for (
        let i = 0;
        i < newFlight.nums_busi_seat_avail + newFlight.nums_eco_seat_avail;
        i++
      ) {
        seats.push({
          flight_id: newFlight._id,
          seat_number: `S${i + 1}`,
          seat_class:
            i < newFlight.nums_busi_seat_avail ? "Business" : "Economy",
          is_available: true,
        });
      }

      await Seat.insertMany(seats);

      res.status(201).json({
        message: "Flight and seats created successfully",
        flight: newFlight,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },

  getFlights: async (req: Request, res: Response) => {
    try {
      const { aircraft_id } = req.params;
      const flights = await Flight.find({ aircraft_id });
      res.status(200).json(flights);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  updateFlight: async (req: Request, res: Response) => {
    try {
      const { aircraft_id, flight_id } = req.params;
      const { actual_departure, actual_arrival } = req.body;

      const flight = await Flight.findOneAndUpdate(
        { _id: flight_id, aircraft_id },
        { actual_departure, actual_arrival },
        { new: true }
      );

      if (!flight) {
        res.status(404).json({ message: "Flight not found" });
        return;
      }

      const max_deadline = new Date(
        flight.actual_departure.getTime() - 1 * 24 * 60 * 60 * 1000
      );

      const bookings = await Booking.find({ flight_id: flight._id });

      await Booking.updateMany(
        { flight_id: flight._id, status: { $ne: "Cancelled" } },
        { status: "Delayed", cancellation_deadline: max_deadline }
      );

      const userIds = bookings.map((booking) => booking.user_id);

      await User.updateMany(
        { _id: { $in: userIds } },
        { $inc: { nums_booking_changed: 1 } }
      );

      res.status(200).json({ message: "Flight updated successfully", flight });

      const users = await User.find({ _id: { $in: userIds } });
      const emails = users.map((user) => user.email);

      // Thông tin trong email chi tiết hơn
      // Gửi email thông báo cho người dùng

      const depAirport = await Airport.findById(flight.ori_airport);
      const desAirport = await Airport.findById(flight.des_airport);

      const oldDeparture = moment(flight.scheduled_departure).format(
        "HH:mm DD/MM/YYYY"
      );
      const newDeparture = moment(flight.actual_departure).format(
        "HH:mm DD/MM/YYYY"
      );
      const oldArrival = moment(flight.scheduled_arrival).format(
        "HH:mm DD/MM/YYYY"
      );
      const newArrival = moment(flight.actual_arrival).format(
        "HH:mm DD/MM/YYYY"
      );

      const emailContent = `
        Chuyến bay của bạn đã bị thay đổi:

        - Mã chuyến bay: ${flight._id}
        - Từ: ${depAirport?.city || "N/A"} (${depAirport?.name || ""})
        - Đến: ${desAirport?.city || "N/A"} (${desAirport?.name || ""})

        - Thời gian khởi hành cũ: ${oldDeparture} UTC Time
        - Thời gian khởi hành mới: ${newDeparture} UTC Time

        - Thời gian đến dự kiến cũ: ${oldArrival} UTC Time
        - Thời gian đến dự kiến mới: ${newArrival} UTC Time

        Vui lòng kiểm tra lại thông tin trên hệ thống hoặc liên hệ tổng đài để biết thêm chi tiết.
            `;

      if (emails.length > 0) {
        sendEmail(emails, "Thông báo thay đổi chuyến bay", emailContent).catch(
          (err) => console.error("Send email error:", err)
        );
      }
    } catch (error) {
      console.error("Error updating flight:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  async deleteFlight(req: Request, res: Response) {
    try {
      const { aircraft_id, flight_id } = req.params;

      // Find the flight by ID and aircraft ID
      const flight = await Flight.findOneAndDelete({
        _id: flight_id,
        aircraft_id,
      });

      if (!flight) {
        res.status(404).json({ message: "Flight not found" });
        return;
      }

      await Seat.deleteMany({ flight_id: flight._id });
      const bookings = await Booking.find({ flight_id: flight._id });

      await Ticket.deleteMany({
        booking_id: { $in: bookings.map((b) => b._id) },
      });

      await Booking.deleteMany({ flight_id: flight._id });

      res.status(200).json({ message: "Flight deleted successfully" });

      // Notify users about the flight cancellation
      const userIds = bookings.map((booking) => booking.user_id);
      const users = await User.find({ _id: { $in: userIds } });

      const emails = users.map((user) => user.email);
      const depAirport = await Airport.findById(flight.ori_airport);
      const desAirport = await Airport.findById(flight.des_airport);

      const emailContent = `
        Chuyến bay của bạn đã bị hủy:

        - Mã chuyến bay: ${flight._id}
        - Từ: ${depAirport?.city || "N/A"} (${depAirport?.name || ""})
        - Đến: ${desAirport?.city || "N/A"} (${desAirport?.name || ""})

        Vui lòng kiểm tra lại thông tin trên hệ thống hoặc liên hệ tổng đài để biết thêm chi tiết.
      `;

      if (emails.length > 0) {
        sendEmail(emails, "Thông báo hủy chuyến bay", emailContent).catch(
          (err) => console.error("Send email error:", err)
        );
      }
    } catch (error) {
      console.error("Error deleting flight:", error);
      res.status(500).json({ message: "Error deleting flight" });
    }
  },

  getRevenue: async (req: Request, res: Response) => {
    try {
      const aircrafts = await Aircraft.find({ user_id: req.user_id });
      const year = parseInt(req.params.year, 10);

      const monthlyRevenue = Array(12).fill(0);

      await Promise.all(
        aircrafts.map(async (aircraft) => {
          const flights = await Flight.find({ aircraft_id: aircraft._id });
          const filteredFlights = flights.filter((flight) => {
            return new Date(flight.actual_departure).getFullYear() === year;
          });
          filteredFlights.forEach((flight) => {
            const month = new Date(flight.actual_departure).getMonth();
            monthlyRevenue[month] += flight.revenue;
          });
        })
      );
      res.status(200).json(monthlyRevenue);
    } catch (error) {
      console.error("Error getting revenue:", error);
      res.status(500).json({ message: error });
    }
  },
  getPopular: async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        res.status(400).json({ message: "Invalid year provided" });
        return;
      }

      //Find all airports
      const airports = await Airport.find();
      const airportMap = new Map(
        airports.map((airport) => [airport._id.toString(), airport.city])
      );

      // Fetch aircraft data
      const aircrafts = await Aircraft.find();
      const aircraftMap = new Map(
        aircrafts.map((aircraft) => [
          aircraft._id.toString(),
          aircraft.nums_seat,
        ])
      );

      //Find all flights in the given year
      let flights = await Flight.find();
      flights = flights.filter(
        (flight) => flight.actual_departure.getFullYear() === year
      );

      //
      const result: [string, number][][] = Array(12)
        .fill(null)
        .map(() => []); // Initialize result for 12 months

      // Process each month
      for (let month = 0; month < 12; month++) {
        // Filter flights by month
        const monthlyFlights = flights.filter((flight) => {
          const flightDate = new Date(flight.actual_departure);
          return flightDate.getMonth() === month; // Match month (0-11)
        });

        // Map to store destination and booking count
        const destinationMap = new Map<string, number>();

        // Process each flight in the month
        monthlyFlights.forEach((flight) => {
          const nums_seat = aircraftMap.get(flight.aircraft_id.toString()) || 0;
          const bookedSeats =
            nums_seat -
            (flight.nums_busi_seat_avail + flight.nums_eco_seat_avail);

          // Update booking count for the destination
          const destination = airportMap.get(flight.des_airport);
          if (destination) {
            const currentCount = destinationMap.get(destination) || 0;
            destinationMap.set(destination, currentCount + bookedSeats);
          }
        });

        // Sort and get top 3 destinations
        const topDestinations = Array.from(destinationMap.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by booking count (desc)
          .slice(0, 3); // Take top 3

        // Add to result
        result[month] = topDestinations;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getAllTicketsByFlightId(req: Request, res: Response) {
    try {
      if (!req.params.flight_id) {
        res.status(400).json({ message: "Flight ID is required" });
        return;
      }
      // Extract flight_id from request parameters
      const { flight_id } = req.params;

      // Find the flight by ID
      const flight = await Flight.findById(flight_id);
      if (!flight) {
        res.status(404).json({ message: "Flight not found" });
        return;
      }

      let nums_busi = 0;
      let nums_eco = 0;

      const bookings = (
        await Booking.find({ flight_id: flight_id.toString() })
      ).map((booking) => {
        if (booking.status !== "Cancelled") {
          nums_busi += booking.busi_tickets;
          nums_eco += booking.eco_tickets;
          return booking._id;
        }
      });

      const tickets = await Ticket.find({
        booking_id: { $in: bookings },
      });

      tickets.sort((a, b) => b.price - a.price);

      res.status(200).json({ nums_busi, nums_eco, tickets });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving tickets" });
    }
  },
};

async function updateAircraftSeats(aircraftId: string, seatChange: number) {
  // Fetch all flights associated with the specified aircraft
  const flights = await Flight.find({ aircraft_id: aircraftId });

  for (const flight of flights) {
    const seatsToAdd: Partial<SeatType>[] = [];
    const currentSeatCount =
      flight.nums_busi_seat_avail + flight.nums_eco_seat_avail;

    // Calculate the number of new business and economy seats
    const numNewBusinessSeats = Math.floor(Math.abs(seatChange) * 0.25);
    const numNewEconomySeats = Math.abs(seatChange) - numNewBusinessSeats;

    if (seatChange > 0) {
      // If seatChange is positive, add new seats
      for (let i = 0; i < numNewBusinessSeats; i++) {
        seatsToAdd.push({
          flight_id: flight._id,
          seat_number: `B${currentSeatCount + i + 1}`,
          seat_class: "Business",
          is_available: true,
        });
      }

      for (let i = 0; i < numNewEconomySeats; i++) {
        seatsToAdd.push({
          flight_id: flight._id,
          seat_number: `E${currentSeatCount + numNewBusinessSeats + i + 1}`,
          seat_class: "Economy",
          is_available: true,
        });
      }

      // Insert new seats into the database
      await Seat.insertMany(seatsToAdd);

      // Update the flight's available seat counts
      flight.nums_busi_seat_avail += numNewBusinessSeats;
      flight.nums_eco_seat_avail += numNewEconomySeats;
    } else {
      // If seatChange is negative, remove available seats

      // Find available business seats to remove
      const businessSeatsToRemove = await Seat.find({
        flight_id: flight._id,
        seat_class: "Business",
        is_available: true,
      })
        .limit(numNewBusinessSeats)
        .select("_id");

      // Find available economy seats to remove
      const economySeatsToRemove = await Seat.find({
        flight_id: flight._id,
        seat_class: "Economy",
        is_available: true,
      })
        .limit(numNewEconomySeats)
        .select("_id");

      // Combine seat IDs to remove
      const seatsToRemove = [...businessSeatsToRemove, ...economySeatsToRemove];
      const seatIdsToRemove = seatsToRemove.map((seat) => seat._id);

      // Remove the identified seats from the database
      await Seat.deleteMany({ _id: { $in: seatIdsToRemove } });

      // Update the flight's available seat counts
      flight.nums_busi_seat_avail -= businessSeatsToRemove.length;
      flight.nums_eco_seat_avail -= economySeatsToRemove.length;
    }

    // Save the updated flight details
    await flight.save();
  }
}

export default myAircraftController;
