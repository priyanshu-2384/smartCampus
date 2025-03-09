const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Event = require("../models/Event.js");
const Group = require("../models/Group.js");
const User = require("../models/user.js");
const AttEntry = require("../models/AttEntry.js");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { spawn } = require("child_process");
const levenshtein = require("fast-levenshtein");
// const axios = require('axios');  


module.exports.leaderboard = async (req, res) => {
    let users = await User.find({});

    // Sort users based on the number of followers in descending order
    users.sort((a, b) => b.followers.length - a.followers.length);

    res.render("listings/leaderboard.ejs", { users });
};



module.exports.index = async (req, res) => {
    let allListings = await Listing.find({}).populate("owner").populate("likedBy").populate("bookmarkedBy");
    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }
    res.render("listings/index.ejs", { allListings,likeFlags,bookmarkFlags,category : "Recent Posts" });
};

module.exports.filter = async (req, res) => {
    let min = 0;
    let max = 1000000000;
    if (req.body.from && req.body.to) {
        min = req.body.from;
        max = req.body.to;
    }
    let totalListings = await Listing.find({}).populate("owner").populate("likedBy").populate("bookmarkedBy");
    let allListings = [];
    for (let listing of totalListings) {
        if (listing.price >= min && listing.price <= max) {
            allListings.push(listing);
        }
    }

    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }

    res.render("listings/index.ejs", { allListings,likeFlags,bookmarkFlags });
}

module.exports.createListingForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.filterShow = (req, res) => {
    res.render("filters/filterByPrice.ejs");
};

module.exports.mostReviewed = async (req, res) => {
    let allListings = await Listing.find().populate("owner").populate("likedBy").populate("bookmarkedBy");
    allListings.sort((a, b) => {
        return (a.reviews.length+a.likedBy.length+a.bookmarkedBy.length) - (b.reviews.length+b.likedBy.length+b.bookmarkedBy.length);
    });
    
    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }

    res.render("listings/index.ejs", { allListings, likeFlags, bookmarkFlags, category : "Trending"});
};

module.exports.showListings = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate({ path: "reviews", populate: [{ path: "author"},{ path : "replies", populate : "author"}]}).populate("owner").populate("likedBy").populate("bookmarkedBy");  //nested Population is used here (listing -> reviews -> author)
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let likeFlag = false;
    let bookmarkFlag = false;
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
            for (let j = 0; j < listing.likedBy.length; j++) {
                if (listing.likedBy[j].username == currUser.username) {
                    likeFlag = true;
                    break;
                }
            }

            for (let j = 0; j < listing.bookmarkedBy.length; j++) {
                if (listing.bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlag = true;
                    break;
                }
            }
        }
    res.render("listings/show.ejs", { listing, likeFlag, bookmarkFlag });
};

module.exports.createListing = async (req, res) => {
    console.log("Hello");
    let images = req.files.map(file => ({
        url: file.path,
        filename: file.filename
    }));
    let listingData = req.body.listing;
    let newListing = new Listing({
        ...listingData,
        owner: req.user._id,
        image: { list: images }
    });
    await newListing.save();

    let user = await User.findOne({ username: res.locals.currUser.username });
    user.posts.push(newListing);
    await user.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};


module.exports.editListingForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Post you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing});
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    let listing = req.body.listing;
    let x = await Listing.findByIdAndUpdate(id, { ...listing }, { new: true });
    req.flash("success", "Post Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndDelete(id).populate("owner");

    await Booking.deleteMany({ listing: listing._id });

    let user = await User.findOne({ username: listing.owner.username }).populate("posts");
    user.posts = user.posts.filter(post => post._id.toString() !== listing._id.toString());
    await user.save();

    req.flash("success", "Post Deleted!");
    res.redirect("/listings");
};


module.exports.search = async (req, res) => {
    let location = req.body.location;
    let listings = await Listing.find({}).populate("owner").populate("likedBy").populate("bookmarkedBy");
    let allListings = []
    for (let l of listings) {
        if (l.location.toLowerCase() == location.toLowerCase()) {
            allListings.push(l);
        }
    }
    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }

    res.render("listings/index.ejs", { allListings, likeFlags, bookmarkFlags, category : `Searched for ${location}`});
}

module.exports.like = async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findOne({ username: res.locals.currUser.username });
        let listing = await Listing.findById(id);
        user.liked.push(listing);
        user.save();
        console.log(user.username);
        listing.likedBy.push(user);
        listing.save();
        res.status(200).json({ likesCount: listing.likedBy.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to like the post" });
    }
}

module.exports.unlike = async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findOne({ username: res.locals.currUser.username }).populate("liked");
        let listing = await Listing.findById(id).populate("likedBy");

        for (let i = user.liked.length - 1; i >= 0; i--) {
            console.log(user.liked[i]._id);
            console.log(listing._id);
            if (user.liked[i]._id.toString() == listing._id.toString()) {
                user.liked.splice(i, 1); // Remove the element at index i
                break;
            }
        }
        user.save();
        for (let i = listing.likedBy.length - 1; i >= 0; i--) {
            if (listing.likedBy[i].username == user.username) {
                listing.likedBy.splice(i, 1); // Remove the element at index i
                break;
            }
        }
        listing.save();
        res.status(200).json({ likesCount: listing.likedBy.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to unlike the post" });
    }
}

module.exports.bookmark = async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findOne({ username: res.locals.currUser.username });
        let listing = await Listing.findById(id);
        user.bookmarks.push(listing);
        user.save();
        listing.bookmarkedBy.push(user);
        listing.save();
        res.status(200).json({ bookmarksCount: listing.bookmarkedBy.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to bookmark the post" });
    }
}

module.exports.unbookmark = async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findOne({ username: res.locals.currUser.username }).populate("bookmarks");
        let listing = await Listing.findById(id).populate("bookmarkedBy");

        for (let i = user.bookmarks.length - 1; i >= 0; i--) {
            if (user.bookmarks[i]._id.toString() == listing._id.toString()) {
                user.bookmarks.splice(i, 1); // Remove the element at index i
                break;
            }
        }
        user.save();
        for (let i = listing.bookmarkedBy.length - 1; i >= 0; i--) {
            if (listing.bookmarkedBy[i].username == user.username) {
                listing.bookmarkedBy.splice(i, 1); // Remove the element at index i
                break;
            }
        }
        listing.save();
        res.status(200).json({ bookmarksCount: listing.bookmarkedBy.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to unbookmark the post" });
    }
}

module.exports.sortByCategory = async (req,res) => {
    let {id} = req.params;
    let allListings = await Listing.find({category : id}).populate("owner").populate("likedBy").populate("bookmarkedBy");
    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }
    res.render("listings/index.ejs", { allListings,likeFlags,bookmarkFlags,category : id});
}


module.exports.myBookmarks = async (req, res) => {
    let currUser = await User.findOne({username : res.locals.currUser.username});
    let allListings = await Listing.find({ bookmarkedBy: { $in: [currUser._id] } }).populate("owner").populate("likedBy").populate("bookmarkedBy");
    let likeFlags = [];
    let bookmarkFlags = [];
    for (let i = 0; i < allListings.length; i++) {
        likeFlags[i] = false;
        bookmarkFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].likedBy.length; j++) {
                if (allListings[i].likedBy[j].username == currUser.username) {
                    likeFlags[i] = true;
                    break;
                }
            }
        }

        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].bookmarkedBy.length; j++) {
                if (allListings[i].bookmarkedBy[j].username == currUser.username) {
                    bookmarkFlags[i] = true;
                    break;
                }
            }
        }
    }
    res.render("listings/index.ejs", { allListings,likeFlags,bookmarkFlags,category : "Your Bookmarks" });
};

module.exports.myParticipated = async (req, res) => {
    let currUser = await User.findOne({username : res.locals.currUser.username});
    let allListings = await Event.find({ participants : { $in: [currUser._id] } }).populate('participants').populate('organisers').populate('conductedBy').populate({ path: "reviews", populate: [{ path: "author"},{ path : "replies", populate : {path : "author"}}]});
    let participantsFlags = [];
    let plans = []
    for (let i = 0; i < allListings.length; i++) {
        participantsFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].participants.length; j++) {
                if (allListings[i].participants[j].username == currUser.username) {
                    participantsFlags[i] = true;
                    plans.push(allListings[i]);
                    break;
                }
            }
        }
    }
    res.render("booking/dummy", { plans,participantsFlags ,category : "Your Participated Events" });
};

module.exports.myOrganised = async (req, res) => {
    let currUser = await User.findOne({username : res.locals.currUser.username});
    let allListings = await Event.find({ organisers: { $in: [currUser._id] } }).populate('participants').populate('organisers').populate('conductedBy').populate({ path: "reviews", populate: [{ path: "author"},{ path : "replies", populate : {path : "author"}}]});
    let organisedFlags = [];
    let plans = [];
    for (let i = 0; i < allListings.length; i++) {
        organisedFlags[i] = false;
    }
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = res.locals.currUser;
        for (let i = 0; i < allListings.length; i++) {
            for (let j = 0; j < allListings[i].organisers.length; j++) {
                if (allListings[i].organisers[j].username == currUser.username) {
                    organisedFlags[i] = true;
                    plans.push(allListings[i]);
                    break;
                }
            }
        }
    }
    res.render("booking/dummy", { plans,organisedFlags ,category : "Your Organised Events" });
};

module.exports.attendance = async (req, res) => {
    let currUser = await User.findOne({username : res.locals.currUser.username});
    let dEntries = await AttEntry.find({
        user: currUser._id,
        subject: "DSML"
    });
    let fEntries = await AttEntry.find({
        user: currUser._id,
        subject: "FDS"
    });
    let iEntries = await AttEntry.find({
        user: currUser._id,
        subject: "IOT"
    });
    let aEntries = await AttEntry.find({
        user: currUser._id,
        subject: "AI"
    });

    let d = 0;
    let f = 0; 
    let ia = 0;
    let a = 0;

    for (let i = 0; i < dEntries.length; i++) {
        if(dEntries[i].isPresent) {
            d++;
        }
    }
    for (let i = 0; i < fEntries.length; i++) {
        if(fEntries[i].isPresent) {
            f++;
        }
    }
    for (let i = 0; i < iEntries.length; i++) {
        if(iEntries[i].isPresent) {
            ia++;
        }
    }
    for (let i = 0; i < aEntries.length; i++) {
        if(aEntries[i].isPresent) {
            a++;
        }
    }
    d = (d/dEntries.length)*100;
    f = (f/fEntries.length)*100;
    ia = (ia/iEntries.length)*100;
    a = (a/aEntries.length)*100;

    d = 75;
    f = 83;
    ia = 56;
    a = 49;


    
    res.render("attendance/showAttendance", { d,f,ia,a});
}

module.exports.attendanceFilter = async (req, res) => {
   let students = [];
   res.render("attendance/updateAttendance", {students});
};

module.exports.attendanceFilter = async (req, res) => {
    console.log(req.body);
    let {c, subject, year, attendance} = req.body; 
     year = parseInt(year);
    let students = await User.find({});
    console.log(students);
    res.render("attendance/updateAttendance", {students});
};

const axios = require('axios');

module.exports.chat = async (req, res) => {
    let chat = [
        { user: 'Hello', bot: 'Hi' }
    ];

    // Extract the user message from the request
    const userMessage = req.body.user_message;

    try {
        // Send the user message to the FastAPI endpoint
        const response = await axios.post('http://localhost:8000/chat', {
            user_message: userMessage,
            role: 'user'  // Assuming the role is 'user'
        });

        // Push the response from the FastAPI endpoint into the chat array
        chat.push({ user: userMessage, bot: response.data.bot_reply });
    } catch (error) {
        console.error('Error fetching response from FastAPI:', error);
        chat.push({ user: userMessage, bot: 'Error fetching response from the server.' });
    }

    // Render the chat view with the updated chat array
    res.render("attendance/chat", { chat });
};



module.exports.mySchedule = async (req, res) => {
    let chat1 = [
      { Day: 'Monday', Subject: 'DSML', time: '8:00 - 9:00' },
      { Day: 'Monday', Subject: 'DAA', time: '9:00 - 10:00' },
      { Day: 'Tuesday', Subject: 'FDS', time: '7:00 - 8:00' },
      { Day: 'Wednesday', Subject: 'FDS', time: '3:00 - 4:00' },
      { Day: 'Wednesday', Subject: 'FDS', time: '4:00 - 5:00' },
    ];
  
    let chat2 = [
      { Day: 'Thursday', Subject: 'DAA', time: '10:00 - 11:00' },
      { Day: 'Thursday', Subject: 'FDS', time: '11:00 - 12:00' },
      { Day: 'Thursday', Subject: 'DSML', time: '12:00 - 1:00' },
      { Day: 'Friday', Subject: 'FDS', time: '12:00 - 1:00' },
      { Day: 'Friday', Subject: 'FDS', time: '1:00 - 2:00' },
    ];
  
    let chat3 = [
      { Day: 'Monday', Subject: 'DSML', time: '12:00 - 1:00' },
      { Day: 'Tuesday', Subject: 'DAA', time: '1:00 - 2:00' },
      { Day: 'Wednesday', Subject: 'FDS', time: '11:00 - 1:00' },
      { Day: 'Thursday', Subject: 'FDS', time: '7:00 - 8:00' },
      { Day: 'Friday', Subject: 'FDS', time: '7:00 - 8:00' },
    ];
  
    res.render("attendance/mySchedule", { chat1, chat2, chat3 });
  };

