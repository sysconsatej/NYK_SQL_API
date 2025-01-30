
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/voucherAckController')
const auth = require('../config/auth')

router.post('/getVoucherAckData', controller.getVoucherAckData)



module.exports = router