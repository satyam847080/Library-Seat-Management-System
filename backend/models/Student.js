
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            match: /^[6-9][0-9]{9}$/
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: ""
        },

        course: {
            type: String,
            required: true,
            trim: true
        },

        guardianName: {
            type: String,
            required: true,
            trim: true
        },

        joiningDate: {
            type: Date,
            required: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        requestedSeat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seat",
            required: true
        },

        isConfirmed: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Rejected"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);
