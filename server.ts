import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5000;
const { DB_URL } = process.env;

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// MongoDB connection
mongoose
  .connect(`${DB_URL}`)
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.error("Database connection error:", err));

// Route handlers
app.use("/profile", require("./controllers/users"));
app.use("/habit", require("./controllers/habits"));
app.use("/challenge", require("./controllers/challenges"));
app.use("/badge", require("./controllers/badges"));
app.use("/quote", require("./controllers/quotes"));

// Start the server
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
