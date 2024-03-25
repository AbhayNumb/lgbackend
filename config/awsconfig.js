// AWS.config.update({
//   accessKeyId: accesskey,
//   secretAccessKey: secretkey,
//   region: process.env.REGION, // e.g., 'us-east-1'
// });
const AWS = require("aws-sdk");

const connectAWS = (accesskey, secretkey, region) => {
  AWS.config.update({
    accessKeyId: accesskey,
    secretAccessKey: secretkey,
    region: region, // e.g., 'us-east-1'
  });
};
module.exports = connectAWS;
