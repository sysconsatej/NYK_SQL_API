const controller = require('../controller/NoGenerationController');
const express = require('express');
const router = express.Router();
const auth = require('../config/auth');


router.post('/AddRules',auth.verifyToken, controller.AddRules);
router.post('/GenerateNo',auth.verifyToken, controller.GenerateNumber);

module.exports = router