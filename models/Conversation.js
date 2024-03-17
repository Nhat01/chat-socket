const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
   {
      name: {
         type: String,
      },
      members: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
      lastMessage: {
         message: String,
         createdAt: Date,
         senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
   },
   { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
