
const express = require("express");
const router = express.Router();

const Seat = require("../models/Seat");

// Get all 70 library seats
router.get("/", async (req, res) => {
    try {
        const seats = await Seat.find()
            .select("seatNumber status")
            .sort({ seatNumber: 1 });

        res.status(200).json({
            success: true,
            totalSeats: seats.length,
            seats
        });

    } catch (error) {
        console.error("Fetch Seats Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch library seats."
        });
    }
});

// Get only available seats
router.get("/available", async (req, res) => {
    try {
        const seats = await Seat.find({
            status: "Available"
        })
        .select("seatNumber status")
        .sort({ seatNumber: 1 });

        res.status(200).json({
            success: true,
            totalAvailable: seats.length,
            seats
        });

    } catch (error) {
        console.error("Available Seats Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch available seats."
        });
    }
});

module.exports = router;
