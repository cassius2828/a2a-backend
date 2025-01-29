const express = require("express");
const router = express.Router();
const formsCtrl = require("../controllers/forms");
const verifyToken = require("../middleware/verify-token");
const upload = require("multer")();

// testimonials
router.get("/testimonials", formsCtrl.getAllTestimonials);
router.get(
  "/testimonials/status",
  verifyToken,
  formsCtrl.getTestimonialSubmissionByStatus
);
router.get("/testimonials/:userId", formsCtrl.getAllUserTestimonials);
router.get("/testimonials/single/:id", formsCtrl.getSingleTestimonial);
router.post("/testimonials", formsCtrl.postAddTestimonial);
router.put("/testimonials/:id", formsCtrl.putUpdateTestimonial);
router.put(
  "/testimonials/:id/status",
  verifyToken,
  formsCtrl.putUpdateTestimonialStatus
);
router.delete("/testimonials/:id", formsCtrl.deleteTestimonial);



// spotlights
router.get("/spotlights", formsCtrl.getAllSpotlights);
router.get(
  "/spotlights/status",
  verifyToken,
  formsCtrl.getSpotlightSubmissionByStatus
);
router.get("/spotlights/:userId", formsCtrl.getSpotlightByID);
router.put(
  "/spotlights/:id/status",
  verifyToken,
  formsCtrl.putUpdateSpotlightStatus
);

router.post(
  "/spotlights/:userId",
  upload.array("photos", 3),
  formsCtrl.postAddSpotlight
);

router.put(
  "/spotlights/:userId",
  upload.array("photos", 3),
  formsCtrl.putUpdateSpotlight
);
router.delete("/spotlights/:id", formsCtrl.deleteSpotlight);

module.exports = router;
