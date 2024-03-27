var express = require("express");
var app = express();
const userRoute = require("./routes/userRoute");
const conversationRoute = require("./routes/conversationRoute");
const messageRoute = require("./routes/messageRoute");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const { isLogin } = require("./middleware/auth");
const User = require("./models/User");
const Conversation = require("./models/Conversation");

const server = require("http").createServer(app);
const io = require("socket.io")(server);

dotenv.config();

//Sử dụng session (để lưu thông tin user)
app.use(
   session({
      secret: process.env.SECRET_SESSION,
      resave: true,
      saveUninitialized: true,
   })
);

//dùng ejs
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const connectDB = async () => {
   try {
      const conn = await mongoose.connect(process.env.MONGO_URL);
      console.log("CONNECTED TO DATABASE SUCCESSFULLY");
   } catch (error) {
      console.error("COULD NOT CONNECT TO DATABASE:", error.message);
   }
};

connectDB();

app.get("/", isLogin, async function (req, res) {
   try {
      //lấy danh sách user và các cuộc trò chuyện
      const users = await User.find({ _id: { $nin: [req.session.user._id] } });
      const conversations = await Conversation.find({
         members: { $in: [req.session.user._id] },
      })
         .populate("members", "profilePicture isOnline username")
         .populate({
            path: "lastMessage.senderId",
            select: "username",
         })
         .sort({
            createdAt: "desc",
            "lastMessage.createdAt": "desc",
         });

      res.render("pages/index", {
         user: req.session.user,
         users: users,
         conversations: conversations,
         messages: undefined,
      });
   } catch (error) {
      console.log(error);
   }
});

//socket.io
const unp = io.of("/user-namespace");

unp.on("connection", async (socket) => {
   console.log("a user connected");

   //khi user connect thì set isOnline = '1'
   const userId = socket.handshake.auth.token;
   await User.findByIdAndUpdate({ _id: userId }, { $set: { isOnline: "1" } });
   const groupConversations = await Conversation.find({
      $and: [
         { members: userId }, // Chứa userId
         { $where: "this.members.length > 2" }, // Số lượng thành viên lớn hơn 2
      ],
   }).populate({
      path: "members", // Tên trường cần populate
      select: "isOnline", // Chỉ lấy trường isOnline
   });
   //bắn sự kiện để các client biết user đang online
   unp.emit("getOnlineUser", {
      user_id: userId,
      groupConversations: groupConversations,
   });

   //bắn sự kiện tạo phòng khi các client chọn 1 cuộc trò chuyện
   socket.emit("createRoom");

   socket.on("disconnect", async () => {
      //khi disconnect thì set isOnline = '0'
      const currentTime = new Date();
      //khi disconnect thì set isOnline = '0' và cập nhật lastSeen
      await User.findByIdAndUpdate(
         { _id: userId },
         { $set: { isOnline: "0", lastSeen: currentTime } }
      );
      //bắn sự kiện để các client biết user offline
      socket.broadcast.emit("getOfflineUser", {
         user_id: userId,
         groupConversations: groupConversations,
      });
      console.log("user disconnected");
   });

   //lắng nghe sự kiện khi người dùng nhắn tin
   socket.on("newChat", async (data) => {
      socket.to(data.conversationId).emit("loadNewChat", data);
      socket.broadcast.emit("loadLatestChat", data);
   });

   //lắng nghe sự kiện khi client chọn 1 cuộc trò chuyện thì tham gia vào room riêng theo conversationID
   socket.on("joinRoom", async (data) => {
      console.log("join ", data);
      socket.join(data);
   });

   socket.on("leaveRoom", async (data) => {
      console.log("leave ", data);
      socket.leave(data);
   });

   socket.on("newConversation", (data) => {
      socket.broadcast.emit("loadNewConversation", data);
   });

   //lắng nghe sự kiện khi người dùng thu hồi tin nhắn
   socket.on("recallMessage", (data) => {
      console.log(data);
      socket.to(data.conversationId).emit("loadDeleteMessage", data);
   });

   socket.on("deleteConversation", (data) => {
      console.log(data);
      socket.broadcast.emit("loadDeleteConversation", data);
   });

   socket.on("typing", function (data) {
      // Gửi lại thông báo đến tất cả các máy khách
      socket.broadcast.to(data.conversationId).emit("typingNotification", data);
   });
});

app.use("/", userRoute);
//dùng middleware isLogin để đảm bảo người dùng đã đăng nhập
app.use("/conversation", isLogin, conversationRoute);
app.use("/message", isLogin, messageRoute);

const PORT = process.env.PORT || 8080;

server.listen(PORT);
console.log(`Server is listening on port ${PORT}`);
