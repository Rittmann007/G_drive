const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema({
    filename : {
        type: String,
        required: true
    },
    originalname : {
        type: String,
        required: true
    },
    fileid: {
        type: String,
        required: true
    },
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
},{timestamps: true})

const file = mongoose.model("file",fileSchema)

module.exports = file