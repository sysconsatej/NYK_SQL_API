
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/voucherAckNewController')
const auth = require('../config/auth')

router.post('/getVoucherAckDataNew', controller.getVoucherAckDataNew)



module.exports = router