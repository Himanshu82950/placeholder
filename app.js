// Import required modules
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const fileupload = require("express-fileupload");
const dotenv = require("dotenv");


// Import routes
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

// Create Express app and HTTP server
var app = express();
const http = require("http").Server(app);
let io = require("socket.io")(http);

// Configure app

app.use(fileupload());
dotenv.config();

// Set port
const port = 9000;

// Set up view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Set up routes
app.use("/", indexRouter);
app.use("/users", usersRouter);


// Handle 404 errors
app.use(function (req, res, next) {
  next(createError(404));
});

// Set up socket.io
require("./sockets/socket")(io);
// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

// Start server
http.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
