const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Event = require("../models/Event.js");
const Group = require("../models/Group.js");
const AttEntry = require("../models/AttEntry.js");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { spawn } = require("child_process");
const levenshtein = require("fast-levenshtein");
module.exports.signupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.home = async (req, res) => {
    console.log("hhhko");

    let allListings = await Listing.find({}).populate("owner").populate("likedBy").populate("bookmarkedBy").limit(3);
    allListings = allListings.reverse(); // Reverse the array

    let events = await Event.find({}).limit(3);
    events = events.reverse();

    let groups = await Group.find({});
    let currUser = res.locals.currUser;
    let interests = currUser.interests;
    let newGroupsList = [];

    // Function to check if two words are similar based on Levenshtein distance
    function isSimilar(str1, str2) {
        const threshold = 2; // Allow up to 2 edits (you can tweak this value)
        return levenshtein.get(str1.toLowerCase(), str2.toLowerCase()) <= threshold;
    }

    // Filtering groups based on user's interests with fuzzy matching
    for (let group of groups) {
        if (group.tags.some(tag => interests.some(interest => isSimilar(tag, interest)))) {
            newGroupsList.push(group);
            console.log(group.name);
        }
    }

    // If the filtered groups are less than 3, add random groups
    if (newGroupsList.length < 3) {
        let remainingGroups = groups.filter(group => !newGroupsList.includes(group));
        let x = 0;
        while(newGroupsList.length < 3 && x<remainingGroups.length)  {
            newGroupsList.push(remainingGroups[x]);
            x++;
        }
    }
    groups = newGroupsList.reverse();
    
    res.render("listings/home.ejs", { allListings, events, groups });
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password ,role } = req.body;
        const newUser = new User({ email, username , role});
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to SmartCamp!");
            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.loginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to SmartCamp, You are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/plan";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged you out!");
        res.redirect("/listings");
    });
};

//user profile
module.exports.profile = async (req, res) => {
    let username = req.user.username;
    let currUser = await User.findOne({ username: username });
    res.render("users/profile.ejs", { currUser });
}

module.exports.editProfile = async (req, res) => {
    let { id: username } = req.params;
    let userInfo = req.body.currUser;
    const tags = req.body.tags ? req.body.tags.split(",") : [];
    userInfo.interests = tags;
    let u = await User.findOne({ username: username });
    let x = await User.findByIdAndUpdate(u._id, { ...userInfo }, { new: true });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        x.image = { url, filename };
        await x.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/profile`);
};

//User profile by username
module.exports.userProfile = async (req, res) => {
    let { id: username } = req.params;
    let flag = false;
    if (typeof res.locals.currUser !== 'undefined') {
        let currUser = await User.findOne({ username: res.locals.currUser.username }).populate("following");
        let isFollow = () => {
            for (let i = 0; i < currUser.following.length; i++) {
                if (currUser.following[i].username == username) {
                    return 1;
                }
            }
            return 0;
        }
        flag = isFollow();
    }
    let user = await User.findOne({ username: username }).populate("posts");
    res.render("users/userProfile.ejs", { user, flag });

}

//user follow

module.exports.userFollow = async (req, res) => {
    try {
        let { id: username } = req.params;
        let user = await User.findOne({ username: username });
        let currUser = await User.findOne({ username: res.locals.currUser.username }).populate("following");
        if (user.username == currUser.username) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }
        user.followers.push(currUser);
        user.save();
        currUser.following.push(user);
        currUser.save();
        res.status(200).json({ followersCount: user.followers.length })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to follow the user." });
    }
}

module.exports.userUnfollow = async (req, res) => {
    try {
        let { id: username } = req.params;
        let user = await User.findOne({ username: username }).populate("followers");
        let currUser = await User.findOne({ username: res.locals.currUser.username }).populate("following");
        if (user.username == currUser.username) {
            return res.status(400).json({ message: "You cannot follow yourself." });;
        }
        for (let i = user.followers.length - 1; i >= 0; i--) {
            if (user.followers[i].username == currUser.username) {
                user.followers.splice(i, 1); // Remove the element at index i
            }
        }
        user.save();
        for (let i = currUser.following.length - 1; i >= 0; i--) {
            if (currUser.following[i].username == user.username) {
                currUser.following.splice(i, 1); // Remove the element at index i
            }
        }
        currUser.save();
        res.status(200).json({ followersCount: user.followers.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while trying to unfollow the user." });
    }
}

module.exports.getFollowers = async (req,res) => {
    let { id: username } = req.params;
    let user = await User.findOne({ username: username }).populate("followers");
    res.render("users/listUser.ejs", {data : "Followers", users : user.followers});
}

module.exports.getFollowing = async (req,res) => {
    let { id: username } = req.params;
    let user = await User.findOne({ username: username }).populate("following");
    res.render("users/listUser.ejs", {data : "Following", users : user.following});
}

