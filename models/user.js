const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^[0-9]+$/,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "client",
    },
  });
  User.beforeUpdate(async (user) => {
    // Hash the password if it's modified
    if (user.changed("password_hash")) {
      user.password_hash = bcrypt.hashSync(user.password_hash, 10);
    }
  });
  // Add the toJSON method to exclude the password field
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
  };

  return User;
};
