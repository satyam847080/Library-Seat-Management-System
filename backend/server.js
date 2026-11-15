const express = require("express");
const cors = require("cors");
const dns = require("dns");

// Google DNS for MongoDB SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const connectDB = require("./config/db");

// Import Routes
const seatRoutes = require("./routes/seatRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/seats", seatRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);

// Home Route
app.get("/", (req, res) => {
    res.send("Library Seat Management System Backend Running!");
});

// Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Library Backend is Working!"
    });
});

// Server Configuration
const PORT = process.env.PORT || 5000;

// Connect Database and Start Server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("Seat API: /api/seats");
            console.log("Student API: /api/students/register");
            console.log("Admin API: /api/admin/login");
        });

    } catch (error) {
        console.error("Server Startup Failed:", error.message);
        process.exit(1);
    }
};

startServer();