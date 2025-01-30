const express = require("express");
const router = express.Router();
const controller = require("../controllerSQL/formController");
const auth = require("../config/auth");

router.get("/list", auth.verifyToken, controller.listControlToDrawScreen);
router.post("/DropDownList", auth.verifyToken, controller.filterdDropDown);
router.post("/dynamicFetch", auth.verifyToken, controller.dynamicFetch);

module.exports = router;
