const Models = require("../models")
const { Op, where } = require('sequelize');

Models.message.belongsTo(Models.users, {
  foreignKey: "senderId",
  as: "senderDetail",
});

Models.message.belongsTo(Models.users, {
  foreignKey: "receiverId",
  as: "receiverDetail",
});

Models.chatconstant.belongsTo(Models.users, {
  foreignKey: "receiverId",
  as: "receiverDetail",
});

Models.chatconstant.belongsTo(Models.users, {
  foreignKey: "senderId",
  as: "senderDetail",
});

Models.chatconstant.belongsTo(Models.message, {
  foreignKey: "lastMessageId",
  as: "lastMessageDetail",
});



module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log(socket.id, "A user connected");
    let socketId = socket.id;

    // *****************************connect user socket*************************************
    socket.on("connectUser", async (data) => {
      try {
        let findData = await Models.usersocket.findOne({
          where: { userId: data.userId }
        })
        if (!findData) {
          let createData = await Models.usersocket.create({
            socketId: socketId,
            userId: data.userId,
            isOnline: 1
          })
        } else {
          let updateData = await Models.usersocket.update({
            socketId: socketId
          }, { where: { userId: data.userId } })
        }

        socket.emit("connectUser", { data })
      } catch (error) {
        throw error
      }
    })

    // *************************send message socket********************************************
    socket.on("sendMessage", async (chatData) => {
      try {
        let checkUserMessages = await getChatConstantId(
          chatData.senderId,
          chatData.receiverId
        )
        let insertChat = await Models.message.create({
          message: chatData.message,
          senderId: chatData.senderId,
          receiverId: chatData.receiverId,
        })

        if (checkUserMessages) {
          await Models.chatconstant.update({ lastMessageId: insertChat.id }, { where: { id: checkUserMessages.id } })
        } else {
          checkUserMessages = await Models.chatconstant.create({
            senderId: chatData.senderId,
            receiverId: chatData.receiverId,
            lastMessageId: insertChat.id
          })
        }
        let socketId = await Models.usersocket.findOne({ where: { userId: chatData.receiverId }, raw: true })
        io.to(socketId.socketId).emit("sendMessage", chatData)
        socket.emit("sendMessage", chatData)
      } catch (error) {
        throw error
      }

    })

    // ******************************get message socket ***********************************
    socket.on("getMessages", async (chatData) => {
      try {
        const checkMessages = await Models.message.findAll({
          where: {
            [Op.or]: [
              {
                senderId: chatData.senderId,
                receiverId: chatData.receiverId,
              },
              {
                senderId: chatData.receiverId,
                receiverId: chatData.senderId,
              },
            ],
            deletedBy: {
              [Op.ne]: chatData.senderId,
            },
          },
        });

        socket.emit("getMessages", checkMessages);
      } catch (error) {
        console.log("Error: ", error);
        throw error;
      }
    });
    // ************************************get message list socket *************************************
    socket.on("getMessageList", async (chatList) => {
      try {
        let data = await Models.chatconstant.findAll({
          include: [
            {
              attributes: ["id", "name"],
              model: Models.users,
              as: "senderDetail"
            },
            {
              attributes: ["id", "name"],
              model: Models.users,
              as: "receiverDetail"
            },
            {
              model: Models.message,
              as: "lastMessageDetail"
            }
          ]
        });
        socket.emit("getMessageList", data);
      } catch (error) {
        console.log("Error fetching message list:", error);
        throw error;
      }
    });

    // ****************************** delete message socket *********************************************
    socket.on("deleteMessage", async (data) => {
      try {
        let getMessageData = await Models.message.findOne({
          where: { id: data.id }
        });

        if (!getMessageData) {
          throw new Error("Message not found");
        }
        await Models.message.destroy({ where: { id: data.id } });

        let getSocketKey = await Models.usersocket.findOne({
          where: {
            userId: getMessageData.receiverId
          }
        });

        let checkMessage = await getChatConstantId(
          getMessageData.senderId,
          getMessageData.receiverId
        );

        let getAllOldMessage = await getMessage(checkMessage);
        socket.emit("deleteMessage", getAllOldMessage);
      } catch (error) {
        console.error("Error in deleteMessage event:", error);
        throw error;
      }
    });

    // ********************************** clear chat socket ************************************************
    socket.on("clearChat", async (data) => {
      try {
        const { senderId, receiverId } = data;
        const updateResult = await Models.message.update(
          { deletedBy: senderId },
          {
            where: {
              deletedBy: null,
              [Op.or]: [
                { senderId: senderId, receiverId: receiverId }
              ]
            }
          }
        );

        const deleteResult = await Models.message.destroy({
          where: {
            [Op.or]: [
              { senderId: receiverId, receiverId: senderId }
            ],
            deletedBy: { [Op.eq]: receiverId }
          }
        });
        socket.emit("clearChat", { success_message: "Chat cleared successfully" });
      } catch (error) {
        console.error("Error deleting messages: ", error);
        socket.emit("clearChat", { error_message: "Error clearing chat", error: error.message });
      }
    });

    socket.on("readStatusUpdate", async (chatData) => {
      try {
        let updateResult = await Models.message.update({
          readStatus: 1
        }, {
          where: {
            receiverId: chatData.receiverId,
            senderId: chatData.senderId
          }
        })
      } catch (error) {
        throw error
      }
    })


  })

};

























async function getChatConstantId(senderId, receiverId) {
  let chatConstantId = await Models.chatconstant.findOne({
    where: {
      [Op.or]: [
        {
          senderId: senderId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: senderId,
        },
      ],
    },
  });

  return chatConstantId;
}



async function getBothUserMessage(data) {
  try {
    let getAllOldMessage = await Models.message.findAll({
      include: [
        {
          model: Models.users,
          as: "senderDetail",
        },
        {
          model: Models.users,
          as: "receiverDetail",
        },
      ],
    });
    return getAllOldMessage;
  } catch (error) {
    console.log("errorrrrrrrrrrrrr", error);
  }
}


async function getMessage(data) {
  try {
    let getAllOldMessage = await Models.message.findAll({
      include: [
        {
          model: Models.users,
          as: "senderDetail",
        },
        {
          model: Models.users,
          as: "receiverDetail",
        },
      ],
      // where: {
      //   chatConstantId: data.id,
      // },
    });
    return getAllOldMessage;
  } catch (error) {
    console.log(">>>>>>>>>>>>>>>>>", error);
  }
}