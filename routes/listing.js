const express = require('express');
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const Review = require('../models/review.js');
const listingController = require("../controllers/listing.js")
const multer = require('multer');
const {storage} = require('../cloudConfig.js');
const upload = multer({storage});   //multer will save the uploads , which are done using it in the cloud storage of cloudinary

//Index Route 
router.get("/", wrapAsync(listingController.index));
//Get Route Top Rated
router.get("/topRated", wrapAsync(listingController.mostReviewed));

//New Route
router.get("/new",isLoggedIn, listingController.createListingForm);
router.post("/",upload.array('images',5),validateListing, wrapAsync(listingController.createListing));

//search route
router.get("/leaderboard",isLoggedIn, listingController.leaderboard)
router.post("/city",listingController.search);
router.get("/myBookmarks",wrapAsync(listingController.myBookmarks));
router.get("/attendance",wrapAsync(listingController.attendance));
router.get("/mySchedule",wrapAsync(listingController.mySchedule));
router.get("/attendanceFilter",wrapAsync(listingController.attendanceFilter));
router.get("/chat",wrapAsync(listingController.chat));
router.post("/attendanceFilter",wrapAsync(listingController.attendanceFilter));
router.get("/participated",wrapAsync(listingController.myParticipated));
router.get("/organised",wrapAsync(listingController.myOrganised));

router.get("/recommendations/:id",wrapAsync(listingController.recommendations));
//filter by price
router.get("/filter", listingController.filterShow);
router.post("/filter/byPrice",wrapAsync(listingController.filter));

router.get("/categories/:id",wrapAsync(listingController.sortByCategory));

//Show Route,.... Always put this id route below as if not done, the routes which will be below this and have same url like : /listings/new here new will be intrepreted as id
router.get("/:id", wrapAsync(listingController.showListings));

//Edit route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.editListingForm));

//Update Route, PUT request
router.put("/:id",isLoggedIn,isOwner,upload.single('listing[image]'),validateListing, wrapAsync(listingController.editListing));

//Delete Route
router.delete("/:id",isLoggedIn,isOwner, wrapAsync(listingController.deleteListing));

//Like listing
router.post("/:id/like",isLoggedIn,wrapAsync(listingController.like));
//UnLike listing
router.post("/:id/unlike",isLoggedIn,wrapAsync(listingController.unlike));

//Bookmark listing
router.post("/:id/bookmark",isLoggedIn,wrapAsync(listingController.bookmark));
//UnBookmark listing
router.post("/:id/unbookmark",isLoggedIn,wrapAsync(listingController.unbookmark));


module.exports = router;