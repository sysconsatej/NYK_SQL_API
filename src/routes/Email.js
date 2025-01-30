const express = require('express')
const router = express.Router()
const controller = require('../controller/EmailController')
const auth = require('../config/auth')

router.post('/email', auth.verifyToken, controller.Email)
router.post('/pdf', auth.verifyToken, controller.PDF)
router.post('/local_pdf', auth.verifyToken, controller.local_PDF)
router.post('/localPdfReports', auth.verifyToken, controller.localPDFReports)
router.post('/emailLogin', controller.EmailLogin)
router.post('/pdfProtect', controller.PDFP)

module.exports = router
