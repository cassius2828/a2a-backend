const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../config/database");
// aws s3 setup
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = new S3Client({ region: process.env.AWS_REGION });
///////////////////////////
// ? POST | Register User
///////////////////////////
const registerUser = async (req, res) => {
  const { password, confirmPassword, email, phone, firstName, lastName } =
    req.body;
  try {
    if (!password || !firstName || !lastName || !email) {
      return res.status(400).json({
        error: "Missing required fields. Try again with all required fields",
      });
    }
    console.log(User, " <-- user!!");
    const hashedPass = bcrypt.hashSync(password, 10);
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already taken" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password_hash: hashedPass,
    });
    let token = jwt.sign({ user }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to register user" });
  }
};

///////////////////////////
// ? POST  | Login User
///////////////////////////
const loginUser = async (req, res) => {
  const { password, email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ error: "Invalid credentials. Please try again" });
    }

    const isPasswordValid = bcrypt.compareSync(
      password,
      user.password_hash_hash
    );
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ error: "Invalid credentials. Please try again" });
    }

    const token = jwt.sign({ user }, process.env.JWT_SECRET);
    res.locals.user = user;
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to login user" });
  }
};

///////////////////////////
// ! DELETE | User by Id
///////////////////////////

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const deletedRows = await User.destroy({ where: { id: userId } });
    if (deletedRows) {
      res.status(200).json({ message: "Successfully deleted user" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to delete user" });
  }
};

///////////////////////////
// * PUT | Update User Info
///////////////////////////
const putUpdateUserInfo = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, email, phone } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: `Unable to find user with an userId of ${userId}` });
    }

    let filePath;
    let params;
    let avatarLink;
    if (req.file) {
      filePath = `a2a/images/users/${firstName}-${lastName}-${userId}/avatar-${uuidv4()}-${
        req.file.originalname
      }`;
      params = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath,
        Body: req.file.buffer,
      };

      s3.send(new PutObjectCommand(params));
      avatarLink = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
    }

    user.first_name = firstName;
    user.last_name = lastName;
    user.email = email;
    user.phone = phone;
    user.avatar = avatarLink || "";
    await user.save();
    const token = jwt.sign({ user }, process.env.JWT_SECRET);

    res.status(200).json({ message: `Updated user information`, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: `Unable to update user information for user with id of ${userId}`,
    });
  }
};

///////////////////////////
// * PUT | Update Passowrd
///////////////////////////

const putUpdatePassword = async (req, res) => {
  const { password, confirmPassword, newPassword } = req.body;
  const { userId } = req.params;
  console.log(req.body, "<-- req body")
  try {
    // if user does not exist
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }
    console.log(user.password_hash, "<-- password_hash")
    // if a field is missing
    if (!password || !confirmPassword || !newPassword) {
      return res.status(404).json({
        error: "Missing necessary password fields to update password",
      });
    }
    // if original typed password does not equal user current password
    const isUsersPassword = bcrypt.compareSync(password, user.password_hash);
console.log(isUsersPassword, '<-- is user password (compare sync)')
    if (!isUsersPassword) {
      return res.status(400).json({
        error: "Original password does not match this user's recorded password",
      });
    }

    if ((password === newPassword)|| password === confirmPassword) {
      return res
        .status(400)
        .json({
          error: `New password must be different from the old password`,
        });
    }
    // if new password and confirm do not match
    console.log("here");
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password must match" });
    }
    // hash updated password and save user

    user.password_hash = confirmPassword;
    console.log(user, '<-- user row')
    await user.save();

    res.status(200).json({ message: "Successfully updated password" });
  } catch (err) {
    res.status(500).json({ error: "Unable to update password" });
  }
};

module.exports = {
  loginUser,
  registerUser,
  deleteUser,
  putUpdateUserInfo,
  putUpdatePassword,
};
