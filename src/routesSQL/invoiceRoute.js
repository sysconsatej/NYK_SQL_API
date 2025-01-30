
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/invoiceController')
const auth = require('../config/auth')

router.post('/getInvoiceData',  controller.getInvoiceData)



module.exports = router