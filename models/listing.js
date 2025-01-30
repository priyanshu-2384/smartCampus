const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        list: [{
            url: String,
            filename: String
        }],
    },
    category: {
        type: String,
        enum: [
            "Event Updates",
            "Student Achievements",
            "Miscellaneous",
        ],
        required: true,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    likedBy: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    bookmarkedBy: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    date : {
        type : Date,
        default : Date.now()
    },
    location : String,
});

//post mongoose middleware
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing.reviews) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;