module.exports = (sequelize, DataTypes) => {
  const Testimonial = sequelize.define("Testimonial", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE", // Updates foreign key if the user ID changes
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected"]],
      },
    },
    rating: {
      type: DataTypes.FLOAT,
      validate: {
        min: 1.0,
        max: 5.0,
      },
    },
    admin_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Testimonial;
};
