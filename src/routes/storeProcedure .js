const controller = require("../controller/storeProcedure ");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/invoicePosting",auth.verifyToken ,controller.invoicePosting);
router.post("/gettingTaxDetails",auth.verifyToken,controller.gettingTaxDetails);
router.post("/gettingTaxDetailsQuotation",auth.verifyToken,controller.gettingTaxDetailsQuotation);
router.post("/gettingTdsDetails",auth.verifyToken,controller.gettingTdsDetails);
router.post("/getJobDetails",auth.verifyToken,controller.getJobChargeDetails);
router.post("/getblChargeDetails",auth.verifyToken,controller.getBlChargeDetails);
router.post("/balanceSheet",auth.verifyToken,controller.BlanceSheetSp);




module.exports=router