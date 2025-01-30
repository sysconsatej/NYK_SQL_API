// const controller = require("../controller/roleController.js");
const controller = require("../../src/controller/RoleController.js");
const express = require('express');
const router = express.Router();
const auth = require('../config/auth');

router.post('/add',auth.verifyToken,controller.addRole)
router.get('/list',auth.verifyToken,controller.lisRole)






module.exports = router