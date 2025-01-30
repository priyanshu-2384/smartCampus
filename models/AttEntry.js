const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attEntrySchema = new Schema({
    attendance : {
        type : Schema.Types.ObjectId,
        ref : "Attendance"
    },
    user : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    subject : {
        type: String,
        enum: [
            "DSML",
            "FDS",
            "AI",
            "IOT" 
        ],
        required: true,
    },
    doc : Date,
    isPresent : Boolean,
});

const AttEntry = mongoose.model("AttEntry",attEntrySchema);
module.exports = AttEntry;
