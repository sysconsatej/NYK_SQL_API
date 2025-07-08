
const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/voucherNewController')
const auth = require('../config/auth')

router.post('/getVoucherDataNew', controller.getVoucherDataNew)



module.exports = router