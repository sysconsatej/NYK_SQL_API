const Controller = require('../controller/chartController');
const express=require('express');
const router=express.Router();

router.post("/Add",Controller.Add)
router.get("/list",Controller.list)

module.exports=router