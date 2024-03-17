const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
   {
      username: {
         type: String,
      },
      email: {
         type: String,
         required: true,
         max: 50,
         unique: true,
      },
      password: {
         type: String,
         required: true,
         min: 6,
      },
      profilePicture: {
         type: String,
         default: "default_avatar.png",
      },
      isOnline: {
         type: String,
         default: "0",
      },
   },
   { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
