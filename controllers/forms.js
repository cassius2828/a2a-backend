const { AthleteProfile } = require("../config/database");

///////////////////////////
// Testimonials
///////////////////////////

const getAllTestimonials = (req, res) => {
  try {
    res.send("testimonials success");
  } catch (err) {
    res.send("testimonials fail");
  }
};
const postAddTestimonial = (req, res) => {
  console.log(req.body, "<-- reqody");
  try {
    res.send("testimonials success");
  } catch (err) {
    res.send("testimonials fail");
  }
};

///////////////////////////
//   Spotlights
///////////////////////////
const getAllSpotlights = (req, res) => {
  try {
    res.send("spotlights success");
  } catch (err) {
    res.send("spot fail");
  }
};

const postAddSpotlight = async (req, res) => {
  const { userId } = req.params;
  const {
    firstName,
    lastName,
    gradYear,
    sport,
    generalBio,
    actionBio,
    communityBio,
    location,
    profileImage,
    actionImage1,
    actionImage2,
  } = req.body;
  try {
    const existingSpotlight = await AthleteProfile.findOne({
      created_by: userId,
    });
    if (existingSpotlight) {
      return res.status(400).json({
        error: `User with id of ${userId} already has an athlete spotlight. Please go to edit your current spotlight or contact developer for assistance at cassius.reynolds.dev@gmail.com`,
      });
    }
    if (!firstName || !lastName || !sport) {
      return res.status(400).json({
        error:
          "Please enter your first name, last name, and sport to be considered for an athlete spotlight",
      });
    }
    const newAthleteSpotlight = await AthleteProfile.create({
      first_name: firstName,
      last_name: lastName,
      grad_year: gradYear,
      sport,
      general_bio: generalBio,
      action_bio: actionBio,
      community_bio: communityBio,
      location,
      profile_image: profileImage,
      action_image_1: actionImage1,
      action_image_2: actionImage2,
    });
    if (newAthleteSpotlight) {
      return res
        .status(200)
        .json(
          `Created new athlete spotlight for ${newAthleteSpotlight.first_name} ${newAthleteSpotlight.last_name}`
        );
    } else {
      res.status(500).json({
        error:
          "Unable to create new athlete spotlight for " +
          firstName +
          " " +
          lastName,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to add new athlete spotlight" });
  }
};

const putUpdateSpotlight = async (req, res) => {
  //   const userId = req.session._id;
  const userId = 3;
  const {
    firstName,
    lastName,
    gradYear,
    sport,
    generalBio,
    actionBio,
    communityBio,
    location,
    profileImage,
    actionImage1,
    actionImage2,
  } = req.body;
  try {
    const existingSpotlight = await AthleteProfile.findOne({
      created_by: userId,
    });
    if (existingSpotlight) {
      return res.status(400).json({
        error: `User with id of ${userId} already has an athlete spotlight. Please go to edit your current spotlight or contact developer for assistance at cassius.reynolds.dev@gmail.com`,
      });
    }
    if (!firstName || !lastName || !sport) {
      return res.status(400).json({
        error:
          "Please enter your first name, last name, and sport to be considered for an athlete spotlight",
      });
    }
    const newAthleteSpotlight = await AthleteProfile.create({
      first_name: firstName,
      last_name: lastName,
      grad_year: gradYear,
      sport,
      general_bio: generalBio,
      action_bio: actionBio,
      community_bio: communityBio,
      location,
      profile_image: profileImage,
      action_image_1: actionImage1,
      action_image_2: actionImage2,
    });
    if (newAthleteSpotlight) {
      return res
        .status(200)
        .json(
          `Created new athlete spotlight for ${newAthleteSpotlight.first_name} ${newAthleteSpotlight.last_name}`
        );
    } else {
      res.status(500).json({
        error:
          "Unable to create new athlete spotlight for " +
          firstName +
          " " +
          lastName,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to add new athlete spotlight" });
  }
};
module.exports = {
  getAllTestimonials,
  getAllSpotlights,
  postAddTestimonial,
  postAddSpotlight,
  putUpdateSpotlight,
};
