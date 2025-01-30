const express = require("express");
const router = express.Router();
const controller = require("../controller/FormControlCon");
const auth = require("../config/auth");

router.post("/add", auth.verifyToken, controller.FormControl);
router.get("/List", auth.verifyToken, controller.listControlToDrawScreen);
router.post("/FormList", auth.verifyToken, controller.ForControlList);
router.post("/Delete", auth.verifyToken, controller.delete);
router.post("/DropDownList", auth.verifyToken, controller.filterdDropDown);
router.post("/CopyTableMaping", auth.verifyToken, controller.copyTableMaping);
router.post("/getCopyData", auth.verifyToken, controller.getCopyData);
router.post("/CopyFormControl", auth.verifyToken, controller.copyFormControl);
router.post(
  "/toFormControlList",
  auth.verifyToken,
  controller.toClientFormcontrolList
);
router.post(
  "/clientCodeDropDown",
  auth.verifyToken,
  controller.clientCodeDropDown
);
router.post("/dynamicDataFetch", auth.verifyToken, controller.dynamicDataFetch);

module.exports = router;
