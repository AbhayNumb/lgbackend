const express = require("express");
const {
  getData,
  addDNSRecord,
  deleteDNSRecord,
  editDNSRecord,
  enableDNSSEC,
  disableDNSSEC,
  processUploadedFile,
  getHi,
} = require("../controllers/route53");
const router = express.Router();
const { isAuthenticatedUser, authorizedRoles } = require("../middlewares/auth");
router.route("/hi").get(getHi);
router
  .route("/getData")
  .get(isAuthenticatedUser, authorizedRoles("admin"), getData);

router
  .route("/handleDNS")
  .post(isAuthenticatedUser, authorizedRoles("admin"), addDNSRecord)
  .delete(isAuthenticatedUser, authorizedRoles("admin"), deleteDNSRecord)
  .put(isAuthenticatedUser, authorizedRoles("admin"), editDNSRecord);
router
  .route("/enableDNSSEC")
  .post(isAuthenticatedUser, authorizedRoles("admin"), enableDNSSEC);

router
  .route("/disableDNSSEC")
  .post(isAuthenticatedUser, authorizedRoles("admin"), disableDNSSEC);

router
  .route("/bulkAdd")
  .post(isAuthenticatedUser, authorizedRoles("admin"), processUploadedFile);

module.exports = router;
