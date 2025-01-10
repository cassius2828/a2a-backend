const { Sequelize } = require("sequelize");

const dialect = "postgres";
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASS = process.env.DB_PASS;

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASS, {
  host: "localhost",
  dialect,
});
const User = require("../models/user")(sequelize, Sequelize.DataTypes);
const AthleteProfile = require("../models/athleteProfile")(
  sequelize,
  Sequelize.DataTypes
);
module.exports = { sequelize, User, AthleteProfile };
