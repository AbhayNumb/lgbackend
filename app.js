const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileupload = require("express-fileupload");

//config
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(fileupload());

//Route imports
const user = require("./routes/userroutes");
const route53 = require("./routes/route");
// const order = require("./routes/orderRoute");
// const payment = require("./routes/paymentRoute");
app.use("/api/v1", user);
app.use("/api/v1", route53);
// app.use("/api/v1", order);
// app.use("/api/v1", payment);
//middleware for error

module.exports = app;
