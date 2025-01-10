const express = require("express");
const router = express.Router();
const formsCtrl = require("../controllers/forms");

// testimonials
router.get("/testimonials", formsCtrl.getAllTestimonials);
router.post("/testimonials", formsCtrl.postAddTestimonial);
// spotlights
router.get("/spotlights", formsCtrl.getAllSpotlights);
router.post("/spotlights/:userId", formsCtrl.postAddSpotlight);
router.put("/spotlights/:userId", formsCtrl.putUpdateSpotlight);

module.exports = router;
