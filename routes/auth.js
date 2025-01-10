const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");

router.post("/login", authCtrl.loginUser);
router.post("/register", authCtrl.registerUser);
router.post("/test", authCtrl.testUserModel);
router.delete("/delete/:userId", authCtrl.deleteUser);

module.exports = router;
