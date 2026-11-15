
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./db");
const Seat = require("../models/Seat");

const TOTAL_SEATS = 70;

const seedSeats = async () => {
    try {
        // Connect MongoDB
        await connectDB();

        console.log("Creating 70 library seats...");

        const operations = [];

        for (let i = 1; i <= TOTAL_SEATS; i++) {

            const seatNumber = `Seat ${String(i).padStart(2, "0")}`;

            operations.push({
                updateOne: {
                    filter: { seatNumber },
                    update: {
                        $setOnInsert: {
                            seatNumber,
                            status: "Available",
                            student: null,
                            confirmedAt: null
                        }
                    },
                    upsert: true
                }
            });
        }

        // Create only missing seats
        await Seat.bulkWrite(operations);

        const total = await Seat.countDocuments();
        const available = await Seat.countDocuments({
            status: "Available"
        });
        const confirmed = await Seat.countDocuments({
            status: "Confirmed"
        });

        console.log("--------------------------------");
        console.log("Library Seats Initialized!");
        console.log("Total Seats:", total);
        console.log("Available Seats:", available);
        console.log("Confirmed Seats:", confirmed);
        console.log("--------------------------------");

    } catch (error) {
        console.error("Seat Initialization Error:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
        console.log("MongoDB Disconnected.");
    }
};

seedSeats();
