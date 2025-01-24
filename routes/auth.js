const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");
const upload = require("multer")();

router.post("/login", authCtrl.loginUser);
router.post("/register", authCtrl.registerUser);
router.put("/:userId", upload.single("avatar"), authCtrl.putUpdateUserInfo);
router.put("/:userId/update-password", authCtrl.putUpdatePassword)
router.delete("/delete/:userId", authCtrl.deleteUser);

module.exports = router;
