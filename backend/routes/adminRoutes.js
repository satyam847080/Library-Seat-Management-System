
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Seat = require("../models/Seat");

// =====================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =====================================

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login as owner."
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: "Server authentication configuration is missing."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired login session."
        });
    }
};

// =====================================
// OWNER LOGIN API
// =====================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration is missing."
            });
        }

        const admin = await Admin.findOne({
            email: email.trim().toLowerCase()
        }).select("+passwordHash");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                adminId: admin._id,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.status(200).json({
            success: true,
            message: "Owner login successful!",
            token,
            admin: {
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
});

// =====================================
// GET ALL STUDENTS
// =====================================

router.get("/students", authenticateAdmin, async (req, res) => {
    try {
        const students = await Student.find()
            .populate("requestedSeat", "seatNumber status")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalStudents: students.length,
            students
        });

    } catch (error) {
        console.error("Fetch Students Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch students."
        });
    }
});

// =====================================
// GET PENDING REGISTRATION REQUESTS
// =====================================

router.get("/requests", authenticateAdmin, async (req, res) => {
    try {
        const requests = await Student.find({
            isConfirmed: false,
            $or: [
                { status: "Pending" },
                { status: { $exists: false } }
            ]
        })
        .populate("requestedSeat", "seatNumber status")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalRequests: requests.length,
            requests
        });

    } catch (error) {
        console.error("Fetch Requests Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch registration requests."
        });
    }
});

// =====================================
// APPROVE STUDENT REQUEST
// =====================================

router.patch(
    "/students/:id/approve",
    authenticateAdmin,
    async (req, res) => {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const session = await mongoose.startSession();

        try {
            let approvedStudent;

            await session.withTransaction(async () => {

                const student = await Student.findOne({
                    _id: req.params.id,
                    isConfirmed: false,
                    $or: [
                        { status: "Pending" },
                        { status: { $exists: false } }
                    ]
                }).session(session);

                if (!student) {
                    throw new Error("REQUEST_NOT_PENDING");
                }

                const updatedSeat = await Seat.findOneAndUpdate(
                    {
                        _id: student.requestedSeat,
                        $or: [
                            {
                                status: "Pending",
                                student: student._id
                            },
                            {
                                status: "Available",
                                student: null
                            }
                        ]
                    },
                    {
                        $set: {
                            status: "Confirmed",
                            student: student._id,
                            confirmedAt: new Date()
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!updatedSeat) {
                    throw new Error("SEAT_NOT_AVAILABLE");
                }

                student.status = "Confirmed";
                student.isConfirmed = true;

                await student.save({ session });

                approvedStudent = student;
            });

            res.status(200).json({
                success: true,
                message: "Student request approved successfully!",
                studentId: approvedStudent._id
            });

        } catch (error) {
            console.error("Approve Request Error:", error.message);

            const knownErrors = {
                REQUEST_NOT_PENDING: "This request is no longer pending.",
                SEAT_NOT_AVAILABLE: "The requested seat is not available."
            };

            res.status(
                knownErrors[error.message] ? 409 : 500
            ).json({
                success: false,
                message: knownErrors[error.message] ||
                    "Unable to approve student request."
            });

        } finally {
            await session.endSession();
        }
    }
);

// =====================================
// REJECT STUDENT REQUEST
// =====================================

router.patch(
    "/students/:id/reject",
    authenticateAdmin,
    async (req, res) => {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                const student = await Student.findOne({
                    _id: req.params.id,
                    isConfirmed: false,
                    $or: [
                        { status: "Pending" },
                        { status: { $exists: false } }
                    ]
                }).session(session);

                if (!student) {
                    throw new Error("REQUEST_NOT_PENDING");
                }

                const seat = await Seat.findById(
                    student.requestedSeat
                ).session(session);

                if (!seat) {
                    throw new Error("SEAT_NOT_FOUND");
                }

                // Release seat only if it belongs to this request
                if (seat.status === "Pending") {

                    if (
                        seat.student &&
                        seat.student.toString() !== student._id.toString()
                    ) {
                        throw new Error("SEAT_ASSIGNED_TO_OTHER");
                    }

                    await Seat.updateOne(
                        {
                            _id: seat._id,
                            status: "Pending",
                            student: student._id
                        },
                        {
                            $set: {
                                status: "Available",
                                student: null,
                                confirmedAt: null
                            }
                        },
                        { session }
                    );

                } else if (
                    seat.status !== "Available" ||
                    seat.student
                ) {
                    throw new Error("SEAT_NOT_AVAILABLE");
                }

                student.status = "Rejected";
                student.isConfirmed = false;

                await student.save({ session });
            });

            res.status(200).json({
                success: true,
                message: "Student request rejected. Seat released successfully."
            });

        } catch (error) {
            console.error("Reject Request Error:", error.message);

            const knownErrors = {
                REQUEST_NOT_PENDING: "This request is no longer pending.",
                SEAT_NOT_FOUND: "Requested seat was not found.",
                SEAT_ASSIGNED_TO_OTHER: "Seat belongs to another student.",
                SEAT_NOT_AVAILABLE: "Seat cannot be released."
            };

            res.status(
                knownErrors[error.message] ? 409 : 500
            ).json({
                success: false,
                message: knownErrors[error.message] ||
                    "Unable to reject student request."
            });

        } finally {
            await session.endSession();
        }
    }
);

module.exports = router;
