const express=require('express')
const router=express.Router()
const controller=require('../controller/menuController')
const auth=require('../config/auth')
router.post('/add',auth.verifyToken,controller.addMenu)
router.post('/list',auth.verifyToken,controller.MenuList)
router.get('/list1',auth.verifyToken,controller.listMenu)




module.exports=router