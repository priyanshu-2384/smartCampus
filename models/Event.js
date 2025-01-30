const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    name : String,
    contact : Number,
    conductedBy: {
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
    email : {
        type : String,
    },
    participants :[
        {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    ],
    organisers : [
        {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    ],
    description : {
        type : String,
        default : "Explorer of new horizons, capturing moments from every journey. Join me as I share my adventures and discover the world's hidden gems. 🌍✨"
    },
    
    liked : [{
        type : Schema.Types.ObjectId,
        ref : "Listing"
    }],
    objectives : String,
    rules : String,
    prizes : String,
    location : String,
    startdate : Date,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    endDate : Date,
     //username and password are automatically created by passport library 
});

const Event = mongoose.model("Event",eventSchema);
module.exports = Event;
