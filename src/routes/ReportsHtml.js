const Controller = require('../controller/HTMLReports');
const express=require('express');
const router=express.Router();

router.get('/htmlReportList',Controller.report);
router.get('/ReportsTemplate',Controller.template);

module.exports=router