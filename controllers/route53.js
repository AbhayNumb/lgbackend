const AWS = require("aws-sdk");
const { validationResult } = require("express-validator");
const catchAsyncError = require("../middlewares/catchasync");

const credentials = new AWS.Credentials({
  accessKeyId: process.env.AWSACCESSKEY,
  secretAccessKey: process.env.AWSSECRETKEY,
});
AWS.config.update({
  credentials: credentials,
  region: process.env.REGION, // e.g., 'us-east-1'
});
const route53 = new AWS.Route53();

async function listHostedZones() {
  try {
    const data = await route53.listHostedZones().promise();
    const hostedZones = data.HostedZones;

    const hostedZonesWithDetails = await Promise.all(
      hostedZones.map(async (zone) => {
        var params = {
          HostedZoneId: zone.Id /* required */,
        };
        const dnssecData = await route53.getDNSSEC(params).promise();
        const dnssecStatus = dnssecData.Status?.ServeSignature;
        return { ...zone, dnssecStatus };
      })
    );

    return hostedZonesWithDetails;
  } catch (err) {
    // Handle errors
    throw new Error(`Error listing hosted zones: ${err.message}`);
  }
}

// Function to list DNS records in a hosted zone
async function listDNSRecords(hostedZoneId) {
  const params = {
    HostedZoneId: hostedZoneId,
  };

  try {
    const data = await route53.listResourceRecordSets(params).promise();
    return data.ResourceRecordSets.map((record) => ({
      ...record,
      hostedZoneId,
    }));
  } catch (err) {
    throw new Error(
      `Error listing DNS records for hosted zone ${hostedZoneId}: ${err.message}`
    );
  }
}

// Route handler to get data
exports.getData = catchAsyncError(async (req, res, next) => {
  try {
    // Retrieve hosted zones
    const hostedZones = await listHostedZones();

    // Fetch DNS records for each hosted zone
    const allDNSRecordsWithDNSSEC = await Promise.all(
      hostedZones.map(async (zone) => {
        const dnsRecords = await listDNSRecords(zone.Id);
        return { dnsRecords, dnssecStatus: zone.dnssecStatus };
      })
    );

    // Loop over each set of DNS records and set the DNSSECSTATUS field
    allDNSRecordsWithDNSSEC.forEach((recordSet) => {
      recordSet.dnsRecords.forEach((record) => {
        record.DNSSECSTATUS = recordSet.dnssecStatus;
      });
    });

    // Flatten the array of DNS records
    const flattenedDNSRecords = allDNSRecordsWithDNSSEC.flatMap(
      (recordSet) => recordSet.dnsRecords
    );

    res.status(200).json({ success: true, data: flattenedDNSRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.addDNSRecord = catchAsyncError(async (req, res, next) => {
  try {
    const { hostedZoneId, recordName, recordType, recordValue, ttl } = req.body;

    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "CREATE",
            ResourceRecordSet: {
              Name: recordName,
              Type: recordType,
              TTL: ttl, // Time to Live (in seconds)
              ResourceRecords: recordValue,
            },
          },
        ],
      },
    };

    const data = await route53.changeResourceRecordSets(params).promise();
    res
      .status(200)
      .json({ success: true, message: "DNS record added successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to edit DNS record
exports.editDNSRecord = catchAsyncError(async (req, res, next) => {
  try {
    const { hostedZoneId, recordName, recordType, recordValue, ttl } = req.body;

    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: recordName,
              Type: recordType,
              TTL: ttl,
              ResourceRecords: recordValue,
            },
          },
        ],
      },
    };

    const data = await route53.changeResourceRecordSets(params).promise();
    res
      .status(200)
      .json({ success: true, message: "DNS record edited successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to delete DNS record
exports.deleteDNSRecord = catchAsyncError(async (req, res, next) => {
  try {
    const { hostedZoneId, recordName, recordType, recordValue, ttl } = req.body;

    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE",
            ResourceRecordSet: {
              Name: recordName,
              Type: recordType,
              TTL: ttl, // Time to Live (in seconds)
              ResourceRecords: recordValue,
            },
          },
        ],
      },
    };

    const data = await route53.changeResourceRecordSets(params).promise();
    res.status(200).json({
      success: true,
      message: "DNS record deleted successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to delete DNS record
exports.enableDNSSEC = catchAsyncError(async (req, res, next) => {
  try {
    const { hostedZoneId } = req.body;

    const params = {
      HostedZoneId: hostedZoneId,
    };

    route53.enableHostedZoneDNSSEC(params, function (err, data) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(200).json({
          success: true,
          message: "DNSSEC enabled successfully",
          data,
        });
      }
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, message: error.message });
  }
});
exports.disableDNSSEC = catchAsyncError(async (req, res, next) => {
  try {
    const { hostedZoneId } = req.body;

    const params = {
      HostedZoneId: hostedZoneId,
    };

    route53.disableHostedZoneDNSSEC(params, function (err, data) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(200).json({
          success: true,
          message: "DNSSEC disabled successfully",
          data,
        });
      }
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, message: error.message });
  }
});
exports.processUploadedFile = async (req, res, next) => {
  try {
    let data = req.files.file.data.toString("utf8");
    const arr = JSON.parse(data);

    for (let val in arr) {
      const params = {
        HostedZoneId: arr[val].hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: "CREATE",
              ResourceRecordSet: {
                Name: arr[val].recordName,
                Type: arr[val].recordType,
                TTL: arr[val].ttl, // Time to Live (in seconds)
                ResourceRecords: arr[val].recordValue,
              },
            },
          ],
        },
      };

      const data = await route53.changeResourceRecordSets(params).promise();
    }
    res.status(200).json({ success: true, message: "Created Successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Some error occured" });
  }
};
exports.getHi = catchAsyncError(async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: "Hi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
