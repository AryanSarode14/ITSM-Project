// db.js
const { Pool } = require("pg");
const dotenv = require("dotenv");
const config = require("./config.json");
// const config = require('../db/config.json')

// Initialize dotenv to use environment variables if needed
dotenv.config();

const connectionOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

// Server
const pool = new Pool({
  connectionString: config.DATABASE_URL1,
});

pool.on("connect", () => {
  console.log("Connected to the database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Database connection successful");
  }
  // Release the client back to the pool
  done();
});

module.exports = pool;
