const express=require('express')
const router=express.Router();
const controller=require('../controller/dynamicReport/JSONExportController');
const auth=require('../config/auth')


router.post('/dynamicReport/exportToJson',auth.verifyToken,controller.ExportToJson)
router.post('/dynamicReport/exportToXML',auth.verifyToken,controller.ExportToXML)
router.post('/dynamicReport/exportToASCII',auth.verifyToken,controller.ExportToASCII)


module.exports=router