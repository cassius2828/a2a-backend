'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('athlete_profiles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      grad_year: {
        type: Sequelize.INTEGER,
      },
      sport: {
        type: Sequelize.STRING,
      },
      general_bio: {
        type: Sequelize.STRING,
      },
      action_bio: {
        type: Sequelize.STRING,
      },
      community_bio: {
        type: Sequelize.STRING,
      },
      location: {
        type: Sequelize.STRING,
      },
      profile_image: {
        type: Sequelize.TEXT,
      },
      action_image_1: {
        type: Sequelize.TEXT,
      },
      action_image_2: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
      },
      admin_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('athlete_profiles');
  },
};