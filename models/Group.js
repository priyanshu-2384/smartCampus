const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    name : String,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    image: {
        url : {
            type : String,
            default : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
        },
        filename : String,
    },
    participants :[
        {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    ],
    description : {
        type : String,
        default : "Explorer of new horizons, capturing moments from every journey. Join me as I share my adventures and discover the world's hidden gems. 🌍✨"
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    tags : [{
        type : String,
    }],
    createdAt: {
        type : Date,
        default : Date.now()
    },
     //username and password are automatically created by passport library 
});

const Group = mongoose.model("Group",groupSchema);
module.exports = Group;
