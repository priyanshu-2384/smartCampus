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
  console.log("ifbed");
  let id = req.params.id;
  let group = await Group.findById(id);
  res.render("groups/showGroup", {group});
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

