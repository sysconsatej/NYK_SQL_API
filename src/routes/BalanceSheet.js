const express = require("express");
const router = express.Router();
const balanceSheetController = require("../controller/BalanceSheet");

router.post(
  "/balanceSheetReport",
  balanceSheetController.fetchDataByStoredProcedure
);

module.exports = router;
