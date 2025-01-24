const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");
const verifyToken = require("../middleware/verify-token");
const upload = require("multer")();

router.post("/login", authCtrl.loginUser);
router.post("/register", authCtrl.registerUser);
router.put(
  "/:userId",
  verifyToken,
  upload.single("avatar"),
  authCtrl.putUpdateUserInfo
);
router.put("/:userId/update-password", verifyToken, authCtrl.putUpdatePassword);
router.put("/:userId/confirm-email",verifyToken, authCtrl.putConfirmEmailChange);
router.delete("/delete/:userId", verifyToken, authCtrl.deleteUser);

module.exports = router;
