const express = require('express');
const router = express.Router();
const controller = require('../controllerSQL/menuController')
const auth = require('../config/auth')

router.post('/list', auth.verifyToken, controller.getMenuList)



module.exports = router