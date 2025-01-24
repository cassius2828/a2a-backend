const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../config/database");
const nodemailer = require("nodemailer");
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

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
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
  let confirmEmailMessage = "";
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
    // check if another user is using the new email already
    const userByEmail = await User.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(400).json({
        error: `There is already a user who has the email of ${email}. Please select a different email to set as your new email.`,
      });
    }
    if (user.email && !email) {
      return res.status(400).json({
        message:
          "If you previously set an email, then you must have a valid email in the email input to continue",
      });
    }
    if (email && email !== user.email) {
      // function to send email to user to confirm their email change
      confirmEmailMessage = await confirmEmail(email, user);
    }

    user.first_name = firstName;
    user.last_name = lastName;
    user.phone = phone;
    user.avatar = avatarLink || "";
    await user.save();
    const token = jwt.sign({ user }, process.env.JWT_SECRET);

    res.status(200).json({
      message: `Updated user information.${
        confirmEmailMessage && confirmEmailMessage.message
      }`,
      token,
    });
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
  try {
    // if user does not exist
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    // if a field is missing
    if (!password || !confirmPassword || !newPassword) {
      return res.status(404).json({
        error: "Missing necessary password fields to update password",
      });
    }
    // if original typed password does not equal user current password
    const isUsersPassword = bcrypt.compareSync(password, user.password_hash);

    if (!isUsersPassword) {
      return res.status(400).json({
        error: "Original password does not match this user's recorded password",
      });
    }

    if (password === newPassword || password === confirmPassword) {
      return res.status(400).json({
        error: `New password must be different from the old password`,
      });
    }
    // if new password and confirm do not match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password must match" });
    }
    // hash updated password and save user

    user.password_hash = confirmPassword;
    await user.save();

    res.status(200).json({ message: "Successfully updated password" });
  } catch (err) {
    res.status(500).json({ error: "Unable to update password" });
  }
};

///////////////////////////
// * PUT | Confirm Email Change
///////////////////////////
const putConfirmEmailChange = async (req, res) => {
  const { userId, email } = req.body;
  const { token } = req.query;
  try {
    if (isTokenExpired(token, 10)) {
      return res.status(400).json({
        error: `Token is expired. Please submit an email change again and complete the steps before the expiration.`,
      });
    }
    const user = await User.findByPk(userId);
    const prevEmail = user.email;
    if (!user) {
      return res.status(404).json({ error: "Cannot find user" });
    }
    if (!email) {
      return res.status(400).json({ error: "No email was sent along" });
    }
    if (email && email !== user.email) {
      user.email = email;
    }
    await user.save();
    // Generate a JWT token with the updated user data
    const newToken = jwt.sign({ user }, process.env.JWT_SECRET);

    res.status(200).json({
      token: newToken,
      message: `Successfully confirmed email change from ${prevEmail} to ${email}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to confirm email change" });
  }
};

module.exports = {
  loginUser,
  registerUser,
  deleteUser,
  putUpdateUserInfo,
  putUpdatePassword,
  putConfirmEmailChange,
};

// Configure your email transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Ensure this is the correct host for Gmail
  port: 465, // Use port 465 for SSL/TLS
  secure: true,
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// confirmEmail function to send the confirmation email
const confirmEmail = async (email, user) => {
  try {
    // Generate a JWT token with the updated user data
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: "1m",
    });
    const confirmLink =
      process.env.NODE_ENV === "production"
        ? `https://${
            process.env.NETLIFY_URL
          }/confirm-email?token=${token}&userId=${
            user.id
          }&email=${encodeURIComponent(email)}`
        : `http://localhost:5173/confirm-email?token=${token}&userId=${
            user.id
          }&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email, // Recipient address
      subject: "Email Confirmation",
      html: `
        <h1>Athlete 2 Athlete -- Confirm Your Email</h1>
        <p>Please click the link below to confirm your email address. This will redirect you to a page where you can confirm and update your email in the applilcation:</p>
        <span><b>This link will expire in 10 minutes</b></span>
        <br/>
        <a href="${confirmLink}">Confirm Email</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
    if (user.email) {
      return {
        message: `Confirmation email sent to ${email}. Your email will remain as ${user.email} until you confirm this change. Link expires in 10 minutes`,
      };
    } else {
      return {
        message: `Confirmation email sent to ${email}. You will not have an email adress in the system until you confirm this change.`,
      };
    }
  } catch (err) {
    console.error(err);
    console.log(
      `Could not send email to ${email} to confirm their email address`
    );
    return { error: `Email could not be sent to ${email} to confirm email` };
  }
};

function isTokenExpired(token, expTimeValue) {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const decoded = JSON.parse(atob(token.split(".")[1]));
  const expTime = decoded.iat + expTimeValue * 60;
  return currentTime > expTime;
}
