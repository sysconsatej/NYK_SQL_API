const express = require("express");
const router = express.Router();
const controller = require("../controller/Reports&spController");
const auth = require("../config/auth");

router.post("/Audit", auth.verifyToken, controller.AuditTrailLog);
router.post("/list", auth.verifyToken, controller.JobRegistration);
router.post("/testlist", auth.verifyToken, controller.JobRegistrationTest);
router.post("/tblRateRequest", auth.verifyToken, controller.RateRequest);
router.post("/tblVoucher", auth.verifyToken, controller.Voucher);
router.post("/tblInvoice", auth.verifyToken, controller.Invoices);
router.get("/blList", auth.verifyToken, controller.BlRegistration);
router.get("/enquiry", auth.verifyToken, controller.Enquiry);
router.post("/tblWhTransaction", auth.verifyToken, controller.WhTransaction);
router.post("/warehouseStock", auth.verifyToken, controller.WarehouseStock);
router.post("/Audit", auth.verifyToken, controller.AuditTrailLog);
router.post(
  "/jobDynamicReport",
  auth.verifyToken,
  controller.JobRegistrationDynamicReport
);
router.post(
  "/testlistDynamicReport",
  auth.verifyToken,
  controller.JobRegistrationTestDynamicReport
);
router.post(
  "/rateRequestDynamicReport",
  auth.verifyToken,
  controller.RateRequestDynamicReport
);
router.post(
  "/voucherDynamicReport",
  auth.verifyToken,
  controller.VoucherDynamicReport
);
router.post(
  "/invoiceDynamicReport",
  auth.verifyToken,
  controller.InvoicesDynamicReport
);
router.get(
  "/blDynamicReport",
  auth.verifyToken,
  controller.BlRegistrationDynamicReport
);
router.get(
  "/enquiryDynamicReport",
  auth.verifyToken,
  controller.EnquiryDynamicReport
);
router.post(
  "/whTransactionDynamicReport",
  auth.verifyToken,
  controller.WhTransactionDynamicReport
);
router.post(
  "/warehouseStockDynamicReport",
  auth.verifyToken,
  controller.WarehouseStockDynamicReport
);
router.post(
  "/vehicleRouteReport",
  auth.verifyToken,
  controller.VehicleRouteReport
);
router.post("/containerPlanner", auth.verifyToken, controller.ContainerPlanner);

module.exports = router;
