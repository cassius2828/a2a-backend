const express = require("express");
const router = express.Router();
const formsCtrl = require("../controllers/forms");
const upload = require("multer")();
// testimonials
router.get("/testimonials", formsCtrl.getAllTestimonials);
router.post("/testimonials", formsCtrl.postAddTestimonial);
// spotlights
router.get("/spotlights", formsCtrl.getAllSpotlights);
router.post(
  "/spotlights/:userId",
  upload.array("photos", 3),
  formsCtrl.postAddSpotlight
);
router.put("/spotlights/:userId", formsCtrl.putUpdateSpotlight);

module.exports = router;
