const mongoose = require("mongoose");
const uri =
  "mongodb+srv://dbuser:abhayishere@cluster0.ckixq0d.mongodb.net/user";

const connectDatabase = () => {
  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`Mongodb connected with server: ${data.connection.host}`);
    });
};
module.exports = connectDatabase;
