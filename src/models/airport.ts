import mongoose from "mongoose";

// Define the Airport schema 
const airportSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Unique code for the airport, required field
  name: { type: String, required: true }, // Name of the airport, required field
  city: { type: String, required: true }, // City where the airport is located, required field
  country: { type: String, required: true }, // Country where the airport is located, required field
  timezone: { type: String, required: true } // Timezone of the airport, required field
});

// Create and export the Airport model based on the schema
const Airport = mongoose.model("Airport", airportSchema);
export default Airport;
