const express = require("express");
require("dotenv").config();
const app = express();
const PORT = 5000;
const mongoose = require("mongoose");
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/morse-master");

app.use("/profile", require("./controllers/users"));
app.use("/habit", require("./controllers/habits"));
app.use("/challenge", require("./controllers/challenges"));
app.use("/badge", require("./controllers/badges"));
app.use("/quote", require("./controllers/quotes"));

mongoose.connection.once("open", () => console.log("Connected to Database"));
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
