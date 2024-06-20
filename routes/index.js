var express = require('express');
var router = express.Router();
const userapiRouter=require('../controller/userapiController')
const {jwtauthMiddleware}=require('../jwt')


router.post('/signUp',userapiRouter.signUp);
router.post('/verifyOtp',userapiRouter.verifyOtp);
router.post('/completeProfile',jwtauthMiddleware,userapiRouter.completeProfile);
router.post('/notification',jwtauthMiddleware,userapiRouter.notification)
router.get('/getProfile',jwtauthMiddleware,userapiRouter.getProfile);
router.post('/profileUpdate',jwtauthMiddleware,userapiRouter.profileUpdate)
router.post('/deleteSchedule/:id',userapiRouter.deleteSchedule)
router.get('/cmsView',userapiRouter.cmsView);
router.post('/sendFriendRequest',jwtauthMiddleware,userapiRouter.sendFriendRequest)
router.post('/updateRequestStatus',userapiRouter.updateRequestStatus)
router.get('/friendListing',jwtauthMiddleware,userapiRouter.friendListing)
router.get('/blockUserListing',jwtauthMiddleware,userapiRouter.blockUserListing)
router.post('/userBlock',jwtauthMiddleware,userapiRouter.userBlock)
router.post('/uploadContact',userapiRouter.uploadContact)
router.post('/resendOtp',userapiRouter.resendOtp)
router.post('/contactUs',userapiRouter.contactUs)
router.post('/createSchedule',userapiRouter.createSchedule)
router.post('/updateSchedule',jwtauthMiddleware,userapiRouter.updateSchedule)
module.exports = router;
