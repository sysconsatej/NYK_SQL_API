const express = require("express");
const router = express.Router();
const excelController = require("../controller/validations/excelValidation");
const formControlController = require("../controller/validations/formControlValidation");

// Define your route handler
router.post(
  "/excelValidation/checkExistingData",
  excelController.checkExistingData
);
router.post("/excelValidation/checkFieldName", excelController.checkFieldName);
router.post("/excelValidation/checkValueSize", excelController.checkValueSize);
router.post(
  "/formControlValidation/fetchData",
  formControlController.fetchData
);
router.post(
  "/formControlValidation/fetchProjectedData",
  formControlController.fetchProjectedData
);
//validations/formControlValidation/fetchData
router.post(
  "/formControlValidation/updateActiveInactive",
  formControlController.updateActiveInactive
);
router.post(
  "/formControlValidation/UpdateData",
  formControlController.UpdateData
);
router.post(
  "/formControlValidation/fetchAPIData",
  formControlController.fetchAPIData
);
router.post(
  "/formControlValidation/checkDuplicate",
  formControlController.checkDuplicateData
);
router.post(
  "/formControlValidation/fetchCharge",
  formControlController.fetchCharge
);

module.exports = router;
