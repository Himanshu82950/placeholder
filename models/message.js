const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('message', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    readStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    senderId: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: false,
    },
    receiverId: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: false,
    },
    deletedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: true,
    },
  }, {
    sequelize,
    tableName: 'message',
    timestamps: true,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [
          { name: 'id' },
        ],
      },
    ],
  });
};
