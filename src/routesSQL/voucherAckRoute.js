
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/voucherController')
const auth = require('../config/auth')

router.post('/getVoucherData', controller.getVoucherData)



module.exports = router