
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

async function createOrUpdateAdmin() {
    try {
        await connectDB();

        const name = process.env.OWNER_NAME;
        const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
        const password = process.env.OWNER_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Owner details missing in .env");
        }

        if (email === "your-email@gmail.com") {
            throw new Error("Please enter your actual owner email in .env");
        }

        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Create new owner or update existing owner
        const admin = await Admin.findOneAndUpdate(
            { email },
            {
                $set: {
                    name: name.trim(),
                    email,
                    passwordHash
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // Remove the earlier example account
        await Admin.deleteOne({
            email: "your-email@gmail.com"
        });

        console.log("--------------------------------");
        console.log("OWNER ACCOUNT READY!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Password: Securely hashed");
        console.log("--------------------------------");

    } catch (error) {
        console.error("Owner Setup Failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

createOrUpdateAdmin();
