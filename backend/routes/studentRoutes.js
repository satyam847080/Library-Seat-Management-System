
const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Seat = require("../models/Seat");

// =====================================
// STUDENT REGISTRATION API
// =====================================

router.post("/register", async (req, res) => {
    let createdStudent = null;
    let seatClaimed = false;

    try {
        const {
            fullName,
            mobile,
            email,
            course,
            guardianName,
            joiningDate,
            address,
            seatNumber
        } = req.body;

        // Validate required fields
        if (
            !fullName ||
            !mobile ||
            !course ||
            !guardianName ||
            !joiningDate ||
            !address ||
            !seatNumber
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Validate mobile number
        if (!/^[6-9][0-9]{9}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10 digit mobile number."
            });
        }

        // Validate joining date
        const date = new Date(joiningDate);

        if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid joining date."
            });
        }

        // Find selected available seat
        const seat = await Seat.findOne({
            seatNumber: seatNumber,
            status: "Available"
        });

        if (!seat) {
            return res.status(409).json({
                success: false,
                message: "This seat is not available. Please select another seat."
            });
        }

        // Create student registration
        const student = await Student.create({
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            email: email ? email.trim().toLowerCase() : "",
            course: course.trim(),
            guardianName: guardianName.trim(),
            joiningDate: date,
            address: address.trim(),
            requestedSeat: seat._id,
            isConfirmed: false
        });

        createdStudent = student;

        // Atomically reserve the selected seat as Pending
        const updatedSeat = await Seat.findOneAndUpdate(
            {
                _id: seat._id,
                status: "Available"
            },
            {
                $set: {
                    status: "Pending",
                    student: student._id,
                    confirmedAt: null
                }
            },
            {
                new: true
            }
        );

        // If another student already reserved this seat
        if (!updatedSeat) {
            await Student.findByIdAndDelete(student._id);
            createdStudent = null;

            return res.status(409).json({
                success: false,
                message: "This seat has just been booked. Please select another seat."
            });
        }

        seatClaimed = true;

        // Successful registration
        res.status(201).json({
            success: true,
            message: "Registration submitted successfully! Your seat is pending owner approval.",
            student: {
                id: student._id,
                fullName: student.fullName,
                mobile: student.mobile,
                seatNumber: updatedSeat.seatNumber,
                status: "Pending",
                confirmation: false
            }
        });

    } catch (error) {

        console.error("Student Registration Error:", error);

        // Clean up student record if seat reservation failed
        if (createdStudent && !seatClaimed) {
            try {
                await Student.findByIdAndDelete(createdStudent._id);
            } catch (cleanupError) {
                console.error("Student Cleanup Error:", cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: "Student registration failed. Please try again."
        });

    }
});

module.exports = router;
