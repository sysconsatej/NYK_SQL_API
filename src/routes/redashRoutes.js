const express = require('express')
const router = express.Router()
const controller = require('../controller/redashController');


router.post('/runquery', controller.generateRedashChart)


module.exports = router;