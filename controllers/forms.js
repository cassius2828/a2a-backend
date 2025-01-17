const { AthleteProfile } = require("../config/database");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

// initalize s3 instance
const s3 = new S3Client({ region: process.env.AWS_REGION });
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
    graduationYear,
    sport,
    generalBio,
    actionBio,
    communityBio,
    location,
  } = req.body;
  console.log(req.files, " <-- req.files");
  try {
    const existingSpotlight = await AthleteProfile.findOne({
      where: {
        created_by: userId,
      },
    });
    if (existingSpotlight) {
      return res.status(400).json({
        error: `User ${firstName} ${lastName} (userId:${userId}) already has an athlete spotlight. Please go to edit your current spotlight or contact developer for assistance at cassius.reynolds.dev@gmail.com`,
      });
    }

    if (!firstName || !lastName || !sport) {
      return res.status(400).json({
        error:
          "Please enter your first name, last name, and sport to be considered for an athlete spotlight",
      });
    }

    // Set up S3 variables
    let filePath1, filePath2, filePath3;
    let params1, params2, params3;

    if (req.files) {
      // Generate unique file paths for each image
      filePath1 = `a2a/images/athletes/${firstName}-${lastName}-${userId}/profileImage-${uuidv4()}-${
        req.files[0]?.originalname
      }`;
      filePath2 = `a2a/images/athletes/${firstName}-${lastName}-${userId}/actionImage1-${uuidv4()}-${
        req.files[1]?.originalname
      }`;
      filePath3 = `a2a/images/athletes/${firstName}-${lastName}-${userId}/actionImage2-${uuidv4()}-${
        req.files[2]?.originalname
      }`;

      // Set up the S3 upload parameters for each file
      params1 = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath1,
        Body: req.files[0]?.buffer,
      };
      params2 = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath2,
        Body: req.files[1]?.buffer,
      };
      params3 = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath3,
        Body: req.files[2]?.buffer,
      };

      // Upload files to S3
      await Promise.all([
        s3.send(new PutObjectCommand(params1)),
        s3.send(new PutObjectCommand(params2)),
        s3.send(new PutObjectCommand(params3)),
      ]);
    }

    // Complete S3 URLs
    const profile_image = `https://${params1.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath1}`;
    const action_image_1 = `https://${params2.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath2}`;
    const action_image_2 = `https://${params3.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath3}`;

    // Create new athlete spotlight in the database
    const newAthleteSpotlight = await AthleteProfile.create({
      first_name: firstName,
      last_name: lastName,
      grad_year: graduationYear,
      sport,
      general_bio: generalBio,
      action_bio: actionBio,
      community_bio: communityBio,
      location,
      profile_image,
      action_image_1,
      action_image_2,
      created_by: userId,

    });

    if (newAthleteSpotlight) {
      return res
        .status(200)
        .json(
          `Created new athlete spotlight for ${newAthleteSpotlight.first_name} ${newAthleteSpotlight.last_name}. This spotlight will be sent for review by the admin to get approval to be on the A2A website!`
        );
    } else {
      return res.status(500).json({
        error: `Unable to create new athlete spotlight for ${firstName} ${lastName}`,
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
    graduationYear,
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
      grad_year: graduationYear,
      sport,
      general_bio: generalBio,
      action_bio: actionBio,
      community_bio: communityBio,
      location,
      profile_image: profileImage,
      action_image_1: actionImage1,
      action_image_2: actionImage2,
      created_by: userId,
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
