module.exports = (sequelize, DataTypes) => {
  const AthleteProfile = sequelize.define(
    "AthleteProfile",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      grad_year: {
        type: DataTypes.INTEGER,
      },
      sport: {
        type: DataTypes.STRING,
      },
      general_bio: {
        type: DataTypes.STRING,
      },
      action_bio: {
        type: DataTypes.STRING,
      },
      community_bio: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
      profile_image: {
        type: DataTypes.TEXT,
      },
      action_image_1: {
        type: DataTypes.TEXT,
      },
      action_image_2: {
        type: DataTypes.TEXT,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "athlete_profiles",
    }
  );
  return AthleteProfile;
};
