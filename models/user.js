const mongoose = require("mongoose")

const userschema = new mongoose.Schema(
    {
        username : {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            unique: true
        },
        email : {
           type: String,
           required: true,
           lowercase: true,
           trim: true,
           match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
           unique: true,
        },
        password : {
            type : String,
           required: true,
           minlength: 6
        }
    },{timestamps:true})

const user = mongoose.model("user" , userschema)

module.exports = user