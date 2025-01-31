const { AthleteProfile } = require("../config/database");
const { Testimonial } = require("../config/database");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({ region: process.env.AWS_REGION });
const { v4: uuidv4 } = require("uuid");
///////////////////////////
// ! Testimonials
///////////////////////////

const getAllTestimonials = async (req, res) => {
  try {
    res.send("testimonials success");
  } catch (err) {
    res.send("testimonials fail");
  }
};

const getAllUserTestimonials = async (req, res) => {
  const { userId } = req.params;
  try {
    const userTestimonials = await Testimonial.findAll({
      where: { user_id: userId },
    });
    if (userTestimonials.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(userTestimonials);
  } catch (err) {
    res.status(500).json({ error: `Unable to retrieve user testimonials` });
  }
};

const getSingleTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    const targetedTestimonial = await Testimonial.findByPk(id);
    if (!targetedTestimonial) {
      return res.status(404).json({
        error: `Cannot find a testimonial with an id of ${id}`,
      });
    }
    res.status(200).json(targetedTestimonial);
  } catch (err) {
    res
      .status(500)
      .json({ error: `Unable to retrieve testimonial with an id of ${id}` });
  }
};

const postAddTestimonial = async (req, res) => {
  const { name, text } = req.body;
  const { userId } = req.query;
  try {
    if (!name || !text) {
      return res
        .status(404)
        .json({ error: "Please fill out all required fields and try again" });
    }
    const newTestimonial = await Testimonial.create({
      name,
      text,
      user_id: userId || null,
    });
    if (userId) {
      res.status(200).json({
        testimonial: newTestimonial,
        message: `Successfully created a new testimonial by ${name}. This testimonial is up for review to be approved by the admin to make it onto the website!`,
      });
    } else {
      res.status(200).json({
        message: `Successfully created a new testimonial by ${name}. This testimonial is up for review to be approved by the admin to make it onto the website!`,
      });
    }
  } catch (err) {
    res.status(500).json({
      error: `Error: ${err}\nUnable to create a new testimonial by ${
        name || "this user"
      }`,
    });
  }
};

const putUpdateTestimonial = async (req, res) => {
  const { name, text } = req.body;
  const { id } = req.params;
  try {
    if (!name || !text) {
      return res
        .status(404)
        .json({ error: "Please fill out all required fields and try again" });
    }
    const testimonialToUpdate = await Testimonial.findByPk(id);
    if (!testimonialToUpdate) {
      return res
        .status(404)
        .json({ error: `Could not find testimonial with an id of ${id}` });
    }
    if (
      testimonialToUpdate.name === name &&
      testimonialToUpdate.text === text
    ) {
      return res.status(400).json({
        error:
          'No changes have been detected in the form data, so the submission could not be processed. Please update the testimonial name or content before resubmitting. Note that all resubmissions will reset the status to "pending" and require admin approval before appearing on the website.',
      });
    }
    testimonialToUpdate.name = name;
    testimonialToUpdate.text = text;
    testimonialToUpdate.status = "pending";
    await testimonialToUpdate.save();

    res.status(200).json({
      testimonial: testimonialToUpdate,
      message: `Successfully updated the testimonial by ${name}. The updated testimonial is now under review and requires admin approval before it can appear on the website.`,
    });
  } catch (err) {
    res.status(500).json({
      error: `Error: ${err}\nUnable to create a new testimonial by ${
        name || "this user"
      }`,
    });
  }
};

const deleteTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCount = await Testimonial.destroy({
      where: {
        id,
      },
    });

    if (deletedCount === 0) {
      console.log("No record found with the given id.");
      return res.status(404).json({ error: "Testimonial not found" });
    } else {
      return res
        .status(204)
        .json({ message: `Successfully delete testimonial` });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Unable to delete testimonial with an id of ", id });
  }
};

const getTestimonialSubmissionByStatus = async (req, res) => {
  const { status } = req.query;
  const userId = req.user.user.id;

  try {
    if (userId !== process.env.ADMIN_ID) {
      return res.status(403).json({ error: `Unauthorized action` });
    }
    const testimonials = await Testimonial.findAll({
      where: { status },
      attributes: ["id", "status", "name", "createdAt"],
    });
    res.status(201).json(testimonials);
  } catch (err) {
    res.status(500).json({ error: "Unable to get approved spotlights" });
  }
};

const putUpdateTestimonialStatus = async (req, res) => {
  const { status, adminComment } = req.body;
  const userId = req.user.user.id;
  const { id } = req.params;
  let keptStatus = false;
  try {
    if (userId !== process.env.ADMIN_ID) {
      return res
        .status(403)
        .json({ error: `Not Authorized to update the document status` });
    }
    const testimonialToUpdate = await Testimonial.findByPk(id);
    keptStatus = status === testimonialToUpdate.status;
    testimonialToUpdate.status = status;
    testimonialToUpdate.admin_comment = adminComment;

    await testimonialToUpdate.save();
    if (keptStatus) {
      return res.status(201).json({ message: `Updated admin comment message` });
    }
    res.status(201).json({
      message: `Testimonial status changed to ${status}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Unable to update the status of testimonial with id of ${id} to ${status}`,
    });
  }
};

///////////////////////////
//  !  Spotlights
///////////////////////////
const getAllSpotlights = (req, res) => {
  try {
    res.send("spotlights success");
  } catch (err) {
    res.send("spot fail");
  }
};

const getSpotlightByUserID = async (req, res) => {
  const { userId } = req.params;
  console.log(userId, " <-- USER ID");
  try {
    const targetedSpotlight = await AthleteProfile.findOne({
      where: { created_by: userId },
    });
    if (!targetedSpotlight) {
      return res
        .status(404)
        .json({ error: `Cannot find the spotlight for user ${userId}` });
    }
    res.status(200).json(targetedSpotlight);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: `Sever error: Unable to get targeted spotlight` });
  }
};

const getSpotlightBySpotlightID = async (req, res) => {
  const { spotlightId } = req.params;
  console.log(spotlightId, " <-- SPOTLIGHT ID");
  try {
    const targetedSpotlight = await AthleteProfile.findByPk(spotlightId);
    if (!targetedSpotlight) {
      return res
        .status(404)
        .json({ error: `Cannot find the spotlight for user ${spotlightId}` });
    }
    res.status(200).json(targetedSpotlight);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: `Sever error: Unable to get targeted spotlight` });
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

    if (req.files.length === 3) {
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

      // Prepare the upload promises conditionally based on file existence
      const uploadPromises = [];

      // Check if profile image exists, then add the upload promise
      if (req.files[0]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params1)));
      }

      // Check if action image 1 exists, then add the upload promise
      if (req.files[1]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params2)));
      }

      // Check if action image 2 exists, then add the upload promise
      if (req.files[2]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params3)));
      }

      // If there are any promises (i.e., files to upload), execute them
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      } else {
        console.log("No files to upload to s3.");
      }
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
      // since creation happens just once, this will set value to null if no photo is supplied
      profile_image: req.files[0].originalname ? profile_image : null,
      action_image_1: req.files[1].originalname ? action_image_1 : null,
      action_image_2: req.files[2].originalname ? action_image_2 : null,
      created_by: userId,
    });

    if (newAthleteSpotlight) {
      return res.status(200).json({
        message: `Created new athlete spotlight for ${newAthleteSpotlight.first_name} ${newAthleteSpotlight.last_name}. This spotlight will be sent for review by the admin to get approval to be on the A2A website!`,
      });
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
  try {
    const existingSpotlight = await AthleteProfile.findOne({
      where: {
        created_by: userId,
      },
    });
    if (!existingSpotlight) {
      return res.status(400).json({
        error: `Could not find athlete spotlight to update`,
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

    if (req.files.length === 3) {
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

      // Prepare the upload promises conditionally based on file existence
      const uploadPromises = [];

      // Check if profile image exists, then add the upload promise
      if (req.files[0]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params1)));
      }

      // Check if action image 1 exists, then add the upload promise
      if (req.files[1]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params2)));
      }

      // Check if action image 2 exists, then add the upload promise
      if (req.files[2]?.originalname) {
        uploadPromises.push(s3.send(new PutObjectCommand(params3)));
      }

      // If there are any promises (i.e., files to upload), execute them
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      } else {
        console.log("No files to upload to s3.");
      }
    }

    // Update the fields of the existingSpotlight
    existingSpotlight.first_name = firstName;
    existingSpotlight.last_name = lastName;
    existingSpotlight.grad_year = graduationYear;
    existingSpotlight.sport = sport;
    existingSpotlight.general_bio = generalBio;
    existingSpotlight.action_bio = actionBio;
    existingSpotlight.community_bio = communityBio;
    existingSpotlight.location = location;
    existingSpotlight.status = "pending";

    // Complete S3 URLs and updates to photo columns
    if (filePath1) {
      const profile_image = `https://${params1.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath1}`;

      existingSpotlight.profile_image = profile_image;
    }
    if (filePath2) {
      const action_image_1 = `https://${params2.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath2}`;
      existingSpotlight.action_image_1 = action_image_1;
    }
    if (filePath3) {
      const action_image_2 = `https://${params3.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath3}`;
      existingSpotlight.action_image_2 = action_image_2;
    }

    // Save the updated record to the database
    await existingSpotlight.save();
    console.log(existingSpotlight, " <-- updated spotlight");
    res.status(200).json({
      message: `Updated athlete spotlight for ${existingSpotlight.first_name} ${existingSpotlight.last_name}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to add new athlete spotlight" });
  }
};

const deleteSpotlight = async (req, res) => {
  const { id } = req.params;

  try {
    const targetedSpotlight = await AthleteProfile.findByPk(id);
    if (!targetedSpotlight) {
      return res
        .status(404)
        .json({ error: `Spotlight with an id of ${id} was not found` });
    }

    await AthleteProfile.destroy({ where: { id } });
    const isProfileDeleted = await AthleteProfile.findByPk(id);
    if (isProfileDeleted) {
      return res.status(400).json({
        error: `Unable to delete spotlight belonging to athlete ID:${id}`,
      });
    } else {
      return res.status(200).json({
        message: `Successfully deleted athlete profile of ID:${id}`,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Unable to delete spotlight with id of ${id}`,
    });
  }
};

const getSpotlightSubmissionByStatus = async (req, res) => {
  const { status } = req.query;
  const userId = req.user.user.id;

  try {
    if (userId !== process.env.ADMIN_ID) {
      return res.status(403).json({ error: `Unauthorized action` });
    }
    const spotlights = await AthleteProfile.findAll({
      where: { status },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "status",
        "sport",
        "createdAt",
        "grad_year",
      ],
    });
    res.status(201).json(spotlights);
  } catch (err) {
    res.status(500).json({ error: "Unable to get approved spotlights" });
  }
};

const putUpdateSpotlightStatus = async (req, res) => {
  const { status, adminComment } = req.body;
  const userId = req.user.user.id;
  const { id } = req.params;
  let keptStatus = false;
  try {
    if (userId !== process.env.ADMIN_ID) {
      return res
        .status(403)
        .json({ error: `Not Authorized to update the document status` });
    }
    const spotlightToUpdate = await AthleteProfile.findByPk(id);
    keptStatus = status === spotlightToUpdate.status;
    spotlightToUpdate.status = status;
    spotlightToUpdate.admin_comment = adminComment;

    await spotlightToUpdate.save();
    if (keptStatus) {
      return res.status(201).json({ message: `Updated admin comment message` });
    }
    res.status(201).json({
      message: `Spotlight status changed to ${status}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Unable to update the status of Spotlight with id of ${id} to ${status}`,
    });
  }
};

module.exports = {
  getAllTestimonials,
  getAllSpotlights,
  postAddTestimonial,
  getSpotlightByUserID,
  postAddSpotlight,
  putUpdateSpotlight,
  getSingleTestimonial,
  getAllUserTestimonials,
  putUpdateTestimonial,
  deleteTestimonial,
  deleteSpotlight,
  getSpotlightSubmissionByStatus,
  getTestimonialSubmissionByStatus,
  putUpdateTestimonialStatus,
  putUpdateSpotlightStatus,
  getSpotlightBySpotlightID,
};
