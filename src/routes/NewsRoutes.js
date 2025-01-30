const express=require('express')
const router=express.Router()
const controller=require('../controller/login/newsController')

router.post('/fetchNews',controller.fetchNews);

module.exports=router
