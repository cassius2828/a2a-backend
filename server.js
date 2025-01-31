const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();
// vars
const PORT = process.env.PORT || 3000;
const { sequelize } = require("./config/database");

const connectToDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    console.log(`
        Database Configuration:
        ------------------------
        Database: ${sequelize.config.database}
      `);
      console.log(process.env.NODE_ENV, ' <-- environment')
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

connectToDB();
///////////////////////////
// Routers
///////////////////////////
const authRouter = require("./routes/auth");
const formsRouter = require("./routes/forms");

///////////////////////////
// Routes
///////////////////////////
app.use("/auth", authRouter);
app.use("/forms", formsRouter);

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
