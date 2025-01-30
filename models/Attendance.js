const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    allEntries : {
        type : Schema.Types.ObjectId,
        ref : "AttEntry"
    }
});

const Attendance = mongoose.model("Attendance",attendanceSchema);
module.exports = Attendance;
