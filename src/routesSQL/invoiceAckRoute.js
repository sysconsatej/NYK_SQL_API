
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/invoiceAckController')
const auth = require('../config/auth')

router.post('/getInvoiceAckData',  controller.getInvoiceAckData)



module.exports = router