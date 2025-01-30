const Controller = require('../controller/reportSearchCriteria');
const express=require('express');
const router=express.Router();
const auth=require('../config/auth')
router.post("/Add",auth.verifyToken,Controller.Add)
router.post("/list",auth.verifyToken,Controller.list)

module.exports=router