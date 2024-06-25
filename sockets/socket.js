const Models = require("../models")
const { Op, where } = require('sequelize');
const message = require("../models/message");
const { logger } = require("sequelize/lib/utils/logger");

Models.message.belongsTo(Models.users, {
  foreignKey: "senderId",
  as: "senderDetail",
});
Models.message.belongsTo(Models.group, {
  foreignKey: "groupId",
  as: "groupDetail",
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
          include: [
            {
              attributes: ["name"],
              model: Models.users,
              as: "senderDetail",
            },
            {
              attributes: ["name"],
              model: Models.users,
              as: "receiverDetail",
            },
          ],
          where: {
            deletedBy: {
              [Op.ne]: chatData.senderId,
            },
            [Op.or]: [
              { senderId: chatData.senderId, receiverId: chatData.receiverId },
              { senderId: chatData.receiverId, receiverId: chatData.senderId },
            ],
          },
        });

        console.log(checkMessages, "Messages retrieved successfully");
        socket.emit("getMessages", checkMessages);
      } catch (error) {
        console.error("Error retrieving messages:", error);
        socket.emit("error", { message: "Failed to retrieve messages", error: error.message });
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
    // **********************************read status update socket **************************************************
    socket.on("readStatusUpdate", async (chatData) => {
      try {
        let checkMessage = await Models.chatconstant.findOne({
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
          },
        });

        let updatedData = await Models.message.update(
          {
            readStatus: chatData.readStatus,
          },
          {
            where: {
              receiverId: chatData.receiverId,
            },
          }
        );

        let getAllOldMessage = await getMessage(checkMessage);
        socket.emit("readStatusUpdate", getAllOldMessage);
      } catch (error) {
        console.log(error, "error>>>>>>>>>>>>>>>>>");
        throw error;
      }
    });
    // ************************************mark as unread socket*********************************************
    socket.on("markAsUnread", async (messageData) => {
      try {
        let unreadData = await Models.message.update({
          readStatus: 0
        }, {
          where: { id: messageData.id }
        })

        let updatedData = await Models.message.findOne({
          where: { id: messageData.id }
        })

        let message = {
          msg: "message marked as unread",
          data: updatedData,
        };
        socket.emit("markAsUnread", message);
      } catch (error) {
        throw error
      }
    })



    // =============================group chat socket ============================================
    socket.on("createGroup", async (groupData) => {
      try {
        let newGroup = await Models.group.create({
          groupName: groupData.groupName,
        });

        for (const userId of groupData.userIds) {
          await Models.groupUsers.create({
            groupId: newGroup.id,
            userId: userId,
          });
        }

        let groupUsers = await Models.groupUsers.findAll({
          where: { groupId: newGroup.id },
          raw: true,
        });

        for (const groupUser of groupUsers) {
          let socketId = await Models.usersocket.findOne({
            where: { userId: groupUser.userId },
            raw: true,
          });

          if (socketId) {
            io.to(socketId.socketId).emit("groupCreated", {
              groupId: newGroup.id,
              groupName: newGroup.groupName,
              userIds: groupData.userIds,
            });
          }
        }

        socket.emit("createGroup", {
          groupId: newGroup.id,
          groupName: newGroup.groupName,
          userIds: groupData.userIds,
        });
      } catch (error) {
        throw error;
      }
    });
    socket.on("groupSendMessage", async (chatData) => {
      try {
        // Check if there are previous messages from this sender in the group
        let checkGroupMessages = await Models.chatconstant.findOne({
          where: {
            groupId: chatData.groupId,
            senderId: chatData.senderId,
          },
        });

        // Get all users in the group
        let data = await Models.groupUsers.findAll({
          where: {
            groupId: chatData.groupId,
          },
          raw: true,
        });

        // Find the receiver ID (any user in the group that is not the sender)
        let receiverId;
        for (let i in data) {
          if (data[i].userId != chatData.senderId) {
            receiverId = data[i].userId;
            break;
          }
        }

        // Insert the chat message into the database
        let insertChat = await Models.message.create({
          message: chatData.message,
          senderId: chatData.senderId,
          receiverId: receiverId,
          groupId: chatData.groupId,
        });

        // Update or create the chat constant
        if (checkGroupMessages) {
          await Models.chatconstant.update(
            { lastMessageId: insertChat.id },
            { where: { id: checkGroupMessages.id } }
          );
        } else {
          await Models.chatconstant.create({
            senderId: chatData.senderId,
            receiverId: receiverId,
            groupId: chatData.groupId,
            lastMessageId: insertChat.id,
          });
        }

        const checkMessages = await Models.message.findAll({
          include: [
            {
              attributes: ["name"],
              model: Models.users,
              as: "senderDetail",
            },
            {
              attributes: ["groupName"],
              model: Models.group,
              as: "groupDetail",
            },
          ],
          where: {
            groupId: chatData.groupId
          },
        });

        // Get the group users
        let groupUsers = await Models.groupUsers.findAll({
          where: { groupId: chatData.groupId },
          raw: true,
        });

        // Emit the message to all group users
        for (const groupUser of groupUsers) {
          let socketId = await Models.usersocket.findOne({
            where: { userId: groupUser.userId },
            raw: true,
          });

          if (socketId) {
            io.to(socketId.socketId).emit("groupSendMessage", checkMessages);
          }
        }
        socket.emit("groupSendMessage", checkMessages);
      } catch (error) {
        throw error;
      }
    });







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