const User = require("../models/user.js");
const Booking = require('../models/booking.js');
const Event = require('../models/Event.js');
const Review = require("../models/review.js");
const Group = require('../models/Group.js')
const axios = require('axios');
const { STATES } = require("mongoose");

module.exports.getAllGroups = async (req, res) => {
    let groups = await Group.find({}).populate('participants').populate('tags').populate({ path: "reviews", populate: [{ path: "author"},{ path : "replies", populate : {path : "author"}}]});
    res.render("groups/groupList", {groups});
}

module.exports.getCreateGroup = async (req, res) => {
    res.render("groups/createGroup");
}

module.exports.getGroup = async (req, res) => {
    let {id} = req.params;
    let user = await User.findOne({username : res.locals.currUser.username});
    let group = await Group.findById(id).populate('participants').populate('createdBy').populate({ path: "reviews", populate: [{ path: "author"},{ path : "replies", populate : {path : "author"}}]});
    if(!group) {
        req.flash("error", "Group you requested for does not exist! Create your owns");
        res.redirect("/getGroups");
    }
    let isUserInterested = false;
    for(let i=0; i<group.participants.length; i++) {
        if(group.participants[i]._id.toString()==user._id.toString()) {
            isUserInterested = true;
            break;
        }
    }
  res.render("groups/showGroup", {group, isUserInterested});
}

module.exports.createGroup = async (req, res) => {
  try {
      let { id: username } = req.params;
      console.log(username);
      let user = await User.findOne({ username });

      if (!user) {
          req.flash("error", "User not found.");
          return res.redirect("/getGroups");
      }

      const { name, description } = req.body.group;
      const tags = req.body.tags ? req.body.tags.split(",") : [];

      let newGroup = new Group({
          name,
          description,
          tags,
          createdBy: user._id,
      });

      if (req.file) {
          newGroup.image = {
              url: req.file.path,
              filename: req.file.filename,
          };
      }

      await newGroup.save();
      req.flash("success", "Group created successfully!");
      res.redirect(`/getGroups`);
  } catch (error) {
      console.error(error);
      req.flash("error", "Something went wrong.");
      res.redirect("/getGroups");
  }
};


module.exports.addUser = async (req, res) => {
    let { id, userId } = req.params;

    try {
        const group = await Group.findById(id);
        const user = await User.findById(userId);

        if (!group || !user) {
            if (req.xhr) return res.json({ success: false, message: "Group or user not found" });
            req.flash("error", "Group or user not found");
            return res.redirect(`/getGroups/group/${id}`);
        }

        // Add user to group only if they are not already in it
        if (!group.participants.includes(userId)) {
            group.participants.push(userId);
            await group.save();
        }

        if (req.xhr) {
            return res.json({ success: true });
        } else {
            req.flash("success", "Group Joined!");
            return res.redirect(`/getGroups/group/${id}`);
        }
    } catch (error) {
        console.error(error);
        if (req.xhr) {
            return res.json({ success: false, message: "Something went wrong!" });
        } else {
            req.flash("error", "Something went wrong!");
            return res.redirect(`/getGroups/group/${id}`);
        }
    }
};

module.exports.removeUser = async (req, res) => {
    let { id, userId } = req.params;

    try {
        const group = await Group.findById(id);
        if (!group) {
            if (req.xhr) return res.json({ success: false, message: "Group not found" });
            req.flash("error", "Group not found");
            return res.redirect(`/getGroups/group/${id}`);
        }

        // Remove user from group
        group.participants = group.participants.filter(uId => uId.toString() !== userId);
        await group.save();

        if (req.xhr) {
            return res.json({ success: true });
        } else {
            req.flash("success", "Group Left!");
            return res.redirect(`/getGroups/group/${id}`);
        }
    } catch (error) {
        console.error(error);
        if (req.xhr) {
            return res.json({ success: false, message: "Something went wrong!" });
        } else {
            req.flash("error", "Something went wrong!");
            return res.redirect(`/getGroups/group/${id}`);
        }
    }
};

module.exports.createReview = async (req,res)=> {
    let {id} = req.params;
    let group = await Group.findById(id);
    let newReview = new Review();
    newReview.comment = req.body.comment;
    newReview.author = req.params.userId;
    group.reviews.push(newReview);
    await newReview.save();
    await group.save();
    req.flash("success", "Message Send!");
    res.redirect(`/getGroups/group/${id}`);
};

