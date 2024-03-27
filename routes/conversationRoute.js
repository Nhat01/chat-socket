const router = require("express").Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

//new conv

router.post("/", async (req, res) => {
   if (Array.isArray(req.body.selectOptions)) {
      const existConversation = await Conversation.findOne({
         members: { $all: [...req.body.selectOptions, req.body.user_id] },
      });
      if (existConversation) {
         res.status(200).send({
            success: false,
            message: "Conversation existed",
         });
      } else {
         const newConversation = new Conversation({
            name: req.body.name,
            members: [...req.body.selectOptions, req.body.user_id],
         });
         try {
            const savedConversation = await newConversation.save();
            const conversation = await Conversation.findById(
               savedConversation._id
            ).populate({
               path: "members",
               select: "profilePicture isOnline username",
            });

            res.status(200).send({
               success: true,
               message: conversation,
            });
         } catch (err) {
            res.status(200).send({ success: false, message: err });
         }
      }
   } else {
      const existConversation = await Conversation.findOne({
         $and: [
            { members: { $all: [req.body.selectOptions, req.body.user_id] } }, // Tìm các cuộc trò chuyện mà user_id là một trong các thành viên
            { members: { $size: 2 } }, // Kiểm tra xem số lượng thành viên không phải là 2
         ],
      });
      console.log(existConversation);
      if (existConversation) {
         res.status(200).send({
            success: false,
            message: "Conversation existed",
         });
      } else {
         const user = await User.findById(req.body.selectOptions);
         const newConversation = new Conversation({
            name: user.username,
            members: [req.body.selectOptions, req.body.user_id],
         });
         try {
            const savedConversation = await newConversation.save();
            const conversation = await Conversation.findById(
               savedConversation._id
            ).populate({
               path: "members",
               select: "profilePicture isOnline username",
            });
            res.status(200).send({
               success: true,
               message: conversation,
            });
         } catch (err) {
            res.status(200).send({ success: false, message: err });
         }
      }
   }
});

router.get("/:id", async (req, res) => {
   try {
      const users = await User.find({ _id: { $nin: [req.session.user._id] } });
      const conversation = await Conversation.findById(req.params.id).populate({
         path: "members",
         select: "profilePicture isOnline username",
      });
      const conversations = await Conversation.find({
         members: { $in: [req.session.user._id] },
      })
         .populate("members", "profilePicture isOnline username")
         .sort({
            createdAt: "desc",
            "lastMessage.createdAt": "desc",
         })
         .populate({
            path: "lastMessage.senderId",
            select: "username",
         });
      const messages = await Message.find({
         conversationId: req.params.id,
         isRecalled: false,
      }).sort({
         createdAt: "asc",
      });
      res.render("pages/conversation", {
         user: req.session.user,
         users: users,
         conversations: conversations,
         messages: messages,
         conversation: conversation,
      });
   } catch (err) {
      res.status(500).json(err);
   }
});

// get conv includes two userId
router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
   try {
      const conversation = await Conversation.findOne({
         members: { $all: [req.params.firstUserId, req.params.secondUserId] },
      });
      res.status(200).json(conversation);
   } catch (err) {
      res.status(500).json(err);
   }
});

router.delete("/delete/:conversationId", async function (req, res) {
   try {
      await Conversation.deleteOne({ _id: req.params.conversationId });
      res.status(200).send({ success: true, message: "ok" });
   } catch (err) {
      res.status(500).send({ success: false, message: "ok" });
   }
});

module.exports = router;
