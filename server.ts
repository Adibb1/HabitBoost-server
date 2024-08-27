import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const { DB_URL } = process.env;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb://localhost/morse-master");

app.use("/profile", require("./controllers/users"));
app.use("/habit", require("./controllers/habits"));
app.use("/challenge", require("./controllers/challenges"));
app.use("/badge", require("./controllers/badges"));
app.use("/quote", require("./controllers/quotes"));

mongoose.connection.once("open", () => console.log("Connected to Database"));
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
