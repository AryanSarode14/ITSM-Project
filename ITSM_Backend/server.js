const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const fs = require("fs");
const config = require("./db/config.json");
const db = require("./db/db");
const authRoutes = require("./routes/index");
const cookieParser = require("cookie-parser");
const XLSX = require("xlsx");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;
const IP_ADDRESS = "0.0.0.0"; // Bind to all network interfaces (use specific IP if necessary)

// Middleware
app.use(express.json());
app.use(express.static("files"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(log);

// Custom Middleware
function log(req, res, next) {
  console.log(new Date(), req.method, req.url, req.ip, req.hostname);
  next();
}

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/api", authRoutes);


app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server listening on http://${IP_ADDRESS}:${PORT}`);
});