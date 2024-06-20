const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    role: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment:"0>admin,1>user"
    }, 
    
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    phoneNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    countryCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    isVerify: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
      comment:"0>notverify,1>verified"
    },
    isNotification: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment:"0>off,1>on"
    },
    isComplete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment:"0>incomplete,1>complete"
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    deviceType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    deviceToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "" 
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
