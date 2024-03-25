require("dotenv").config();
const connectDatabase = require("./config/database");
const app = require("./app");
const connectAWS = require("./config/awsconfig");

process.on("uncaughtException", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting Down the server due to uncaught Exception`);
  process.exit(1);
});
connectDatabase();
// dotenv.config({ path: "backend/config/config.env" });
console.log(process.env.JWT_EXPIRE);
console.log(process.env.REGION);
connectAWS(
  process.env.AWSACCESSKEY,
  process.env.AWSSECRETKEY,
  process.env.REGION
);
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

//unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting Down the server due to unhandled Promise Rejcetion`);
  server.close(() => {
    process.exit(1);
  });
});
