const express = require('express');
const router = express.Router();
const controller = require('../controller/eInvoicingCon.js');
const auth = require('../config/auth');

router.post('/generateIRN',auth.verifyToken,controller.generateIRN)
router.post('/eInvoicingGSTHero',auth.verifyToken,controller.eInvoicingGSTHero)

module.exports=router