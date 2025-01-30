const controller=require('../controller/ImageForLoingController')
const express=require('express')
const router=express.Router()

router.post('/upload',controller.AddImage)
router.get('/randomImage',controller.randomImage)

module.exports=router