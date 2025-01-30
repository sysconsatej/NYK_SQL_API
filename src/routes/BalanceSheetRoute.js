const express = require('express');
const router = express.Router();
const auth = require('../config/auth');

const Controller = require('../controller/BalanceSheetController');

router.post('/balanceSheetReport', auth.verifyToken, Controller.BlanceSheetSp);


module.exports = router