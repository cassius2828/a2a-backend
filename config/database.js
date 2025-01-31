const { Sequelize } = require("sequelize");

const dialect = process.env.DB_DIALECT;
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASS = process.env.DB_PASS;

let sequelize;
if (process.env.NODE_ENV === "production") {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      dialectOptions: {
        ssl: {
          require: process.env.DB_SSL === "true",
          rejectUnauthorized: false,
        },
      },
    }
  );
} else if (process.env.NODE_ENV === "development") {
  sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASS, {
    host: "localhost",
    dialect,
  });
}

const User = require("../models/user")(sequelize, Sequelize.DataTypes);
const Testimonial = require("../models/testimonial")(
  sequelize,
  Sequelize.DataTypes
);
const AthleteProfile = require("../models/athleteProfile")(
  sequelize,
  Sequelize.DataTypes
);
module.exports = { sequelize, User, AthleteProfile, Testimonial };
