const router = require("express").Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { uploadFile } = require("../upload");

//add

router.post("/", async (req, res) => {
   const newMessage = new Message(req.body);

   try {
      const savedMessage = await newMessage.save();

      const { message, createdAt, sender } = savedMessage;

      // Cập nhật conversation tương ứng
      await Conversation.findByIdAndUpdate(req.body.conversationId, {
         lastMessage: {
            message,
            createdAt,
            senderId: sender,
         },
      });

      const user = await User.findById(sender);
      const result = {
         ...savedMessage._doc,
         senderName: user.username,
      };
      res.status(200).send({ success: true, message: result });
   } catch (err) {
      res.status(500).send({ success: false, message: err.message });
   }
});

router.post("/upload", uploadFile.single("file"), async (req, res) => {
   let newMessage = null;
   if (req.fileError) {
      console.log("error");
   } else {
      const fileExtension = req.fileExtension.toLowerCase();
      if (
         fileExtension === ".jpg" ||
         fileExtension === ".jpeg" ||
         fileExtension === ".png" ||
         fileExtension === ".gif"
      ) {
         newMessage = new Message({
            message: req.file.originalname,
            conversationId: req.body.conversationId,
            sender: req.body.sender,
            image: req.filename,
         });
      } else {
         newMessage = new Message({
            message: req.file.originalname,
            conversationId: req.body.conversationId,
            sender: req.body.sender,
            file: req.filename,
         });
      }
   }

   try {
      const savedMessage = await newMessage.save();
      if (savedMessage.file == undefined) {
         const { createdAt, sender } = savedMessage;
         // Cập nhật conversation tương ứng
         await Conversation.findByIdAndUpdate(req.body.conversationId, {
            lastMessage: {
               message: "hình ảnh",
               createdAt,
               senderId: sender,
            },
         });
      } else {
         const { createdAt, sender } = savedMessage;
         // Cập nhật conversation tương ứng
         await Conversation.findByIdAndUpdate(req.body.conversationId, {
            lastMessage: {
               message: "file đính kèm",
               createdAt,
               senderId: sender,
            },
         });
      }

      const user = await User.findById(req.body.sender);
      const result = {
         ...savedMessage._doc,
         senderName: user.username,
      };
      res.status(200).send({ success: true, message: result });
   } catch (err) {
      res.status(500).send({ success: false, message: err.message });
   }
});

router.put("/delete/:id", async (req, res) => {
   try {
      const message = await Message.findById(req.params.id);
      if (!message) {
         throw new Error("Không tìm thấy tin nhắn");
      }

      message.isRecalled = true;
      await message.save();
      res.status(200).send({
         success: true,
         conversationId: message.conversationId,
         message: "Tin nhắn đã bị thu hồi",
      });
   } catch (error) {
      console.error("Lỗi khi thu hồi tin nhắn:", error);
   }
});

module.exports = router;
