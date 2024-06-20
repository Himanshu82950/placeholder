const Models = require('../models/index');
const helper = require('../helper/validation')
const { generateToken } = require('../jwt')
const path = require('path');
const uuid = require('uuid');
const { profile } = require('console');
const { where } = require('sequelize');
const { Op } = require('sequelize');
const { receiveMessageOnPort } = require('worker_threads');


Models.addfriend.belongsTo(Models.users, {
    foreignKey: "senderId",
    as: "Sender",
});
Models.addfriend.belongsTo(Models.users, {
    foreignKey: "receiverId",
    as: "Receiver",
});

Models.blockuser.belongsTo(Models.users, {
    foreignKey: "blockBy",
    as: "BlockBy",
});

Models.blockuser.belongsTo(Models.users, {
    foreignKey: "blockTo",
    as: "BlockTo",
});


module.exports = {
    signUp: async (req, res) => {
        try {
            const generateOtp = Math.floor(1000 + Math.random() * 9000);

            let signupData = await Models.users.findOne({
                where: {
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode
                }
            });

            if (!signupData) {
                signupData = await Models.users.create({
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode,
                    role: req.body.role,
                    deviceType: req.body.deviceType,
                    deviceToken: req.body.deviceToken,
                    otp: generateOtp
                });

                return helper.success(res, "User created successfully", signupData);
            }

            await Models.users.update(
                {
                    otp: generateOtp,
                    deviceType: req.body.deviceType,
                    deviceToken: req.body.deviceToken,
                },
                {
                    where: {
                        phoneNumber: req.body.phoneNumber,
                        countryCode: req.body.countryCode
                    }
                }
            );

            let updateData = await Models.users.findOne({
                where: {
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode
                }
            });

            return helper.success(res, "OTP updated successfully", updateData);
        } catch (error) {
            return helper.failed(res, "An error occurred", error);
        }
    },
    verifyOtp: async (req, res) => {
        try {
            const otpData = await Models.users.findOne({
                where: {
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode
                }
            });
            if (otpData) {
                if (otpData.otp == req.body.otp) {
                    await Models.users.update(
                        { isVerify: 1, otp: "" },
                        {
                            where: {
                                phoneNumber: req.body.phoneNumber,
                                countryCode: req.body.countryCode
                            }
                        }
                    );
                    const payload = {
                        id: otpData.id
                    };
                    const token = generateToken(payload);
                    return helper.success(res, "OTP verified", token);
                } else {
                    return helper.failed(res, "OTP mismatch");
                }
            } else {
                return helper.failed(res, "No user found");
            }
        } catch (error) {
            throw error;
        }
    },
    completeProfile: async (req, res) => {
        try {
            let fileImage = "";
            if (req.files && req.files.profileImage) {
                var extension = path.extname(req.files.profileImage.name);
                fileImage = uuid.v4() + extension;

                req.files.profileImage.mv(
                    path.join(__dirname, `../public/images/` + fileImage),
                    function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }
            let completeData = await Models.users.update({
                name: req.body.name,
                email: req.body.email,
                profileImage: fileImage,
                isComplete: 1
            }, {
                where: { id: req.newUser.id }
            })
            return helper.success(res, "profile completed", completeData)
        } catch (error) {
            throw error
        }
    },
    getProfile: async (req, res) => {
        try {
            let profileData = await Models.users.findOne({
                where: { id: req.newUser.id }
            })
            return helper.success(res, "profile fetched successfully", profileData)
        } catch (error) {
            throw error
        }
    },
    profileUpdate: async (req, res) => {
        try {
            let fileImage = "";
            if (req.files && req.files.profileImage) {
                var extension = path.extname(req.files.profileImage.name);
                fileImage = uuid.v4() + extension;

                req.files.profileImage.mv(
                    path.join(__dirname, `../public/images/` + fileImage),
                    function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }
            let Data = await Models.users.update({
                name: req.body.name,
                email: req.body.email,
                profileImage: fileImage

            }, { where: { id: req.newUser.id } })
            return helper.success(res, "profile updated successfully", Data)
        } catch (error) {
            throw error
        }
    },
    notification: async (req, res) => {
        try {
            let data = await Models.users.findOne({ where: { id: req.newUser.id } })
            let isNotification = data.isNotification
            let message
            if (isNotification == 1) {
                message = "off"
            } else {
                message = "on"
            }
            let updatedData = await Models.users.update({
                isNotification: !isNotification
            }, { where: { id: req.newUser.id } })
            return helper.success(res, `Notification ${message}`)
        } catch (error) {
            throw error
        }
    },
    createSchedule: async (req, res) => {
        try {
            let scheduleData = await Models.userschedule.create({
                userId: req.body.userId,
                scheduleName: req.body.scheduleName,
                location: req.body.location,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                time: req.body.time,
                description: req.body.description,
                scheduleType: req.body.scheduleType
            })
            return helper.success(res, "schedule created", scheduleData)
        } catch (error) {
            throw error
        }
    },
    updateSchedule: async (req, res) => {
        try {
            let findScheduleData = await Models.userschedule.findOne({
                where: { id: req.body.id, userId: req.newUser.id }
            })
            if (!findScheduleData) {
                return helper.failed(res, "no schedule is present");
            }
            let data = await Models.userschedule.update({
                scheduleName: req.body.scheduleName,
                location: req.body.location,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                time: req.body.time,
                description: req.body.description
            }, { where: { id: req.body.id } })
            return helper.success(res, "updated successfully", data)
        } catch (error) {
            throw error
        }
    },
    deleteSchedule: async (req, res) => {
        try {
            let deleteData = await Models.userschedule.destroy({
                where: { id: req.params.id }
            })
            return helper.success(res, "schedule deleted successfully")
        } catch (error) {
            throw error
        }
    },
    cmsView: async (req, res) => {
        try {
            let cmsData = await Models.cms.findOne({
                where: { type: req.query.type }
            })
            return helper.success(res, "Data is:", cmsData)
        } catch (error) {
            throw error
        }
    },
    resendOtp: async (req, res) => {
        try {
            const generateOtp = Math.floor(1000 + Math.random() * 9000);
            let data = await Models.users.findOne({
                where: {
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode
                }
            })
            if (data) {
                await Models.users.update({
                    otp: generateOtp
                }, {
                    where: {
                        phoneNumber: req.body.phoneNumber,
                        countryCode: req.body.countryCode
                    }
                })
            }
            return helper.success(res, "OTP sent successfully", { otp: generateOtp });


        } catch (error) {
            throw error
        }
    },
    sendFriendRequest: async (req, res) => {
        try {
            const receiverId = req.body.receiverId;

            if (receiverId == req.newUser.id) {
                return helper.success(res, "A user cannot send a request to himself");
            }
            let existingRequestData = await Models.addfriend.findOne({
                where: {
                    [Op.or]: [
                        { senderId: req.newUser.id, receiverId: req.body.receiverId },
                        { senderId: req.body.receiverId, receiverId: req.newUser.id },
                    ]
                }
            })

            if (existingRequestData != null) {
                if (existingRequestData.status == 1) {
                    return helper.success(res, "You are already friends")
                }
                if (existingRequestData.status == 0) {
                    return helper.success(res, "a friend request is already sent to this user")
                }

                if (existingRequestData.status == 2) {
                    await Models.addfriend.destroy({
                        where: { id: existingRequestData.id }
                    })
                }
            }
            let requestData = await Models.addfriend.create({
                senderId: req.newUser.id,
                receiverId: req.body.receiverId,
            })
            return helper.success(res, "friend request sent", requestData)
        } catch (error) {
            throw error
        }
    },
    updateRequestStatus: async (req, res) => {
        try {
            let findRequestData = await Models.addfriend.findOne({
                where: { id: req.body.id }
            })
            if (findRequestData) {
                await Models.addfriend.update({
                    status: req.body.status
                }, { where: { id: req.body.id } })
            }
            let updateData = await Models.addfriend.findOne({
                where: { id: findRequestData.id }
            })
            return helper.success(res, "request status updated", updateData)
        } catch (error) {
            throw error
        }
    },
    friendListing: async (req, res) => {
        try {
            let friendData = await Models.addfriend.findAll({
                include: [
                    {
                        attributes: ["id", "name", "profileImage"],
                        model: Models.users,
                        as: "Sender"
                    },
                    {
                        attributes: ["id", "name", "profileImage"],
                        model: Models.users,
                        as: "Receiver"
                    }
                ],
            }, {
                where: {
                    status: 1,
                    [Op.or]: [{ senderId: req.newUser.id, receiverId: req.newUser.id }]
                }
            })
            return helper.success(res, "friend list:", friendData)
        } catch (error) {
            throw error
        }
    },
    userBlock: async (req, res) => {
        try {
            let existingBlockData = await Models.blockuser.findOne({
                where: {
                    blockBy: req.newUser.id,
                    blockTo: req.body.blockTo
                }
            })
            if (existingBlockData) {
                await Models.blockuser.destroy({
                    where: {
                        blockBy: req.newUser.id,
                        blockTo: req.body.blockTo
                    }
                })
                return helper.success(res, "user unblocked")
            } else {
                let blockData = await Models.blockuser.create({
                    blockBy: req.newUser.id,
                    blockTo: req.body.blockTo,
                    reason: req.body.reason
                })
                return helper.success(res, "user blocked", blockData)
            }

        } catch (error) {
            throw error
        }
    },
    blockUserListing: async (req, res) => {
        try {
            let blockData = await Models.blockuser.findAll({
                include: [
                    {
                        attributes: ["id", "name", "profileImage"],
                        model: Models.users,
                        as: "BlockBy"
                    },
                    {
                        attributes: ["id", "name", "profileImage"],
                        model: Models.users,
                        as: "BlockTo"
                    }
                ],
            }, {
                where: {
                    [Op.or]: [{ blockBy: req.newUser.id, blockTo: req.newUser.id }]
                }
            })
            return helper.success(res, "block user listing:", blockData)
        } catch (error) {
            throw error
        }
    },
    uploadContact: async (req, res) => {
        try {
            let fileImage = "";

            if (req.files && req.files.file) {
                var extension = path.extname(req.files.file.name);
                fileImage = uuid.v4() + extension;

                req.files.file.mv(
                    path.join(__dirname, `../public/jsonFile/` + fileImage),
                    function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }
            let data = {
                file: fileImage,
            };
            return helper.success(res, "file", data);
        } catch (error) {
            throw error
        }
    },
    userContact: async (req, res) => {
        try {
            let fileName = req.body.fileName;
            let filePath = path.join(__dirname, "../public/jsonFile/", fileName);

            if (fs.existsSync(filePath)) {
                var dataArr = require(filePath);

                var userContactsToCreate = [];
                for (let i in dataArr) {
                    var userObj = await db.users.findOne({
                        where: {
                            email: dataArr[i].primaryEmailAddress,
                            phone_number: dataArr[i].primaryPhoneNumber,
                        },
                    });

                    var existingUser = await db.user_contact.findOne({
                        where: {
                            [Op.and]: [
                                { phone_number: dataArr[i].primaryPhoneNumber },
                                { email: dataArr[i].primaryEmailAddress },
                                { user_id: req.user.id },
                            ],
                        },
                        raw: true,
                        nest: true,
                    });

                    if (!existingUser) {
                        userContactsToCreate.push({
                            first_name: dataArr[i].firstName,
                            last_name: dataArr[i].lastName,
                            phone_number: dataArr[i].primaryPhoneNumber,
                            email: dataArr[i].primaryEmailAddress,
                            user_id: req.user.id,
                            otherUser_id: userObj ? userObj.id : 0,
                        });
                    }
                }

                await db.user_contact.bulkCreate(userContactsToCreate);

                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error("Error deleting file:", err);
                        return helper.failed(res, "Error deleting file");
                    }
                    console.log("File deleted successfully");
                });

                return helper.success(res, "Users created successfully");
            } else {
                console.log(`File ${filePath} does not exist`);
                return helper.failed(res, "File does not exist");
            }
        } catch (error) {
            console.log(error, "error>>>>>>>>>>>>>>>>>>>>");
            return helper.failed(res, "Internal server error");
        }
    },
    contactUs:async(req,res)=>{
        try {
            let contactUsData = await Models.contactus.create({
                subject:req.body.subject,
                name:req.body.name,
                email:req.body.email,
                message:req.body.message
            })
            return helper.success(res,"user contact",contactUsData)
        } catch (error) {
            throw error
        }
    }




}