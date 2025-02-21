const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // console.log(req.headers, " req.headers");
  try {
    // console.log(req.headers.authorization, " <- req.headers.authorization");
    const token = req.headers.authorization.split(" ")[1];

    // console.log(token, " <- token");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded, " <- decoded");
    // assign the decoded token to req.user! and pass it to the controller function
    // by calling next()

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    // 401 - means unauthorized!
    res.status(401).json({ error: "Invalid token." });
  }
}

module.exports = verifyToken;
