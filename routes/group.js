const express = require('express');
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const Booking = require('../models/booking.js');
const { saveRedirectUrl,isAvailable, isLoggedIn } = require('../middleware.js');
const groupController = require('../controllers/group.js');
const multer = require('multer');
const {storage} = require('../cloudConfig.js');
const upload = multer({storage});   //multer will save the uploads , which are done using it in the cloud storage of cloudinary
const Group = require('../models/Group.js');


router.get("/",isLoggedIn, wrapAsync(groupController.getAllGroups));
router.get("/group/:id",isLoggedIn, wrapAsync(groupController.getGroup));
router.get("/createGroup",isLoggedIn, wrapAsync(groupController.getCreateGroup));

router.post("/createGroup/:id",isLoggedIn,upload.single('group[image]'), wrapAsync(groupController.createGroup));
module.exports = router;