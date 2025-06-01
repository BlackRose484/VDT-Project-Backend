import Aircraft from "../models/aircraft";
import { Request, Response } from "express";
import Flight from "../models/flight";
import Seat from "../models/seat";
import Booking from "../models/booking";
import Ticket from "../models/ticket";
import Airport from "../models/airport";

const flightController = {
  searchFlights: async (req: Request, res: Response) => {
    try {
      const { ori_airport, des_airport, departure_time, nums_eco, nums_busi } =
        req.body;

      const departureTime = new Date(departure_time);

      // Find flights that match the search criteria (availability of seats)
      const flights = await Flight.find({
        ori_airport,
        des_airport,
        nums_busi_seat_avail: { $gte: nums_busi },
        nums_eco_seat_avail: { $gte: nums_eco },
      });

      if (flights.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Filter flights based on departure date
      const flights_result = flights.filter((flight) => {
        return flight.actual_departure.getDate() == departureTime.getDate();
      });

      res.status(200).json(flights_result);
    } catch (error) {
      res.status(500).json({ message: "Error searching for flights" });
    }
  },

  makeBooking: async (req: Request, res: Response) => {
    try {
      const {
        flight_id,
        tickets,
        busi_tickets,
        eco_tickets,
        discount_code,
        type,
      } = req.body;
      const user_id = req.user_id;

      // Find the flight by ID
      const flight = await Flight.findById(flight_id);
      if (!flight) {
        res.status(404).json({ message: "Flight not found" });
        return;
      }

      // Check for discount code and apply a discount if applicable
      let discount = 1;
      if (discount_code === "QAirLine is the best") {
        discount = 0.9;
      }

      // Find available business class seats
      let businessSeats: any = [];
      if (busi_tickets != 0) {
        businessSeats = await Seat.find({
          flight_id,
          seat_class: "Business",
          is_available: true,
        }).limit(busi_tickets);
      }

      // Find available economy class seats
      let economySeats: any = [];
      if (eco_tickets != 0) {
        economySeats = await Seat.find({
          flight_id,
          seat_class: "Economy",
          is_available: true,
        }).limit(eco_tickets);
      }

      // Check if the requested number of seats is available
      if (
        businessSeats.length < busi_tickets ||
        economySeats.length < eco_tickets
      ) {
        res.status(400).json({ message: "Not enough seats available" });
        return;
      }

      // Calculate the booking cancellation deadline (5 days from booking date)
      const booking_date = new Date();
      let cancellation_deadline = new Date(
        booking_date.getTime() + 5 * 24 * 60 * 60 * 1000
      );

      // Ensure cancellation deadline does not exceed the day before departure
      const max_deadline = new Date(
        flight.actual_departure.getTime() - 1 * 24 * 60 * 60 * 1000
      );
      if (cancellation_deadline > max_deadline) {
        cancellation_deadline = max_deadline;
      }

      let total_amount = 0;
      let seatCounter = 0;

      // Create a new booking entry
      const booking = new Booking({
        user_id,
        flight_id,
        busi_tickets,
        eco_tickets,
        booking_date: new Date(),
        status: "Confirmed",
        cancellation_deadline,
        total_amount,
        type,
      });

      // Book each available business class seat
      for (const seat of businessSeats) {
        const price = flight.base_price * 1.5 * discount;
        seat.is_available = false;
        await seat.save();

        // Create a ticket for the seat and link to the booking
        const passenger = tickets[seatCounter];
        const ticket = new Ticket({
          booking_id: booking._id,
          seat_id: seat._id,
          ...passenger,
          price,
        });
        await ticket.save();

        total_amount += price;
        seatCounter++;
      }

      // Book each available economy class seat
      for (const seat of economySeats) {
        const price = flight.base_price * discount;
        seat.is_available = false;
        await seat.save();

        const passenger = tickets[seatCounter];
        const ticket = new Ticket({
          booking_id: booking._id,
          seat_id: seat._id,
          ...passenger,
          price,
        });
        await ticket.save();

        total_amount += price;
        seatCounter++;
      }

      booking.total_amount = total_amount;

      await booking.save();

      // Update flight revenue and seat availability
      flight.revenue = flight.revenue + booking.total_amount;
      flight.nums_busi_seat_avail -= busi_tickets;
      flight.nums_eco_seat_avail -= eco_tickets;

      await flight.save();

      res
        .status(201)
        .json({ message: "Booking created successfully", booking });
    } catch (error) {
      res.status(500).json({ message: "Error creating booking" });
    }
  },

  getAirports: async (req: Request, res: Response) => {
    const airport_list = await Airport.find();
    res.status(200).json(airport_list);
  },

  getAllFlights: async (req: Request, res: Response) => {
    const flights = await Flight.find();
    res.status(200).json(flights);
  },

  getPopularPlaces: async (req: Request, res: Response) => {
    try {
      const date_now = new Date();
      const date_1_month_ago = new Date(
        date_now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const month_ago = date_1_month_ago.getMonth();
      const year_ago = date_1_month_ago.getFullYear();

      // Create a map of airports and their corresponding cities
      const airports = await Airport.find();
      const airportMap = new Map(
        airports.map((airport) => [airport._id.toString(), airport.city])
      );

      let flights = await Flight.find();
      flights = flights.filter((f) => {
        return (
          // f.actual_departure.getMonth() === month_ago &&
          f.actual_departure.getFullYear() === year_ago
        );
      });

      // Create a map of aircraft and their seating capacity
      const aircrafts = await Aircraft.find();
      const aircraftMap = new Map(
        aircrafts.map((aircraft) => [
          aircraft._id.toString(),
          aircraft.nums_seat,
        ])
      );

      // Calculate the number of booked seats for each destination city
      const placeWithBookedSeat = new Map<string, number>();
      for (const flight of flights) {
        const nums_seat = aircraftMap.get(flight.aircraft_id.toString()) || 0;
        const des_city = airportMap.get(flight.des_airport);

        if (des_city) {
          placeWithBookedSeat.set(
            des_city,
            (placeWithBookedSeat.get(des_city) ?? 0) +
              (nums_seat -
                flight.nums_busi_seat_avail -
                flight.nums_eco_seat_avail)
          );
        }
      }

      const popularPlaces = Array.from(placeWithBookedSeat).sort(
        (a, b) => b[1] - a[1]
      );

      // Find the cheapest price for each destination city
      const cheapestPriceforPlace = new Map<string, number>();
      for (const flight of flights) {
        const des_city = airportMap.get(flight.des_airport);

        if (des_city) {
          const price = flight.base_price;
          if (
            !cheapestPriceforPlace.has(des_city) ||
            (cheapestPriceforPlace.get(des_city) ?? Infinity) > price
          ) {
            cheapestPriceforPlace.set(des_city, price);
          }
        }
      }

      // Create a list of popular places with the number of booked seats and the cheapest price
      const popularPlacesWithPrice = popularPlaces.map((place) => ({
        city: place[0],
        booked_seat: place[1],
        cheapest_price: cheapestPriceforPlace.get(place[0]),
        country: airports.find((airport) => airport.city === place[0])?.country,
      }));

      res.status(200).json(popularPlacesWithPrice.slice(0, 3));
    } catch (error) {
      res.status(500).json({ message: "Error getting popular places" });
    }
  },
};

export default flightController;
