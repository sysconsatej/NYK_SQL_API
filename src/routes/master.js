const controller=require('../controller/masterController')
const express=require('express')
const router=express.Router()
const auth=require('../config/auth')
 
router.post("/MasterAdd",auth.verifyToken,controller.addSchema)
router.get("/List",auth.verifyToken,controller.listSchema)
router.post("/Insert_into_master",auth.verifyToken,controller.createMaster)
router.post("/dytablelist",auth.verifyToken,controller.DisPlaySeacrchApi)
router.post("/demo",auth.verifyToken,controller.DemoExample)
router.post("/updateKeys",controller.UpdateTryThree)
router.post("/Delete",auth.verifyToken,controller.delete)
router.post("/Upload",auth.verifyToken,controller.upLoadFile)
router.post("/copyDataBase",auth.verifyToken,controller.copyDataBase)
router.post("/DeleteDataFromMaster",auth.verifyToken,controller.DeleteDataFromAuditLog)
router.post("/CopyMenuAndFormControl",auth.verifyToken,controller.CopyFormControlAndMenu)
router.post("/copyMasterDataAndMasterList",auth.verifyToken,controller.copyMasterDataWithMasterlist)
router.post("/roleCopy",auth.verifyToken,controller.roleCopyToNewClient)
router.post("/countryAndPort",auth.verifyToken,controller.copyCountryAndPortWithRegion)
router.post("/sendMail",controller.sendDocument)




 


module.exports=router