const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, sequelize } = require("../config/database");

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

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ error: "Invalid credentials. Please try again" });
    }

    const token = jwt.sign({ user }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "unable to login user" });
  }
};

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

const testUserModel = async (req, res) => {
  console.log(User, " <-- user model");
  console.log(sequelize.models, " <-- sequelize models");
  console.log(User.findOne);
  try {
    res.send("sebdubg yser");
  } catch (err) {
    res.send("fail");
  }
};

module.exports = {
  loginUser,
  registerUser,
  testUserModel,
  deleteUser,
};
