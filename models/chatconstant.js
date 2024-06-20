const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('chatconstant', {
    id: {
      type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			primaryKey: true,
    },
    senderId: {
      type: Sequelize.UUID,
			references: {
				model: "users",
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
      allowNull: false
    },
    receiverId: {
      type: Sequelize.UUID,
			references: {
				model: "users",
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
      allowNull: false
    },
    lastMessageId: {
      type:Sequelize.UUID,
      references: {
				model: "message",
				key: "id",
			},
			onUpdate: "CASCADE",
			onDelete: "CASCADE",
		    } 
  }, {
    sequelize,
    tableName: 'chatconstant',
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
