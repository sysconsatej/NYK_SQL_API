const express = require('express');
const router = express.Router();
const controller = require('../controller/userController');
const auth = require('../config/auth');

router.post('/add',auth.verifyToken ,controller.addUser)
router.post('/login', controller.login)
router.post("/logout", controller.logout);
router.get("/verifyRedisToken", controller.verifyRedisToken);
router.post('/verifyEmail', controller.verifyEmail)
router.post('/verifyOtp', controller.VerifyOtp)
router.post('/forgotPassword', controller.forgotPassword)
router.post('/changePassword', controller.changePassword)














module.exports = router
