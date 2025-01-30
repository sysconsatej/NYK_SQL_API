const express = require('express');
const router = express.Router();
const controller = require('../controller/yearEndingCon');
const auth = require('../config/auth');


router.post('/yearEnding',auth.verifyToken,controller.secondTry)

module.exports=router