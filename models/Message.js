const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
   {
      conversationId: {
         type: String,
      },
      sender: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      message: {
         type: String,
      },
      isRecalled: {
         type: Boolean,
         default: false, // Mặc định là false, tức là tin nhắn chưa được thu hồi
      },
   },
   { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
