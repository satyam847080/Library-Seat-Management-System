
const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
    {
        seatNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["Available", "Pending", "Confirmed"],
            default: "Available",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null
        },

        confirmedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Seat", seatSchema);
