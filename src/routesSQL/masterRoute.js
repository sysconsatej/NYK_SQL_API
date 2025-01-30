const controller = require('../controllerSQL/masterController')
const express = require('express')
const router = express.Router()
const auth = require('../config/auth')

router.post("/dytablelist", auth.verifyToken, controller.DisPlaySeacrchApi)
router.post("/demo", auth.verifyToken, controller.infoData)
router.post("/Insert_into_master",controller.createMaster)



module.exports = router